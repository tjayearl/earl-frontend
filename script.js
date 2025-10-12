// ✅ Make sure this matches your live Render backend
const BASE_URL = "https://earl-backend.onrender.com";

const chatForm = document.getElementById("chat-form");
const chatInput = document.getElementById("chat-input");
const chatBox = document.getElementById("chat-box");

const reminderForm = document.getElementById("reminder-form");
const reminderInput = document.getElementById("reminder-input");
const reminderList = document.getElementById("reminder-list");

const clearChatBtn = document.getElementById("clear-chat-btn");
const clearRemindersBtn = document.getElementById("clear-reminders-btn");

const navLinks = document.querySelectorAll(".nav-link");
const pages = document.querySelectorAll(".page");
const dashboardCards = document.querySelectorAll(".dashboard-card");
const navSound = document.getElementById("nav-sound");
const modeSelect = document.getElementById("mode-select");
const modeIcon = document.getElementById("mode-indicator-icon");
const appContainer = document.getElementById("app-container");
const energyLevel = document.getElementById("energy-level");


let isInitialPageLoad = true;

// ✅ Handle page navigation
function showPage(pageId) {
  const currentPage = document.querySelector('.page.active');
  // Hide all pages and deactivate all links
  pages.forEach((page) => page.classList.remove("active"));
  navLinks.forEach((link) => link.classList.remove("active"));

  // Save last visited page
  if (!isInitialPageLoad) localStorage.setItem('lastVisitedPage', pageId);

  // Show the target page
  const targetPage = document.getElementById(pageId);
  if (targetPage) {
    targetPage.classList.add("active");
  }

  // Activate the corresponding nav link
  const targetLink = document.querySelector(`.nav-link[data-page="${pageId}"]`);
  if (targetLink) {
    targetLink.classList.add("active");
  }

  // Play sound on navigation, but not on initial load
  if (getAiSettings().systemSounds && !isInitialPageLoad && (!currentPage || currentPage.id !== pageId)) {
    if (navSound) {
      navSound.currentTime = 0;
      navSound.play().catch(e => console.error("Sound play failed:", e));
    }
  }
}

navLinks.forEach((link) => {
  link.addEventListener("click", (e) => {
    e.preventDefault(); // Prevent URL change
    const pageId = e.target.dataset.page;
    showPage(pageId);
  });
});

// ✅ Handle dashboard card clicks
dashboardCards.forEach((card) => {
  card.addEventListener("click", (e) => {
    const pageId = e.currentTarget.dataset.page;
    showPage(pageId);
  });
});

// ✅ Typewriter effect for E.A.R.L's messages
function typewriter(element, text, onComplete) {
  let i = 0;
  element.textContent = "";
  const typing = () => {
    if (i < text.length) {
      element.textContent += text.charAt(i);
      i++;
      chatBox.scrollTop = chatBox.scrollHeight; // Keep scrolling
      setTimeout(typing, 25); // Adjust typing speed here
    } else if (onComplete) {
      onComplete();
    }
  };
  typing();
}

// ✅ Adds message to chat UI
function addMessage(sender, text, useTypewriter = false) {
  const wrapper = document.createElement("div");
  wrapper.classList.add("message-wrapper");

  const content = document.createElement("div");
  content.classList.add("message-content");

  const messageDiv = document.createElement("div");
  messageDiv.classList.add("message");

  if (sender === "You") {
    wrapper.classList.add("user-message-wrapper");
    messageDiv.classList.add("user-message");
  } else {
    wrapper.classList.add("earl-message-wrapper");
    messageDiv.classList.add("earl-message");

    const avatar = document.createElement("div");
    avatar.classList.add("avatar");
    avatar.textContent = "E"; // E.A.R.L's initial
    wrapper.appendChild(avatar);
  }

  const p = document.createElement("p");
  messageDiv.appendChild(p);
  content.appendChild(messageDiv);

  const timestamp = document.createElement("div");
  timestamp.classList.add("timestamp");
  const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  timestamp.textContent = time;
  content.appendChild(timestamp);

  wrapper.appendChild(content);
  chatBox.appendChild(wrapper);

  if (sender === "E.A.R.L" && useTypewriter) {
    messageDiv.classList.add("animate-pulse");
    typewriter(p, text, () => { chatBox.scrollTop = chatBox.scrollHeight; });
  } else {
    p.textContent = text;
    chatBox.scrollTop = chatBox.scrollHeight;
  }
}

// ✅ Shows a "typing..." indicator
function showTypingIndicator() {
  const wrapper = document.createElement("div");
  wrapper.classList.add("message-wrapper", "earl-message-wrapper", "typing-indicator");

  const avatar = document.createElement("div");
  avatar.classList.add("avatar");
  avatar.textContent = "E";
  wrapper.appendChild(avatar);

  const content = document.createElement("div");
  content.classList.add("message-content");
  content.innerHTML = `<div class="message earl-message"><p><span>.</span><span>.</span><span>.</span></p></div>`;
  wrapper.appendChild(content);

  chatBox.appendChild(wrapper);
  chatBox.scrollTop = chatBox.scrollHeight;
}

// ✅ Hides the "typing..." indicator
function hideTypingIndicator() {
  const indicator = document.querySelector(".typing-indicator");
  if (indicator) {
    indicator.remove();
  }
}

// ✅ Handle chat form submit
chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const message = chatInput.value.trim();
  if (!message) return;

  addMessage("You", message, false);
  StatsTracker.logActivity('chat'); // Log chat activity
  chatInput.value = "";

  showTypingIndicator();

  try {
    // Get the latest AI settings
    const settings = getAiSettings();

    const res = await fetch(`${BASE_URL}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // Send message and personality settings to the backend
      body: JSON.stringify({ message, settings }),
    });
    if (!res.ok) {
      throw new Error(`Server error: ${res.status}`);
    }
    const data = await res.json();
    console.log("E.A.R.L replied:", data.reply);
    addMessage("E.A.R.L", data.reply, getAiSettings().typingAnimation); // Use typewriter for new replies
  } catch (err) {
    console.error("Chat error:", err);
    addMessage("E.A.R.L", "⚠️ I couldn't reach my brain. Try again.", getAiSettings().typingAnimation);
  } finally {
    // This runs whether the try succeeds or fails
    hideTypingIndicator();
  }
});

// ✅ Handle reminder form submit
reminderForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const text = reminderInput.value.trim();
  if (!text) return;

  StatsTracker.logActivity('reminder'); // Log reminder activity
  try {
    const res = await fetch(`${BASE_URL}/reminders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });

    if (!res.ok) {
      throw new Error(`Reminder POST error: ${res.status}`);
    }

    reminderInput.value = "";
    loadReminders();
  } catch (err) {
    console.error("Reminder error:", err);
    alert("⚠️ Failed to add reminder.");
  }
});

// ✅ Load all reminders
async function loadReminders() {
  try {
    const res = await fetch(`${BASE_URL}/reminders`);
    const reminders = await res.json();

    reminderList.innerHTML = "";
    reminders.forEach((r) => {
      const li = document.createElement("li");
      const textSpan = document.createElement("span");
      textSpan.textContent = r.text;
      const checkDiv = document.createElement("div");
      checkDiv.className = "reminder-check";
      li.appendChild(textSpan);
      li.appendChild(checkDiv);
      li.addEventListener("click", () => deleteReminder(r.id));
      reminderList.appendChild(li);
    });
  } catch (err) {
    console.error("Load reminders failed:", err);
    reminderList.innerHTML = "<li>⚠️ Failed to load reminders</li>";
  }
}

// ✅ Delete reminder
async function deleteReminder(id) {
  // Added confirmation for single delete for consistency
  if (!confirm("Are you sure you want to delete this reminder?")) {
    return;
  }
  try {
    const res = await fetch(`${BASE_URL}/reminders/${id}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      throw new Error(`Server error: ${res.status}`);
    }
    loadReminders();
  } catch (err) {
    console.error("Delete reminder failed:", err);
    alert("⚠️ Failed to delete reminder.");
  }
}

// ✅ Clear all reminders
async function clearAllReminders() {
  if (!confirm("Are you sure you want to delete ALL reminders? This cannot be undone.")) {
    return;
  }

  try {
    const res = await fetch(`${BASE_URL}/reminders`, {
      method: "DELETE",
    });

    if (!res.ok) {
      throw new Error(`Server error: ${res.status}`);
    }

    loadReminders(); // This will clear and reload the (now empty) list
  } catch (err) {
    console.error("Failed to clear reminders:", err);
    alert("⚠️ Failed to clear reminders.");
  }
}

// ✅ Clear chat history
async function clearChat() {
  if (!confirm("Are you sure you want to clear the entire chat history? This cannot be undone.")) {
    return;
  }

  try {
    const res = await fetch(`${BASE_URL}/chat/history`, {
      method: "DELETE",
    });

    if (!res.ok) throw new Error(`Server error: ${res.status}`);

    chatBox.innerHTML = ""; // Clear the UI immediately
    addMessage("E.A.R.L", "Chat history cleared.", getAiSettings().typingAnimation);
  } catch (err) {
    console.error("Failed to clear chat:", err);
    addMessage("E.A.R.L", "⚠️ Oops, I couldn't clear the chat history.", getAiSettings().typingAnimation);
  }
}

// ✅ Calculator Logic for Complex Expressions
const calculator = document.querySelector('.calculator-grid');
const calculatorDisplay = calculator.querySelector('.calculator-display');
const calculatorKeys = calculator.querySelector('.calculator-keys');

let currentExpression = '0';
let isResultDisplayed = false;

function updateDisplay() {
  // To prevent overflow, we can add a class to shrink font if needed,
  // but for now, just updating text is fine.
  calculatorDisplay.textContent = currentExpression;
}

function evaluateExpression(expression) {
  // Map display symbols and functions to their JavaScript Math equivalents
  const replacements = {
    '×': '*',
    '÷': '/',
    '√': 'Math.sqrt',
    'sin': 'Math.sin',
    'cos': 'Math.cos',
    'tan': 'Math.tan',
    'log': 'Math.log10',
    'π': 'Math.PI',
    '^': '**',
  };

  // Create a regex to find all keys that need replacement
  const regex = new RegExp(Object.keys(replacements).join('|'), 'g');
  let sanitizedExpression = expression.replace(regex, match => replacements[match]);

  // Whitelist of allowed characters and patterns in the final expression
  const allowedPatterns = [
    /Math\.(sqrt|sin|cos|tan|log10|PI)/g,
    /[0-9\.\+\-\*\/\(\)\s\*\*]/g, // Numbers, operators, parens
  ];

  // Strip out all allowed patterns, what's left is invalid.
  let tempExpression = sanitizedExpression;
  allowedPatterns.forEach(pattern => {
    tempExpression = tempExpression.replace(pattern, '');
  });

  // If anything is left, the expression is invalid.
  if (tempExpression.length > 0) {
    console.error("Invalid characters detected:", tempExpression);
    throw new Error('Invalid Expression');
  }

  try {
    // Use the Function constructor for safer evaluation
    const result = new Function('return ' + sanitizedExpression)();
    if (isNaN(result) || !isFinite(result)) {
      throw new Error('Invalid Calculation');
    }
    // Round to avoid floating point inaccuracies
    return parseFloat(result.toPrecision(12));
  } catch (error) {
    console.error("Evaluation error:", error);
    throw new Error('Calculation Error');
  }
}

function handleKeyPress(key, type) {
  const lastChar = currentExpression.slice(-1);

  if (type === 'number' || type === 'constant') {
    if (currentExpression === '0' || isResultDisplayed) {
      currentExpression = key;
      isResultDisplayed = false;
    } else if (!['π', ')'].includes(lastChar)) { // Prevent 2π or (5)π
      currentExpression += key;
    }
  } else if (type === 'operator') {
    isResultDisplayed = false;
    // Allow negative numbers, but don't stack operators
    if (['+', '×', '÷', '^'].includes(lastChar) && key !== '-') {
      currentExpression = currentExpression.slice(0, -1) + key;
    } else {
      currentExpression += key;
    }
  } else if (type === 'function') {
    const func = key + '(';
    if (currentExpression === '0' || isResultDisplayed) {
      currentExpression = func;
      isResultDisplayed = false;
    } else if (['+', '-', '×', '÷', '(', '^'].includes(lastChar)) {
      currentExpression += func;
    }
  } else if (type === 'parenthesis') {
    if (currentExpression === '0' || isResultDisplayed) {
      currentExpression = key;
      isResultDisplayed = false;
    } else {
      currentExpression += key;
    }
  } else if (type === 'decimal') {
    if (isResultDisplayed) {
      currentExpression = '0.';
      isResultDisplayed = false;
    }
    // Prevent multiple decimals in one number segment
    const segments = currentExpression.split(/[\+\-\×\÷\(\)\^]/);
    if (!segments[segments.length - 1].includes('.')) {
      currentExpression += '.';
    }
  } else if (type === 'clear') {
    currentExpression = '0';
    isResultDisplayed = false;
  } else if (type === 'backspace') {
    if (isResultDisplayed) {
      currentExpression = '0';
      isResultDisplayed = false;
    } else {
      currentExpression = currentExpression.slice(0, -1) || '0';
    }
  } else if (type === 'percent') {
    // This is a simple implementation; a more robust one would parse the last number.
    try {
      const result = evaluateExpression(currentExpression);
      currentExpression = (result / 100).toString();
    } catch (e) { /* Do nothing if current expression is invalid */ }
  } else if (type === 'calculate') {
    if (isResultDisplayed) return;
    try {
      const result = evaluateExpression(currentExpression);
      currentExpression = result.toString();
      isResultDisplayed = true;
    } catch (e) {
      currentExpression = 'Error';
      isResultDisplayed = true;
    }
  }
  updateDisplay();
}

// ✅ AI Personality Settings Logic
const defaultAiSettings = {
  tone: 'calm',
  style: 'balanced',
  curiosity: 80,
  formality: 40,
  empathy: 70,
  memory: true,
  // New visual settings
  appearance: 'dark',
  accent: 'blue',
  font: 'sans-serif',
  retention: 'normal',
  // UX settings
  startupAnimation: true,
  greetingMessage: "Hello, {user}. Neural state: optimal.",
  systemSounds: true,
  typingAnimation: true,
};

function getAiSettings() {
  const saved = localStorage.getItem('aiSettings');
  if (saved) {
    // Merge saved settings with defaults to handle new settings gracefully
    return { ...defaultAiSettings, ...JSON.parse(saved) };
  }
  return defaultAiSettings;
}

function saveAiSettings(settings) {
  localStorage.setItem('aiSettings', JSON.stringify(settings));
}

function initializeSettings() {
  const settings = getAiSettings();
  applyThemeSettings(settings); // Apply visual settings on load

  // Set UI elements from saved settings
  document.querySelector(`input[name="ai-tone"][value="${settings.tone}"]`).checked = true;
  document.querySelector(`input[name="response-style"][value="${settings.style}"]`).checked = true;

  const curiositySlider = document.getElementById('curiosity-slider');
  const formalitySlider = document.getElementById('formality-slider');
  const empathySlider = document.getElementById('empathy-slider');
  const curiosityValue = document.getElementById('curiosity-value');
  const formalityValue = document.getElementById('formality-value');
  const empathyValue = document.getElementById('empathy-value');
  const memoryToggle = document.getElementById('memory-toggle');

  curiositySlider.value = settings.curiosity;
  formalitySlider.value = settings.formality;
  empathySlider.value = settings.empathy;
  curiosityValue.textContent = `${settings.curiosity}%`;
  formalityValue.textContent = `${settings.formality}%`;
  empathyValue.textContent = `${settings.empathy}%`;
  memoryToggle.checked = settings.memory;

  // UX Settings
  const startupToggle = document.getElementById('startup-animation-toggle');
  const greetingInput = document.getElementById('greeting-message-input');
  const soundsToggle = document.getElementById('system-sounds-toggle');
  const typingToggle = document.getElementById('typing-animation-toggle');


  // Add event listeners to save changes
  document.getElementById('ai-tone-group').addEventListener('change', (e) => {
    settings.tone = e.target.value;
    saveAiSettings(settings);
  });
  document.getElementById('response-style-group').addEventListener('change', (e) => {
    settings.style = e.target.value;
    saveAiSettings(settings);
  });
  curiositySlider.addEventListener('input', (e) => {
    settings.curiosity = e.target.value;
    curiosityValue.textContent = `${e.target.value}%`;
    saveAiSettings(settings);
  });
  formalitySlider.addEventListener('input', (e) => {
    settings.formality = e.target.value;
    formalityValue.textContent = `${e.target.value}%`;
    saveAiSettings(settings);
  });
  empathySlider.addEventListener('input', (e) => {
    settings.empathy = e.target.value;
    empathyValue.textContent = `${e.target.value}%`;
    saveAiSettings(settings);
  });
  memoryToggle.addEventListener('change', (e) => {
    settings.memory = e.target.checked;
    saveAiSettings(settings);
  });

  // --- New Interface Settings ---
  document.getElementById('appearance-mode-group').addEventListener('change', (e) => {
    settings.appearance = e.target.value;
    applyThemeSettings(settings);
    saveAiSettings(settings);
  });
  document.getElementById('accent-color-group').addEventListener('change', (e) => {
    settings.accent = e.target.value;
    applyThemeSettings(settings);
    saveAiSettings(settings);
  });
  document.getElementById('font-select').addEventListener('change', (e) => {
    settings.font = e.target.value;
    applyThemeSettings(settings);
    saveAiSettings(settings);
  });
  document.getElementById('memory-retention-group').addEventListener('change', (e) => {
    settings.retention = e.target.value;
    saveAiSettings(settings);
  });

  document.getElementById('download-log-btn').addEventListener('click', downloadActivityLog);
  initializeModal();

  // --- UX Settings Listeners ---
  startupToggle.checked = settings.startupAnimation;
  greetingInput.value = settings.greetingMessage;
  soundsToggle.checked = settings.systemSounds;
  typingToggle.checked = settings.typingAnimation;

  startupToggle.addEventListener('change', (e) => {
    settings.startupAnimation = e.target.checked;
    saveAiSettings(settings);
  });
  greetingInput.addEventListener('change', (e) => {
    settings.greetingMessage = e.target.value;
    saveAiSettings(settings);
  });
  soundsToggle.addEventListener('change', (e) => {
    settings.systemSounds = e.target.checked;
    saveAiSettings(settings);
  });
  typingToggle.addEventListener('change', (e) => {
    settings.typingAnimation = e.target.checked;
    saveAiSettings(settings);
  });
}

// ✅ Dynamic Identity Layer Logic
const modes = {
  focus: { icon: '🟢', greeting: "You're in Focus Mode. Let's get things done." },
  creative: { icon: '🟣', greeting: "You're in Creative Mode. Ready to brainstorm new concepts?" },
  research: { icon: '🔵', greeting: "You're in Research Mode. Let's uncover some new information." },
  relax: { icon: '⚪', greeting: "You're in Relax Mode. Time to wind down." },
};

function applyThemeSettings(settings) {
  const body = document.body;

  // 1. Appearance Mode
  body.classList.remove('theme-light', 'theme-dark', 'theme-ai');
  body.classList.add(`theme-${settings.appearance}`);

  // 2. Accent Color
  const accentColors = {
    blue: { color: '#38bdf8', text: '#0f172a' },
    pink: { color: '#f472b6', text: '#0f172a' },
    teal: { color: '#2dd4bf', text: '#0f172a' },
    gold: { color: '#facc15', text: '#0f172a' },
  };
  const accent = accentColors[settings.accent] || accentColors.blue;
  body.style.setProperty('--accent-color', accent.color);
  body.style.setProperty('--accent-text', accent.text);
  body.style.setProperty('--glow-color', accent.color);

  // 3. Font Style
  body.style.fontFamily = `var(--font-${settings.font})`;

  // Set checked state in UI
  const checkedAppearance = document.querySelector(`input[name="appearance-mode"][value="${settings.appearance}"]`);
  if (checkedAppearance) checkedAppearance.checked = true;
  const checkedAccent = document.querySelector(`input[name="accent-color"][value="${settings.accent}"]`);
  if (checkedAccent) checkedAccent.checked = true;
  document.getElementById('font-select').value = settings.font;
}

function applyTimeBasedTheme() {
  const hour = new Date().getHours();
  const body = document.body;
  body.classList.remove('theme-morning', 'theme-evening', 'theme-night');

  if (hour >= 6 && hour < 17) { // 6am to 5pm
    // body.classList.add('theme-morning'); // This is now handled by manual theme settings
  } else if (hour >= 22 || hour < 6) { // 10pm to 6am
    // body.classList.add('theme-night');
  } else { // 5pm to 10pm
    // body.classList.add('theme-evening');
  }
}

function updateUserMode(mode) {
  localStorage.setItem('userMode', mode);
  modeSelect.value = mode;
  StatsTracker.logActivity('mode', { mode }); // Log mode change
  modeIcon.textContent = modes[mode].icon;

  // Apply mode-based classes for visuals
  appContainer.classList.remove('mode-focus', 'mode-creative', 'mode-research', 'mode-relax');
  appContainer.classList.add(`mode-${mode}`);
}

function initializeIdentity() {
  const savedMode = localStorage.getItem('userMode') || 'focus';
  updateUserMode(savedMode);

  // Set a random energy level on load
  const randomEnergy = Math.floor(Math.random() * (95 - 75 + 1)) + 75;
  energyLevel.textContent = `${randomEnergy}%`;

  modeSelect.addEventListener('change', (e) => {
    updateUserMode(e.target.value);
  });
}

// ✅ Modal Logic
function initializeModal() {
  const modal = document.getElementById('sessions-modal');
  const viewBtn = document.getElementById('view-sessions-btn');
  const closeBtn = modal.querySelector('.modal-close');

  viewBtn.addEventListener('click', () => {
    const sessions = JSON.parse(localStorage.getItem('sessions')) || [];
    const lastFive = sessions.slice(-5).reverse(); // Newest first
    const logContent = document.getElementById('sessions-log-content');
    if (lastFive.length > 0) {
      logContent.textContent = lastFive.map((s, i) => `Session ${i+1}: ${new Date(s).toLocaleString()}`).join('\n');
    } else {
      logContent.textContent = "No session data recorded yet.";
    }
    modal.style.display = 'block';
  });

  closeBtn.addEventListener('click', () => {
    modal.style.display = 'none';
  });

  window.addEventListener('click', (e) => {
    if (e.target == modal) {
      modal.style.display = 'none';
    }
  });
}

function downloadActivityLog() {
  const activities = localStorage.getItem('activities') || '[]';
  const blob = new Blob([JSON.stringify(JSON.parse(activities), null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `earl_activity_log_${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ✅ Console-style boot sequence on load
function runBootSequence() {
  const bootContainer = document.getElementById('boot-sequence');
  const loader = document.getElementById('loader');
  const settings = getAiSettings();

  if (!settings.startupAnimation) {
    loader.classList.add('hidden');
    return;
  }

  const lines = [
    "[ SYSTEM ONLINE ]",
    "Loading Earl Core v2.4 …",
    "Syncing memory nodes …",
    "Retrieving last session data …",
    settings.greetingMessage.replace('{user}', 'Tjay'),
  ];
  let lineIndex = 0;

  function typeLine() {
    if (lineIndex < lines.length) {
      const p = document.createElement('p');
      bootContainer.appendChild(p);
      typewriter(p, lines[lineIndex], () => {
        lineIndex++;
        setTimeout(typeLine, 300); // Delay between lines
      });
    } else {
      // Finished typing all lines
      setTimeout(() => {
        loader.classList.add('hidden');
      }, 700); // Wait a moment before hiding loader
    }
  }

  typeLine();
}

// ✅ Self-Reflection Dashboard Logic
const StatsTracker = {
  sessionStartTime: null,

  logActivity(type, data = {}) {
    const now = new Date();
    // Log session for streak
    const today = now.toISOString().split('T')[0];
    let sessions = JSON.parse(localStorage.getItem('sessions')) || [];
    if (!sessions.includes(today)) {
      sessions.push(today);
      localStorage.setItem('sessions', JSON.stringify(sessions));
    }

    // Log specific activity with timestamp
    let activities = JSON.parse(localStorage.getItem('activities')) || [];
    activities.push({ type, timestamp: now.toISOString(), ...data });
    // Keep last 100 activities to prevent localStorage bloat
    if (activities.length > 100) {
      activities = activities.slice(activities.length - 100);
    }
    localStorage.setItem('activities', JSON.stringify(activities));
  },

  startSession() {
    this.sessionStartTime = new Date();
    this.logActivity('session_start');
  },

  endSession() {
    if (!this.sessionStartTime) return;
    const duration = (new Date() - this.sessionStartTime) / 1000; // in seconds
    this.logActivity('session_end', { duration });
    this.sessionStartTime = null;
  },

  getLearningTimeStats() {
    // This is a placeholder for a more complex aggregation
    return { "Mon": 30, "Tue": 45, "Wed": 60, "Thu": 20, "Fri": 75, "Sat": 15, "Sun": 90 };
  },

  getStats() {
    const activities = JSON.parse(localStorage.getItem('activities')) || [];
    const sessions = JSON.parse(localStorage.getItem('sessions')) || [];
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    // 1. Activity Hotspot
    const timeOfDay = { Morning: 0, Afternoon: 0, Evening: 0 };
    activities.forEach(act => {
      const hour = new Date(act.timestamp).getHours();
      if (hour >= 6 && hour < 12) timeOfDay.Morning++;
      else if (hour >= 12 && hour < 18) timeOfDay.Afternoon++;
      else timeOfDay.Evening++;
    });

    // 2. Weekly Mode Usage
    const weeklyModes = { focus: 0, creative: 0, research: 0, relax: 0 };
    activities.filter(act => act.type === 'mode' && new Date(act.timestamp) > oneWeekAgo)
      .forEach(act => {
        if (weeklyModes.hasOwnProperty(act.mode)) {
          weeklyModes[act.mode]++;
        }
      });

    // 3. Learning Streak
    let streak = 0;
    if (sessions.length > 0) {
      sessions.sort().reverse(); // Sort dates descending
      streak = 1;
      const today = new Date(sessions[0]);
      if (new Date().toISOString().split('T')[0] !== sessions[0]) {
        // If the last session wasn't today, the streak is 0
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        if (yesterday.toISOString().split('T')[0] === sessions[0]) {
           // last session was yesterday, so continue from there
        } else {
          streak = 0;
        }
      }

      if (streak > 0) {
        for (let i = 0; i < sessions.length - 1; i++) {
          const currentDay = new Date(sessions[i]);
          const previousDay = new Date(sessions[i+1]);
          const diffTime = currentDay - previousDay;
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          if (diffDays === 1) {
            streak++;
          } else {
            break; // Streak is broken
          }
        }
      }
    }

    // 4. Today's Focus (simple implementation)
    const lastChat = activities.filter(a => a.type === 'chat').pop();
    const focus = lastChat ? `Revisiting your last topic: "${lastChat.message.substring(0, 40)}..."` : "Start a conversation to define your focus.";

    return { timeOfDay, weeklyModes, streak, focus };
  },
};

function renderDashboard() {
  const { timeOfDay, weeklyModes, streak, focus } = StatsTracker.getStats();

  // Render Focus
  document.getElementById('today-focus-card').textContent = focus;

  // Render Streak
  document.getElementById('learning-streak-count').textContent = streak;

  // Render Charts
  renderChart('activity-hotspot-chart', timeOfDay, 'Activity');
  renderChart('weekly-mode-chart', weeklyModes, 'Usage');

  // Render learning time chart in settings
  const learningTimeData = StatsTracker.getLearningTimeStats();
  renderChart('learning-time-chart', learningTimeData, 'Minutes');
}

function renderChart(elementId, data, labelSuffix) {
  const container = document.getElementById(elementId);
  container.innerHTML = '';
  const total = Object.values(data).reduce((sum, val) => sum + val, 0);
  if (total === 0) {
    container.innerHTML = `<p class="placeholder-text" style="margin-top: 0;">Not enough data yet.</p>`;
    return;
  }

  const maxVal = Math.max(...Object.values(data));

  for (const [label, value] of Object.entries(data)) {
    const percentage = (value / maxVal) * 100;
    const bar = document.createElement('div');
    bar.className = 'chart-bar';
    bar.innerHTML = `
      <div class="chart-label">${label}</div>
      <div class="chart-progress-wrapper">
        <div class="chart-progress" style="width: 0%;"></div>
      </div>
    `;
    container.appendChild(bar);
    // Animate the bar width after it's added to the DOM
    setTimeout(() => {
      bar.querySelector('.chart-progress').style.width = `${percentage}%`;
    }, 100);
  }
}

// ✅ Load on page start
window.addEventListener("DOMContentLoaded", async () => {
  // Start tracking session time
  StatsTracker.startSession();

  // Set up the identity layer first
  initializeIdentity();

  // Initialize settings page
  initializeSettings();

  // Run the boot sequence
  runBootSequence();

  // Render the dashboard
  renderDashboard();

  const lastPage = localStorage.getItem('lastVisitedPage') || 'home';
  showPage(lastPage); // Start on the last visited page or home
  isInitialPageLoad = false;

  try {
    const res = await fetch(`${BASE_URL}/chat/history`);
    const history = await res.json();
    history.forEach((msg) => addMessage(msg.sender, msg.text, false)); // Don't use typewriter for history
  } catch (err) {
    console.error("Failed to load chat history:", err);
    addMessage("E.A.R.L", "⚠️ Couldn't load chat history.", getAiSettings().typingAnimation);
  }

  loadReminders();

  // ✅ Wire up clear buttons
  clearChatBtn.addEventListener("click", clearChat);
  clearRemindersBtn.addEventListener("click", clearAllReminders);

  // ✅ Wire up calculator
  updateDisplay();
  calculatorKeys.addEventListener('click', (e) => {
    const { target } = e;
    if (!target.matches('button')) {
      return;
    }

    const { action, number, key } = target.dataset;

    if (number) {
      handleKeyPress(number, 'number');
    } else if (action === 'decimal') {
      handleKeyPress('.', 'decimal');
    } else if (key) {
      handleKeyPress(key, action); // For operators, functions, etc.
    } else {
      handleKeyPress(null, action); // For actions without a key, like 'calculate'
    }
  });
});

// Track session end
window.addEventListener('beforeunload', () => {
  StatsTracker.endSession();
});

// ✅ Keyboard shortcut for chat focus
window.addEventListener('keydown', (e) => {
  // If we're pressing "/" and not in an input field already
  if (e.key === '/' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
    e.preventDefault(); // Prevent typing "/" in the input
    showPage('chat'); // Switch to chat page if not already there
    chatInput.focus();
  }
});
