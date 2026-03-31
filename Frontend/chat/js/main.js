/**
 * main.js - The Central Controller
 */
import * as api from "./api.js";
import * as ui from "./ui.js";
import { initSocket, setupSocketListeners } from "./socket.js";

const state = {
  token: localStorage.getItem("token"),
  currentUserId: localStorage.getItem("currentUserId"),
  myEmail: localStorage.getItem("userEmail"),
  currentRoomId: null,
  currentRecipientId: null,
};

let selectedUsers = [];
const socket = initSocket(state.token);

// --- INITIALIZATION ---
window.addEventListener("DOMContentLoaded", () => {
  if (!state.token) return (window.location.href = "../signin/signin.html");

  loadSidebar();
  setupSocketListeners(socket, state, ui.appendMessageToUI);

  const attachBtn = document.getElementById("attachBtn");
  if (attachBtn) attachBtn.onclick = () => ui.elements.fileInput.click();

  const messageForm = document.getElementById("messageForm");
  if (messageForm) {
    messageForm.onsubmit = (e) => {
      e.preventDefault();
      handleSendMessage();
    };
  }
});

// --- SIDEBAR LOADING ---
async function loadSidebar() {
  try {
    const usersData = await api.fetchUsers(state.token);
    const groupsData = await api.fetchGroups(state.token);

    const users = Array.isArray(usersData) ? usersData : usersData.users || [];
    const groups = Array.isArray(groupsData)
      ? groupsData
      : groupsData.groups || [];

    ui.elements.availableUsers.innerHTML = "";
    users.forEach((u) => {
      if (String(u.id) === String(state.currentUserId)) return;
      const div = createChatItem(u.name, u.email, "fa-user");
      div.onclick = () => joinPersonalRoom(u.email, u.name, u.id, div);
      ui.elements.availableUsers.appendChild(div);
    });

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

// --- SEND MESSAGE ---
async function handleSendMessage() {
  const text = ui.elements.msgInput.value.trim();
  const file = ui.elements.fileInput.files[0];

  if (!text && !file) return;

  const formData = new FormData();
  formData.append("content", text);

  const isGroup =
    state.currentRoomId && state.currentRoomId.startsWith("group_");
  if (isGroup) {
    formData.append("groupId", state.currentRoomId.split("_")[1]);
  } else if (state.currentRecipientId) {
    formData.append("recipientId", state.currentRecipientId);
  }

  if (file) formData.append("file", file);

  try {
    const response = await api.sendMessage(formData, state.token);
    const savedMsg = response.data.data;
    const socketEvent = isGroup ? "sendMessage" : "sendPersonalMessage";

    socket.emit(socketEvent, {
      ...savedMsg,
      room: state.currentRoomId,
      senderId: state.currentUserId,
      recipientId: state.currentRecipientId,
      groupId: isGroup ? state.currentRoomId.split("_")[1] : null,
    });

    ui.appendMessageToUI(savedMsg, "sent", state.currentUserId);
    ui.elements.msgInput.value = "";
    ui.elements.fileInput.value = "";
    ui.elements.msgInput.placeholder = "Type a message...";
    ui.elements.msgInput.style.backgroundColor = "";
  } catch (err) {
    console.error("Send Error:", err);
  }
}

// --- NAVIGATION ---
window.joinGroupChat = async (id, name, element) => {
  ui.toggleChatScreen(true);
  ui.clearChatBox();
  state.currentRoomId = `group_${id}`;
  state.currentRecipientId = null;
  ui.updateActiveUI(element);
  ui.updateHeader(name, "Group Chat", "fa-users");

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
    console.error("History Error:", err);
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
    console.error("Private History Error:", err);
  }
};

// --- GROUP MODAL ---
window.openGroupModal = async () => {
  const modal = document.getElementById("groupModal");
  const userListDiv = document.getElementById("modalUserList");
  modal.style.display = "flex";
  userListDiv.innerHTML = "Loading...";
  selectedUsers = [];

  try {
    const data = await api.fetchUsers(state.token);
    const users = Array.isArray(data) ? data : data.users || [];
    userListDiv.innerHTML = "";

    users.forEach((u) => {
      if (String(u.id) === String(state.currentUserId)) return;
      const div = document.createElement("div");
      div.className = "user-select-item";
      div.innerHTML = `
          <input type="checkbox" id="user-${u.id}" value="${u.id}">
          <label for="user-${u.id}">${u.name} (${u.email})</label>
      `;
      div.querySelector("input").onchange = (e) => {
        const uid = parseInt(e.target.value);
        if (e.target.checked) selectedUsers.push(uid);
        else selectedUsers = selectedUsers.filter((id) => id !== uid);
      };
      userListDiv.appendChild(div);
    });
  } catch (err) {
    userListDiv.innerHTML = "Error loading users.";
  }
};

window.closeGroupModal = () =>
  (document.getElementById("groupModal").style.display = "none");

window.createNewGroup = async () => {
  const name = document.getElementById("groupNameInput").value.trim();
  if (!name || selectedUsers.length === 0)
    return alert("Fill name and select members");

  try {
    await axios.post(
      "http://localhost:3000/api/groups/create",
      { name, members: selectedUsers },
      {
        headers: { Authorization: state.token },
      },
    );
    alert("Group created!");
    window.closeGroupModal();
    loadSidebar();
  } catch (err) {
    alert("Failed to create group.");
  }
};

// --- UTILS ---
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
    ui.elements.msgInput.placeholder = `📎 Selected: ${file.name}`;
    ui.elements.msgInput.style.backgroundColor = "#e7f3ff";
  }
};
