// Retrieve items from storage
const token = localStorage.getItem("token");
const currentUserId = localStorage.getItem("currentUserId");

// --- 1. SOCKET INITIALIZATION WITH AUTH ---
// By passing the token here, the server can verify the user and
// attach their name/ID to the socket object automatically.
const socket = io("http://localhost:3000", {
  auth: {
    token: token,
  },
});

// --- 2. SOCKET LISTENER ---
socket.on("receiveMessage", (newMessage) => {
  // If the server broadcasts to everyone, we check if we were the sender
  // to avoid showing the message twice.
  if (String(newMessage.dbUserId) === String(currentUserId)) return;

  appendMessageToUI(newMessage, "received");
});

function appendMessageToUI(msg, type) {
  const chatBox = document.getElementById("chatBox");
  const msgDiv = document.createElement("div");
  msgDiv.className = `msg ${type}`;

  const timeSource = msg.createdAt || msg.timeStamp || new Date();
  const now = new Date(timeSource);
  const timeStr = `${now.getHours()}:${now.getMinutes().toString().padStart(2, "0")}`;

  // Use the name from the message object sent by the socket
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

// LOAD HISTORY
window.addEventListener("DOMContentLoaded", async () => {
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
        const type =
          String(msg.dbUserId) === String(currentUserId) ? "sent" : "received";
        appendMessageToUI(msg, type);
      });
    }
  } catch (error) {
    console.error("Error loading messages:", error);
    if (error.response?.status === 401)
      window.location.href = "../login/login.html";
  }
});

// --- 3. SEND MESSAGE ---
async function sendMessage(event) {
  if (event) event.preventDefault();

  const messageInput = document.getElementById("msgInput");
  const messageText = messageInput.value.trim();

  if (!messageText) return;

  // OPTION: Pure Socket approach (No Axios needed for sending)
  // The server will receive this, use the 'auth' token to find the user,
  // save to DB, and then broadcast.
  const messageData = {
    content: messageText,
    createdAt: new Date(),
  };

  // 1. Show it on your screen immediately
  appendMessageToUI({ ...messageData, dbUserId: currentUserId }, "sent");

  // 2. Emit to server
  socket.emit("sendMessage", messageData);

  messageInput.value = "";
}

document.getElementById("msgInput").addEventListener("keypress", (e) => {
  if (e.key === "Enter") sendMessage(e);
});
