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

// ✅ Handle page navigation
function showPage(pageId) {
  // Hide all pages and deactivate all links
  pages.forEach((page) => page.classList.remove("active"));
  navLinks.forEach((link) => link.classList.remove("active"));

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
}

navLinks.forEach((link) => {
  link.addEventListener("click", (e) => {
    e.preventDefault(); // Prevent URL change
    const pageId = e.target.dataset.page;
    showPage(pageId);
  });
});

// ✅ Adds message to chat UI
function addMessage(sender, text) {
  const messageDiv = document.createElement("div");
  messageDiv.classList.add("message");

  const senderClass = sender === "You" ? "user-message" : "earl-message";
  messageDiv.classList.add(senderClass);

  const p = document.createElement("p");
  p.textContent = text;
  messageDiv.appendChild(p);

  chatBox.appendChild(messageDiv);
  chatBox.scrollTop = chatBox.scrollHeight;
}

// ✅ Shows a "typing..." indicator
function showTypingIndicator() {
  const messageDiv = document.createElement("div");
  messageDiv.classList.add("message", "earl-message", "typing-indicator");
  // Simple animated dots
  messageDiv.innerHTML = `<p><span>.</span><span>.</span><span>.</span></p>`;
  chatBox.appendChild(messageDiv);
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

  addMessage("You", message);
  chatInput.value = "";

  showTypingIndicator();

  try {
    const res = await fetch(`${BASE_URL}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    });
    if (!res.ok) {
      throw new Error(`Server error: ${res.status}`);
    }
    const data = await res.json();
    console.log("E.A.R.L replied:", data.reply);
    addMessage("E.A.R.L", data.reply);
  } catch (err) {
    console.error("Chat error:", err);
    addMessage("E.A.R.L", "⚠️ I couldn't reach my brain. Try again.");
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
      li.textContent = r.text;
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
    addMessage("E.A.R.L", "Chat history cleared.");
  } catch (err) {
    console.error("Failed to clear chat:", err);
    addMessage("E.A.R.L", "⚠️ Oops, I couldn't clear the chat history.");
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

// ✅ Load on page start
window.addEventListener("DOMContentLoaded", async () => {
  try {
    const res = await fetch(`${BASE_URL}/chat/history`);
    const history = await res.json();
    history.forEach((msg) => addMessage(msg.sender, msg.text));
  } catch (err) {
    console.error("Failed to load chat history:", err);
    addMessage("E.A.R.L", "⚠️ Couldn't load chat history.");
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
