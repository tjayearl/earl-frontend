// ✅ Make sure this matches your live Render backend
const BASE_URL = "https://earl-backend.onrender.com";

const chatForm = document.getElementById("chat-form");
const chatInput = document.getElementById("chat-input");
const chatBox = document.getElementById("chat-box");

const reminderForm = document.getElementById("reminder-form");
const reminderInput = document.getElementById("reminder-input");
const reminderList = document.getElementById("reminder-list");

// ✅ Adds message to chat UI
function addMessage(sender, text) {
  const messageDiv = document.createElement("div");
  messageDiv.classList.add("message");

  const senderClass = sender === "You" ? "user-message" : "earl-message";
  messageDiv.classList.add(senderClass);

  const p = document.createElement("p");
  p.textContent = `${sender}: ${text}`;
  messageDiv.appendChild(p);

  chatBox.appendChild(messageDiv);
  chatBox.scrollTop = chatBox.scrollHeight;
}

// ✅ Handle chat form submit
chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const message = chatInput.value.trim();
  if (!message) return;

  addMessage("You", message);
  chatInput.value = "";

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
  try {
    await fetch(`${BASE_URL}/reminders/${id}`, {
      method: "DELETE",
    });
    loadReminders();
  } catch (err) {
    console.error("Delete reminder failed:", err);
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
});
