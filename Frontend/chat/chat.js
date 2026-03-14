const socket = io("http://localhost:3000"); // Add the URL here too!

// --- 1. SOCKET LISTENER ---
// Add this so you receive messages from others in real-time
socket.on("receiveMessage", (newMessage) => {
  // Since someone else sent this, it's always 'received' type
  appendMessageToUI(newMessage, "received");
});

function appendMessageToUI(msg, type) {
  const chatBox = document.getElementById("chatBox");
  const msgDiv = document.createElement("div");
  msgDiv.className = `msg ${type}`;

  const timeSource = msg.createdAt || msg.timeStamp || new Date();
  const now = new Date(timeSource);
  const timeStr = `${now.getHours()}:${now.getMinutes().toString().padStart(2, "0")}`;

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

// LOAD MESSAGES (Keep this as is - it's for your history on refresh)
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
      const newMessage = response.data.data;

      // Update your own UI
      appendMessageToUI(newMessage, "sent");

      // --- 2. SOCKET EMIT ---
      // Tell the server to broadcast this message to everyone else
      socket.emit("sendMessage", newMessage);

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
