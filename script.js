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

// ✅ Calculator Logic
const calculator = document.querySelector('.calculator-grid');
const calculatorDisplay = calculator.querySelector('.calculator-display');
const calculatorKeys = calculator.querySelector('.calculator-keys');

const calculatorState = {
  displayValue: '0',
  firstValue: null,
  waitingForSecondValue: false,
  operator: null,
};

function updateDisplay() {
  calculatorDisplay.textContent = calculatorState.displayValue;
}

function handleOperator(nextOperator) {
  const { firstValue, displayValue, operator } = calculatorState;
  const inputValue = parseFloat(displayValue);

  if (operator && calculatorState.waitingForSecondValue) {
    calculatorState.operator = nextOperator;
    return;
  }

  if (firstValue === null && !isNaN(inputValue)) {
    calculatorState.firstValue = inputValue;
  } else if (operator) {
    const result = calculate(firstValue, inputValue, operator);
    calculatorState.displayValue = `${parseFloat(result.toFixed(7))}`;
    calculatorState.firstValue = result;
  }

  calculatorState.waitingForSecondValue = true;
  calculatorState.operator = nextOperator;
}

function calculate(n1, n2, operator) {
  if (operator === 'add') return n1 + n2;
  if (operator === 'subtract') return n1 - n2;
  if (operator === 'multiply') return n1 * n2;
  if (operator === 'divide') return n1 / n2;
  return n2;
}

function resetCalculator() {
  calculatorState.displayValue = '0';
  calculatorState.firstValue = null;
  calculatorState.waitingForSecondValue = false;
  calculatorState.operator = null;
}

function inputDigit(digit) {
  const { displayValue, waitingForSecondValue } = calculatorState;
  if (waitingForSecondValue === true) {
    calculatorState.displayValue = digit;
    calculatorState.waitingForSecondValue = false;
  } else {
    calculatorState.displayValue = displayValue === '0' ? digit : displayValue + digit;
  }
}

function inputDecimal(dot) {
  if (calculatorState.waitingForSecondValue) {
    calculatorState.displayValue = '0.';
    calculatorState.waitingForSecondValue = false;
    return;
  }
  if (!calculatorState.displayValue.includes(dot)) {
    calculatorState.displayValue += dot;
  }
}

function handleBackspace() {
  const { displayValue, waitingForSecondValue } = calculatorState;
  // If an operator was just pressed, a backspace shouldn't edit the previous result.
  if (waitingForSecondValue) {
    return;
  }

  if (displayValue.length > 1) {
    calculatorState.displayValue = displayValue.slice(0, -1);
  } else {
    calculatorState.displayValue = '0';
  }
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

    const { action } = target.dataset;
    const keyContent = target.textContent;
    const displayedNum = calculatorState.displayValue;

    if (!action) { // It's a number
      inputDigit(keyContent);
    } else if (action === 'decimal') {
      inputDecimal('.');
    } else if (action === 'add' || action === 'subtract' || action === 'multiply' || action === 'divide') {
      handleOperator(action);
    } else if (action === 'calculate') {
      const { firstValue, operator, displayValue } = calculatorState;
      if (firstValue != null && operator) {
        const result = calculate(firstValue, parseFloat(displayValue), operator);
        calculatorState.displayValue = `${parseFloat(result.toFixed(7))}`;
        calculatorState.firstValue = null;
        calculatorState.operator = null;
        calculatorState.waitingForSecondValue = false;
      }
    } else if (action === 'clear') {
      resetCalculator();
    } else if (action === 'backspace') {
      handleBackspace();
    } else if (action === 'percent') {
      calculatorState.displayValue = (parseFloat(displayedNum) / 100).toString();
    }

    updateDisplay();
  });
});
