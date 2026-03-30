/**
 * main.js - The Controller
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
  selectedUsers: [],
};

const socket = initSocket(state.token);

window.addEventListener("DOMContentLoaded", () => {
  if (!state.token) return (window.location.href = "../signin/signin.html");

  // Initial Load
  loadSidebar();
  setupSocketListeners(socket, state, ui.appendMessageToUI);

  // Event Listeners
  ui.elements.msgInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") handleSendMessage();
  });
});

async function loadSidebar() {
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
}

function createChatItem(name, subtext, icon) {
  const div = document.createElement("div");
  div.className = "chat-item";
  div.innerHTML = `<div class="profile-circle"><i class="fa-solid ${icon}"></i></div>
                     <div class="chat-meta"><strong>${name}</strong><p>${subtext}</p></div>`;
  return div;
}

// Global functions for HTML onclick
window.joinGroupChat = async (id, name, element) => {
  ui.toggleChatScreen(true);
  state.currentRoomId = `group_${id}`;
  ui.updateHeader(name, "Group Chat", "fa-users");
  ui.updateActiveUI(element);

  socket.emit("join_room", { room: state.currentRoomId });
  const messages = await api.fetchMessages(
    `get-group-messages/${id}`,
    state.token,
  );
  ui.elements.chatBox.innerHTML = "";
  messages.forEach((m) => {
    const type =
      String(m.dbUserId) === String(state.currentUserId) ? "sent" : "received";
    ui.appendMessageToUI(m, type, state.currentUserId);
  });
};

function handleSendMessage() {
  const text = ui.elements.msgInput.value.trim();
  if (!text) return;
  const payload = { content: text, room: state.currentRoomId };
  socket.emit(
    state.currentRoomId.startsWith("group_")
      ? "sendMessage"
      : "sendPersonalMessage",
    payload,
  );
  ui.appendMessageToUI({ content: text }, "sent", state.currentUserId);
  ui.elements.msgInput.value = "";
}

window.filterSidebar = () => {
  const query = document.getElementById("searchEmail").value.toLowerCase();
  document.querySelectorAll(".chat-item").forEach((item) => {
    item.style.display = item.innerText.toLowerCase().includes(query)
      ? "flex"
      : "none";
  });
};
