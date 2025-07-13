const form = document.getElementById('chat-form');
const chatBox = document.getElementById('chat-box');
const input = document.getElementById('user-input');

const reminderList = document.getElementById('reminder-list');
const newReminder = document.getElementById('new-reminder');
const addReminderBtn = document.getElementById('add-reminder');

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const message = input.value;
  addMessage("You", message);
  input.value = "";

  // Simulate E.A.R.L response (later connect to your backend API)
  setTimeout(() => {
    addMessage("E.A.R.L", "I'm thinking... (Connect me to your backend!)");
  }, 500);
});

function addMessage(sender, text) {
  const div = document.createElement('div');
  div.classList.add('chat-message');
  div.innerHTML = `<strong>${sender}:</strong> ${text}`;
  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;
}

// Add Reminder
addReminderBtn.addEventListener('click', () => {
  if (newReminder.value.trim()) {
    const li = document.createElement('li');
    li.textContent = newReminder.value;
    reminderList.appendChild(li);
    newReminder.value = "";
  }
});
