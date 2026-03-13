// 1. Function to send message to Backend
async function sendMessage(event) {
  if (event) event.preventDefault();

  const messageInput = document.getElementById("msgInput");
  const messageText = messageInput.value.trim();

  if (!messageText) return;

  // Retrieve the Token saved during Signin
  const token = localStorage.getItem("token");

  try {
    const response = await axios.post(
      "http://localhost:3000/api/messages/send",
      { content: messageText },
      {
        headers: {
          Authorization: token,
        },
      },
    );

    if (response.status === 201) {
      // Add message to screen immediately
      appendMessageToUI(messageText, "sent");
      messageInput.value = ""; // Clear input box
    }
  } catch (error) {
    if (error.response && error.response.status === 401) {
      alert("Your session expired. Please login again.");
      window.location.href = "../login/login.html";
    } else {
      console.error("Error sending message:", error);
      alert("Something went wrong while sending.");
    }
  }
}

// 2. Function to visually add message bubbles
function appendMessageToUI(text, type) {
  const chatBox = document.getElementById("chatBox");

  // Create the message container
  const msgDiv = document.createElement("div");
  msgDiv.className = `msg ${type}`; // type is 'sent' or 'received'

  // Format time (e.g., 14:05)
  const now = new Date();
  const timeStr = `${now.getHours()}:${now.getMinutes().toString().padStart(2, "0")}`;

  msgDiv.innerHTML = `
        ${text}
        <span class="time">${timeStr}</span>
    `;

  // Append to the chatBox
  chatBox.appendChild(msgDiv);

  // Auto-scroll to the bottom
  chatBox.scrollTop = chatBox.scrollHeight;
}

// 3. Optional: Allow pressing "Enter" to send
document.getElementById("msgInput").addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    sendMessage(e);
  }
});
