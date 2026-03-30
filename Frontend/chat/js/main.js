/**
 * main.js - The Controller
 */
import * as api from "./api.js";
import * as ui from "./ui.js";
import { initSocket, setupSocketListeners } from "./socket.js";

// --- 1. APPLICATION STATE ---
const state = {
  token: localStorage.getItem("token"),
  currentUserId: localStorage.getItem("currentUserId"),
  myEmail: localStorage.getItem("userEmail"),
  currentRoomId: null,
  currentRecipientId: null,
};

// Initialize Socket connection
const socket = initSocket(state.token);

// --- 2. INITIALIZATION ---
window.addEventListener("DOMContentLoaded", () => {
  // Auth Check
  if (!state.token) return (window.location.href = "../signin/signin.html");

  // Load Sidebar (Users and Groups)
  loadSidebar();

  // Attach Socket Listeners
  setupSocketListeners(socket, state, ui.appendMessageToUI);

  // File Attachment UI
  const attachBtn = document.getElementById("attachBtn");
  if (attachBtn) {
    attachBtn.onclick = () => ui.elements.fileInput.click();
  }

  // Handle Form Submission
  const messageForm = document.getElementById("messageForm");
  if (messageForm) {
    messageForm.onsubmit = (e) => {
      e.preventDefault();
      handleSendMessage();
    };
  }
});

// --- 3. SIDEBAR LOGIC ---
async function loadSidebar() {
  try {
    const users = await api.fetchUsers(state.token);
    const groups = await api.fetchGroups(state.token);

    // Render Users
    ui.elements.availableUsers.innerHTML = "";
    users.forEach((u) => {
      if (String(u.id) === String(state.currentUserId)) return;
      const div = createChatItem(u.name, u.email, "fa-user");
      div.onclick = () => joinPersonalRoom(u.email, u.name, u.id, div);
      ui.elements.availableUsers.appendChild(div);
    });

    // Render Groups
    ui.elements.availableGroups.innerHTML = "";
    groups.forEach((g) => {
      const div = createChatItem(g.name, "Group Chat", "fa-users");
      div.onclick = () => joinGroupChat(g.id, g.name, div);
      ui.elements.availableGroups.appendChild(div);
    });
  } catch (err) {
    console.error("Sidebar Load Error:", err);
  }
}

function createChatItem(name, subtext, icon) {
  const div = document.createElement("div");
  div.className = "chat-item";
  div.innerHTML = `
    <div class="profile-circle"><i class="fa-solid ${icon}"></i></div>
    <div class="chat-meta"><strong>${name}</strong><p>${subtext}</p></div>
  `;
  return div;
}

// --- 4. MESSAGING LOGIC (S3 & SOCKET) ---
async function handleSendMessage() {
  const text = ui.elements.msgInput.value.trim();
  const file = ui.elements.fileInput.files[0];

  if (!text && !file) return;

  const formData = new FormData();
  formData.append("content", text);

  // Determine if Group or Private
  if (state.currentRoomId && state.currentRoomId.startsWith("group_")) {
    formData.append("groupId", state.currentRoomId.split("_")[1]);
  } else if (state.currentRecipientId) {
    formData.append("recipientId", state.currentRecipientId);
  }

  if (file) {
    formData.append("file", file);
  }

  try {
    // 1. Save to DB and Upload to S3 via API
    const response = await api.sendMessage(formData, state.token);
    const savedMsg = response.data.data;

    // 2. Determine Socket Event
    const isGroup = state.currentRoomId.startsWith("group_");
    const socketEvent = isGroup ? "sendMessage" : "sendPersonalMessage";

    // 3. Single Emit via Socket (Includes everything backend needs)

    socket.emit(socketEvent, {
      ...savedMsg, // Contains the S3 URL
      room: state.currentRoomId,
      senderId: state.currentUserId,
      recipientId: state.currentRecipientId, // CRITICAL: Used by personalChat.js
      groupId: isGroup ? state.currentRoomId.split("_")[1] : null,
    });

    // 4. Manually Append for SENDER (Fast UI update)
    ui.appendMessageToUI(savedMsg, "sent", state.currentUserId);

    // 5. Reset UI
    ui.elements.msgInput.value = "";
    ui.elements.fileInput.value = "";
    ui.elements.msgInput.placeholder = "Type a message...";
    ui.elements.msgInput.style.backgroundColor = "";
  } catch (err) {
    console.error("Failed to send message:", err);
  }
}

// --- 5. NAVIGATION (ROOM JOINING) ---
window.joinGroupChat = async (id, name, element) => {
  ui.toggleChatScreen(true);
  ui.clearChatBox();
  state.currentRoomId = `group_${id}`;
  state.currentRecipientId = null;
  ui.updateHeader(name, "Group Chat", "fa-users");
  ui.updateActiveUI(element);

  socket.emit("join_room", { room: state.currentRoomId });

  try {
    const messages = await api.fetchMessages(
      `get-group-messages/${id}`,
      state.token,
    );
    messages.forEach((m) => {
      const type =
        String(m.dbUserId) === String(state.currentUserId)
          ? "sent"
          : "received";
      ui.appendMessageToUI(m, type, state.currentUserId);
    });
  } catch (err) {
    console.error("Group History Load Error:", err);
  }
};

window.joinPersonalRoom = async (email, name, id, element) => {
  ui.toggleChatScreen(true);
  ui.clearChatBox();
  ui.updateHeader(name, "Direct Message", "fa-user");
  ui.updateActiveUI(element);

  state.currentRoomId = `personal_${id}`;
  state.currentRecipientId = id;

  socket.emit("join_room", { room: state.currentRoomId });

  try {
    const messages = await api.fetchMessages(
      `get-private-messages/${id}`,
      state.token,
    );
    messages.forEach((m) => {
      const type =
        String(m.dbUserId) === String(state.currentUserId)
          ? "sent"
          : "received";
      ui.appendMessageToUI(m, type, state.currentUserId);
    });
  } catch (err) {
    console.error("Private History Load Error:", err);
  }
};

// --- 6. UTILITIES ---
window.filterSidebar = () => {
  const query = document.getElementById("searchEmail").value.toLowerCase();
  document.querySelectorAll(".chat-item").forEach((item) => {
    item.style.display = item.innerText.toLowerCase().includes(query)
      ? "flex"
      : "none";
  });
};

ui.elements.fileInput.onchange = () => {
  const file = ui.elements.fileInput.files[0];
  if (file) {
    ui.elements.msgInput.placeholder = `Ready to send: ${file.name}`;
    ui.elements.msgInput.style.backgroundColor = "#e7f3ff";
  }
};
