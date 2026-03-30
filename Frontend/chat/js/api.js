/**
 * api.js - Data Fetching & Messaging Module
 */

// --- 1. CONFIGURATION & STATE ---
const BASE_URL = "http://localhost:3000/api";
const token = localStorage.getItem("token");
const currentUserId = localStorage.getItem("currentUserId");
const myEmail = localStorage.getItem("userEmail");

let currentRoomId = null;
let currentRecipientId = null;
let selectedUsers = [];

// Exporting socket so main.js can use it if needed
export const socket = io("http://localhost:3000", { auth: { token } });

// --- 2. INITIALIZATION (Exported for main.js) ---
export function initApp() {
  if (!token) {
    window.location.href = "../signin/signin.html";
    return;
  }
  document.getElementById("welcomeScreen").style.display = "flex";
  document.getElementById("chatContent").style.display = "none";

  fetchUsers();
  fetchGroups();
  setupEventListeners();
}

// --- 3. UI HELPERS ---
export function showChatScreen() {
  document.getElementById("welcomeScreen").style.display = "none";
  document.getElementById("chatContent").style.display = "flex";
}

export function updateActiveUI(element) {
  document
    .querySelectorAll(".chat-item")
    .forEach((item) => item.classList.remove("active"));
  if (element) element.classList.add("active");
}

// --- 4. DATA FETCHING ---

export async function fetchUsers() {
  try {
    const res = await axios.get(`${BASE_URL}/users/all-users`, {
      headers: { Authorization: token },
    });
    const container = document.getElementById("availableUsers");
    container.innerHTML = "";

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
    return res.data.users;
  } catch (err) {
    console.error("Fetch Users Error:", err);
  }
}

export async function fetchGroups() {
  try {
    const res = await axios.get(`${BASE_URL}/groups/user-groups`, {
      headers: { Authorization: token },
    });
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
    return res.data.groups;
  } catch (err) {
    console.error("Fetch Groups Error:", err);
  }
}

/**
 * ADDED: This function is required by main.js
 */
export async function fetchMessages(endpoint, userToken = token) {
  try {
    const res = await axios.get(`${BASE_URL}/messages/${endpoint}`, {
      headers: { Authorization: userToken },
    });
    return res.data.data;
  } catch (err) {
    console.error("fetchMessages Error:", err);
    throw err;
  }
}

// --- 5. ROOM & HISTORY ---

export async function joinGroupChat(groupId, groupName, element) {
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

export async function joinPersonalRoom(email, name, id, element) {
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

async function loadGroupHistory(groupId) {
  try {
    const res = await axios.get(
      `${BASE_URL}/messages/get-group-messages/${groupId}`,
      {
        headers: { Authorization: token },
      },
    );
    renderMessages(res.data.data);
  } catch (err) {
    console.error("Group History Error:", err);
  }
}

async function loadPrivateHistory(recipientId) {
  try {
    const res = await axios.get(
      `${BASE_URL}/messages/get-private-messages/${recipientId}`,
      {
        headers: { Authorization: token },
      },
    );
    renderMessages(res.data.data);
  } catch (err) {
    console.error("Private History Error:", err);
  }
}

function renderMessages(messages) {
  const chatBox = document.getElementById("chatBox");
  chatBox.innerHTML = "";
  messages.forEach((msg) => {
    const type =
      String(msg.dbUserId) === String(currentUserId) ? "sent" : "received";
    appendMessageToUI(msg, type);
  });
}

// --- 6. MESSAGING & S3 SUPPORT ---

export async function handleSendMessage(e) {
  if (e) e.preventDefault();
  const input = document.getElementById("msgInput");
  const fileInput = document.getElementById("fileInput");
  const text = input.value.trim();
  const file = fileInput ? fileInput.files[0] : null;

  if (!text && !file) return;

  const formData = new FormData();
  formData.append("content", text);
  if (file) formData.append("file", file);

  if (currentRoomId.startsWith("group_")) {
    formData.append("groupId", currentRoomId.split("_")[1]);
  } else {
    formData.append("recipientId", currentRecipientId);
  }

  try {
    const res = await uploadMessageAPI(formData, token);

    socket.emit(
      currentRoomId.startsWith("group_")
        ? "sendMessage"
        : "sendPersonalMessage",
      {
        ...res.data.data,
        room: currentRoomId,
      },
    );

    appendMessageToUI(res.data.data, "sent");

    // Reset UI
    input.value = "";
    if (fileInput) fileInput.value = "";
    input.placeholder = "Type a message...";
    input.style.backgroundColor = "";
  } catch (err) {
    console.error("Upload failed", err);
  }
}

export function appendMessageToUI(msg, type) {
  const chatBox = document.getElementById("chatBox");
  if (!chatBox) return; // Guard clause

  const msgDiv = document.createElement("div");
  msgDiv.className = `msg ${type}`;

  const content = msg.content || msg.message;
  const isImage =
    content &&
    (content.includes("amazonaws.com") ||
      /\.(jpg|jpeg|png|gif)$/i.test(content));

  const contentHTML = isImage
    ? `<img src="${content}" class="chat-img-bubble" style="max-width: 200px; border-radius: 8px;" onclick="window.open('${content}', '_blank')">`
    : `<div class="message-text">${content}</div>`;

  let name =
    type === "sent" ? "You" : msg.db_user?.name || msg.User?.name || "User";

  msgDiv.innerHTML = `<div class="user-name" style="font-weight: bold; font-size: 0.8em;">${name}</div>${contentHTML}`;
  chatBox.appendChild(msgDiv);
  chatBox.scrollTop = chatBox.scrollHeight;
}

// --- 7. EVENT LISTENERS ---

export function setupEventListeners() {
  document.getElementById("msgInput").addEventListener("keypress", (e) => {
    if (e.key === "Enter") handleSendMessage(e);
  });

  const form = document.getElementById("messageForm");
  if (form) form.onsubmit = handleSendMessage;

  const attachBtn = document.getElementById("attachBtn");
  if (attachBtn)
    attachBtn.onclick = () => document.getElementById("fileInput").click();

  document.getElementById("fileInput").onchange = () => {
    const file = document.getElementById("fileInput").files[0];
    if (file) {
      document.getElementById("msgInput").placeholder = `Ready: ${file.name}`;
      document.getElementById("msgInput").style.backgroundColor = "#e7f3ff";
    }
  };
}

// --- 8. API EXPORTS ---

/**
 * ALIASED: Exporting this as sendMessage so main.js doesn't crash
 */
export async function sendMessage(formData, userToken = token) {
  return uploadMessageAPI(formData, userToken);
}

export async function uploadMessageAPI(formData, userToken) {
  return await axios.post(`${BASE_URL}/messages/send`, formData, {
    headers: {
      Authorization: userToken,
      "Content-Type": "multipart/form-data",
    },
  });
}

// Global functions for HTML window scope
window.openGroupModal = () =>
  (document.getElementById("groupModal").style.display = "flex");
window.closeGroupModal = () =>
  (document.getElementById("groupModal").style.display = "none");
window.filterSidebar = () => {
  const query = document.getElementById("searchEmail").value.toLowerCase();
  document.querySelectorAll(".chat-item").forEach((item) => {
    item.style.display = item.innerText.toLowerCase().includes(query)
      ? "flex"
      : "none";
  });
};

// Also export them as actual functions for main.js
export const openGroupModal = window.openGroupModal;
export const closeGroupModal = window.closeGroupModal;
export const filterSidebar = window.filterSidebar;
