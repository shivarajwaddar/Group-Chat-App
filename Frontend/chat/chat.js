// --- 1. CONFIGURATION & STATE ---
const token = localStorage.getItem("token");
const currentUserId = localStorage.getItem("currentUserId");
const myEmail = localStorage.getItem("userEmail");
const myName = localStorage.getItem("userName");

let currentRoomId = null; // null = Global mode

const socket = io("http://localhost:3000", { auth: { token } });

// --- 2. INITIALIZATION ---
window.addEventListener("DOMContentLoaded", () => {
  if (!token) {
    window.location.href = "login.html";
  } else {
    fetchUsers();
    loadGlobalHistory();
    setupEventListeners();
  }
});

// --- 3. SOCKET LISTENERS ---

socket.on("receiveMessage", (msg) => {
  // STRICT CHECK: Only show Global messages if we are NOT in a private room
  if (currentRoomId === null) {
    if (String(msg.dbUserId) !== String(currentUserId)) {
      appendMessageToUI(msg, "received");
    }
  }
});

socket.on("receive_personal_message", (data) => {
  // STRICT CHECK: Only show if the room matches our current view
  if (data.room === currentRoomId) {
    if (data.senderEmail !== myEmail) {
      appendMessageToUI(
        {
          content: data.message,
          senderName: data.senderName,
        },
        "received",
      );
    }
  }
});

// --- 4. DATA FETCHING ---

async function fetchUsers() {
  try {
    const res = await axios.get("http://localhost:3000/api/users/all-users", {
      headers: { Authorization: token },
    });
    const container = document.getElementById("availableUsers");
    container.innerHTML = "";

    res.data.users.forEach((u) => {
      const div = document.createElement("div");
      div.className = "chat-item";
      div.setAttribute("data-name", u.name.toLowerCase());
      div.setAttribute("data-email", u.email.toLowerCase());

      // FIX: Pass the element 'div' so we can highlight it
      div.onclick = () => joinPersonalRoom(u.email, u.name, u.id, div);

      div.innerHTML = `
                <div class="profile-circle"><i class="fa-solid fa-user"></i></div>
                <div class="chat-meta">
                    <strong>${u.name}</strong>
                    <p>${u.email}</p>
                </div>`;
      container.appendChild(div);
    });
  } catch (err) {
    console.error(err);
  }
}

async function loadGlobalHistory() {
  try {
    const res = await axios.get(
      "http://localhost:3000/api/messages/get-messages",
      {
        headers: { Authorization: token },
      },
    );
    const chatBox = document.getElementById("chatBox");
    chatBox.innerHTML = ""; // Clear screen
    res.data.data.forEach((msg) => {
      const type =
        String(msg.dbUserId) === String(currentUserId) ? "sent" : "received";
      appendMessageToUI(msg, type);
    });
  } catch (err) {
    console.error(err);
  }
}

async function loadPrivateHistory(recipientId) {
  try {
    const res = await axios.get(
      `http://localhost:3000/api/messages/get-private-messages/${recipientId}`,
      {
        headers: { Authorization: token },
      },
    );
    const chatBox = document.getElementById("chatBox");
    chatBox.innerHTML = ""; // Clear screen
    res.data.data.forEach((msg) => {
      const type =
        String(msg.dbUserId) === String(currentUserId) ? "sent" : "received";
      appendMessageToUI(msg, type);
    });
  } catch (err) {
    console.error(err);
  }
}

// --- 5. UI LOGIC ---

function appendMessageToUI(msg, type) {
  const chatBox = document.getElementById("chatBox");
  if (!chatBox) return;

  const msgDiv = document.createElement("div");
  msgDiv.className = `msg ${type}`;
  const displayName =
    type === "sent" ? "You" : msg.db_user?.name || msg.senderName || "User";
  const time = new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  msgDiv.innerHTML = `
        <div class="user-name">${displayName}</div>
        <div class="message-text">${msg.content}</div>
        <span class="time">${time}</span>
    `;
  chatBox.appendChild(msgDiv);
  chatBox.scrollTop = chatBox.scrollHeight;
}

function joinPersonalRoom(email, name, id, element) {
  // 1. Room Logic
  currentRoomId = [myEmail, email].sort().join("_");
  socket.emit("join_room", { room: currentRoomId });

  // 2. UI Updates
  document.getElementById("chatHeader").innerText = name;
  document.getElementById("chatStatus").innerText = "private chat";

  // 3. Highlight Logic (Fixes the 'vanishing' focus)
  document
    .querySelectorAll(".chat-item")
    .forEach((item) => item.classList.remove("active"));
  if (element) element.classList.add("active");

  // 4. Fetch History
  loadPrivateHistory(id);
}

function switchToGlobal() {
  currentRoomId = null;
  document.getElementById("chatHeader").innerText = "Global Group";
  document.getElementById("chatStatus").innerText = "public community";

  // UI Highlight
  document
    .querySelectorAll(".chat-item")
    .forEach((item) => item.classList.remove("active"));
  document.getElementById("globalChatItem").classList.add("active");

  loadGlobalHistory();
}

// --- 6. EVENT LISTENERS ---

function setupEventListeners() {
  const searchInput = document.getElementById("searchEmail");
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      const q = e.target.value.toLowerCase();
      document
        .querySelectorAll("#availableUsers .chat-item")
        .forEach((item) => {
          const name = item.getAttribute("data-name") || "";
          const email = item.getAttribute("data-email") || "";
          item.style.display =
            name.includes(q) || email.includes(q) ? "flex" : "none";
        });
    });
  }

  const msgInput = document.getElementById("msgInput");
  if (msgInput) {
    msgInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") sendMessage(e);
    });
  }
}

function sendMessage(e) {
  if (e) e.preventDefault();
  const input = document.getElementById("msgInput");
  const text = input.value.trim();
  if (!text) return;

  appendMessageToUI({ content: text }, "sent");

  if (currentRoomId) {
    console.log("SENDING PRIVATE DATA:", {
      room: currentRoomId,
      text: text,
      me: myEmail,
    });
    socket.emit("new_message", {
      room: currentRoomId,
      message: text,
      senderEmail: myEmail,
      senderName: myName,
    });
  } else {
    socket.emit("sendMessage", { content: text });
  }
  input.value = "";
}
