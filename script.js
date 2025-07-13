const BASE_URL = "http://127.0.0.1:8000";

const chatForm = document.getElementById("chat-form");
const chatInput = document.getElementById("chat-input");
const chatBox = document.getElementById("chat-box");

const reminderForm = document.getElementById("reminder-form");
const reminderInput = document.getElementById("reminder-input");
const reminderList = document.getElementById("reminder-list");

function addMessage(sender, text) {
  const messageDiv = document.createElement("div");
  messageDiv.classList.add("message");

  // Add a specific class for user vs. AI for styling
  const senderClass = sender === "You" ? "user-message" : "earl-message";
  messageDiv.classList.add(senderClass);

  const p = document.createElement("p");
  p.textContent = text; // Use textContent for security and simplicity
  messageDiv.appendChild(p);

  chatBox.appendChild(messageDiv);

  // Scroll to the bottom of the chat box
  chatBox.scrollTop = chatBox.scrollHeight;
}

chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const message = chatInput.value;
  addMessage("You", message);
  chatInput.value = "";

  const res = await fetch(`${BASE_URL}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message }),
  });

  const data = await res.json();
  addMessage("E.A.R.L", data.reply);
});

reminderForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const text = reminderInput.value;

  const res = await fetch(`${BASE_URL}/reminders`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });

  const reminder = await res.json();
  loadReminders();
  reminderInput.value = "";
});

async function loadReminders() {
  const res = await fetch(`${BASE_URL}/reminders`);
  const reminders = await res.json();

  reminderList.innerHTML = "";
  reminders.forEach((r) => {
    const li = document.createElement("li");
    li.textContent = r.text;
    li.addEventListener("click", () => deleteReminder(r.id));
    reminderList.appendChild(li);
  });
}

async function deleteReminder(id) {
  await fetch(`${BASE_URL}/reminders/${id}`, {
    method: "DELETE",
  });
  loadReminders();
}

// Load chat + reminders on start
window.addEventListener("DOMContentLoaded", async () => {
  const res = await fetch(`${BASE_URL}/chat/history`);
  const history = await res.json();
  history.forEach((msg) => addMessage(msg.sender, msg.text));
  loadReminders();
});
