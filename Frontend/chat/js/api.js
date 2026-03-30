// --- 1. CONFIGURATION & STATE ---
const token = localStorage.getItem("token");
const currentUserId = localStorage.getItem("currentUserId");
const myEmail = localStorage.getItem("userEmail");
const myName = localStorage.getItem("userName");

let currentRoomId = null;
let currentRecipientId = null;
let selectedUsers = []; // Stores IDs of users checked in the modal

const socket = io("http://localhost:3000", { auth: { token } });

// --- 2. INITIALIZATION ---
window.addEventListener("DOMContentLoaded", () => {
  if (!token) {
    window.location.href = "../signin/signin.html";
  } else {
    // STARTUP STATE: Show Welcome, Hide Chat
    document.getElementById("welcomeScreen").style.display = "flex";
    document.getElementById("chatContent").style.display = "none";

    fetchUsers();
    fetchGroups();
    setupEventListeners();
  }
});

// --- 3. UI TOGGLE ---
function showChatScreen() {
  document.getElementById("welcomeScreen").style.display = "none";
  document.getElementById("chatContent").style.display = "flex";
}

// --- 4. DATA FETCHING ---

async function fetchUsers() {
  try {
    const res = await axios.get("http://localhost:3000/api/users/all-users", {
      headers: { Authorization: token },
    });
    const container = document.getElementById("availableUsers");
    container.innerHTML = ""; // Clear list

    res.data.users.forEach((u) => {
      if (String(u.id) === String(currentUserId)) return;
      const div = document.createElement("div");
      div.className = "chat-item";
      div.onclick = () => joinPersonalRoom(u.email, u.name, u.id, div);
      div.innerHTML = `
        <div class="profile-circle"><i class="fa-solid fa-user"></i></div>
        <div class="chat-meta"><strong>${u.name}</strong><p>${u.email}</p></div>`;
      container.appendChild(div);
    });
  } catch (err) {
    console.error(err);
  }
}

async function fetchGroups() {
  try {
    const res = await axios.get(
      "http://localhost:3000/api/groups/user-groups",
      {
        headers: { Authorization: token },
      },
    );
    const container = document.getElementById("availableGroups");
    container.innerHTML = "";

    res.data.groups.forEach((g) => {
      const div = document.createElement("div");
      div.className = "chat-item";
      div.onclick = () => joinGroupChat(g.id, g.name, div);
      div.innerHTML = `
        <div class="profile-circle group-icon"><i class="fa-solid fa-users"></i></div>
        <div class="chat-meta"><strong>${g.name}</strong><p>Group Chat</p></div>`;
      container.appendChild(div);
    });
  } catch (err) {
    console.error(err);
  }
}

// --- 5. ROOM & HISTORY LOGIC ---

async function joinGroupChat(groupId, groupName, element) {
  showChatScreen();
  currentRoomId = `group_${groupId}`;
  currentRecipientId = null;

  socket.emit("join_room", { room: currentRoomId });

  document.getElementById("chatHeader").innerText = groupName;
  document.getElementById("chatStatus").innerText = "Group Chat";
  document.getElementById("headerIcon").innerHTML =
    '<i class="fa-solid fa-users"></i>';

  updateActiveUI(element);
  loadGroupHistory(groupId);
}

async function joinPersonalRoom(email, name, id, element) {
  showChatScreen();
  currentRoomId = [myEmail, email].sort().join("_");
  currentRecipientId = id;

  socket.emit("join_room", { room: currentRoomId });

  document.getElementById("chatHeader").innerText = name;
  document.getElementById("chatStatus").innerText = "Private Chat";
  document.getElementById("headerIcon").innerHTML =
    '<i class="fa-solid fa-user"></i>';

  updateActiveUI(element);
  loadPrivateHistory(id);
}

// Separate Group History Fetcher
async function loadGroupHistory(groupId) {
  try {
    const res = await axios.get(
      `http://localhost:3000/api/messages/get-group-messages/${groupId}`,
      {
        headers: { Authorization: token },
      },
    );

    console.log("Group Messages Received:", res.data.data);
    renderMessages(res.data.data);
  } catch (err) {
    console.error("Error loading group history", err);
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
    renderMessages(res.data.data);
  } catch (err) {
    console.error("Error loading private history", err);
  }
}

// DRY Principle: Helper to render messages
function renderMessages(messages) {
  const chatBox = document.getElementById("chatBox");
  chatBox.innerHTML = "";
  messages.forEach((msg) => {
    const type =
      String(msg.dbUserId) === String(currentUserId) ? "sent" : "received";
    appendMessageToUI(msg, type);
  });
}

// --- 6. MESSAGING ---

function sendMessage(e) {
  if (e) e.preventDefault();
  const input = document.getElementById("msgInput");
  const text = input.value.trim();
  if (!text) return;

  const payload = { content: text, room: currentRoomId };

  if (currentRoomId.startsWith("group_")) {
    payload.groupId = currentRoomId.split("_")[1];
    socket.emit("sendMessage", payload);
  } else {
    payload.recipientId = currentRecipientId;
    socket.emit("sendPersonalMessage", payload);
  }

  appendMessageToUI({ content: text, senderName: "You" }, "sent");
  input.value = "";
}

socket.on("receive_message", (data) => {
  if (data.room === currentRoomId) {
    if (String(data.senderId) !== String(currentUserId)) {
      appendMessageToUI(data, "received");
    }
  }
});

function appendMessageToUI(msg, type) {
  const chatBox = document.getElementById("chatBox");
  const msgDiv = document.createElement("div");
  msgDiv.className = `msg ${type}`;

  // 1. Resolve the message content
  const content = msg.content || msg.message;

  // 2. Resolve the sender's name
  let name = "User";
  if (type === "sent") {
    name = "You";
  } else {
    // If it's a group message, the backend 'include' usually puts the name here:
    name = msg.db_user?.name || msg.User?.name || msg.senderName || "User";
  }

  msgDiv.innerHTML = `
    <div class="user-name">${name}</div>
    <div class="message-text">${content}</div>
  `;

  chatBox.appendChild(msgDiv);
  chatBox.scrollTop = chatBox.scrollHeight;
}

// --- 7. MODAL LOGIC ---

function openGroupModal() {
  document.getElementById("groupModal").style.display = "flex";
  loadUsersIntoModal();
}

function closeGroupModal() {
  document.getElementById("groupModal").style.display = "none";
  selectedUsers = [];
  document.getElementById("groupNameInput").value = "";
}

async function loadUsersIntoModal() {
  try {
    const res = await axios.get("http://localhost:3000/api/users/all-users", {
      headers: { Authorization: token },
    });
    const container = document.getElementById("modalUserList");
    container.innerHTML = "";
    res.data.users.forEach((u) => {
      if (String(u.id) === String(currentUserId)) return;
      const div = document.createElement("div");
      div.className = "modal-user-item";
      div.innerHTML = `
        <input type="checkbox" onchange="toggleMemberSelection(${u.id})"> 
        <span>${u.name}</span>`;
      container.appendChild(div);
    });
  } catch (err) {
    console.error(err);
  }
}

function toggleMemberSelection(id) {
  const idx = selectedUsers.indexOf(id);
  idx > -1 ? selectedUsers.splice(idx, 1) : selectedUsers.push(id);
}

async function createNewGroup() {
  const name = document.getElementById("groupNameInput").value.trim();
  if (!name || selectedUsers.length === 0)
    return alert("Select members and group name!");

  try {
    await axios.post(
      "http://localhost:3000/api/groups/create",
      { name, members: selectedUsers },
      { headers: { Authorization: token } },
    );
    closeGroupModal();
    fetchGroups();
  } catch (err) {
    console.error(err);
  }
}

function updateActiveUI(element) {
  document
    .querySelectorAll(".chat-item")
    .forEach((item) => item.classList.remove("active"));
  if (element) element.classList.add("active");
}

function setupEventListeners() {
  document.getElementById("msgInput").addEventListener("keypress", (e) => {
    if (e.key === "Enter") sendMessage(e);
  });
}

// --- 8. SIDEBAR SEARCH FILTER ---

function filterSidebar() {
  // 1. Get the search text from the input
  const query = document.getElementById("searchEmail").value.toLowerCase();

  // 2. Select all chat items (both Groups and Users)
  const chatItems = document.querySelectorAll(".chat-item");

  chatItems.forEach((item) => {
    // 3. Get all text inside the item (Name, Email, or "Group Chat")
    const itemText = item.innerText.toLowerCase();

    // 4. Toggle display based on whether the query matches any text in the div
    if (itemText.includes(query)) {
      item.style.display = "flex"; // Match found
    } else {
      item.style.display = "none"; // No match
    }
  });
}
