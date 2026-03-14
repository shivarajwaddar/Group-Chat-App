function appendMessageToUI(msg, type) {
  const chatBox = document.getElementById("chatBox");
  const msgDiv = document.createElement("div");
  msgDiv.className = `msg ${type}`;

  const timeSource = msg.createdAt || msg.timeStamp || new Date();
  const now = new Date(timeSource);
  const timeStr = `${now.getHours()}:${now.getMinutes().toString().padStart(2, "0")}`;

  // NEW LOGIC: If type is 'sent', it's always "You".
  // Otherwise, get the name from the database object.
  const displayName =
    type === "sent" ? "You" : msg.db_user ? msg.db_user.name : "Unknown";

  msgDiv.innerHTML = `
        <div class="user-name">${displayName}</div>
        <div class="message-text">${msg.content}</div>
        <span class="time">${timeStr}</span>
    `;

  chatBox.appendChild(msgDiv);
  chatBox.scrollTop = chatBox.scrollHeight;
}

// LOAD MESSAGES
window.addEventListener("DOMContentLoaded", async () => {
  const token = localStorage.getItem("token");
  const currentUserId = localStorage.getItem("currentUserId");

  const chatBox = document.getElementById("chatBox");

  try {
    const response = await axios.get(
      "http://localhost:3000/api/messages/get-messages",
      { headers: { Authorization: token } },
    );

    if (response.status === 200) {
      const messages = response.data.data;
      chatBox.innerHTML = "";

      messages.forEach((msg) => {
        // Use == because one might be a string and the other a number
        const type = msg.dbUserId == currentUserId ? "sent" : "received";
        appendMessageToUI(msg, type);
      });
    }
  } catch (error) {
    console.error("Error loading messages:", error);
    if (error.response?.status === 401)
      window.location.href = "../login/login.html";
  }
});

// SEND MESSAGE
async function sendMessage(event) {
  if (event) event.preventDefault();

  const messageInput = document.getElementById("msgInput");
  const messageText = messageInput.value.trim();
  const token = localStorage.getItem("token");

  if (!messageText) return;

  try {
    const response = await axios.post(
      "http://localhost:3000/api/messages/send",
      { content: messageText },
      { headers: { Authorization: token } },
    );

    if (response.status === 201) {
      // FIX: Pass the WHOLE data object from the response, not just the text
      const newMessage = response.data.data;
      appendMessageToUI(newMessage, "sent");
      messageInput.value = "";
    }
  } catch (error) {
    console.error("Error sending message:", error);
    alert("Could not send message.");
  }
}

document.getElementById("msgInput").addEventListener("keypress", (e) => {
  if (e.key === "Enter") sendMessage(e);
});
