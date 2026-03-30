/**
 * ui.js - Handles Screen Updates
 */
export const elements = {
  welcomeScreen: document.getElementById("welcomeScreen"),
  chatContent: document.getElementById("chatContent"),
  chatBox: document.getElementById("chatBox"),
  chatHeader: document.getElementById("chatHeader"),
  chatStatus: document.getElementById("chatStatus"),
  headerIcon: document.getElementById("headerIcon"),
  msgInput: document.getElementById("msgInput"),
  availableUsers: document.getElementById("availableUsers"),
  availableGroups: document.getElementById("availableGroups"),
};

export function toggleChatScreen(isVisible) {
  elements.welcomeScreen.style.display = isVisible ? "none" : "flex";
  elements.chatContent.style.display = isVisible ? "flex" : "none";
}

export function updateHeader(name, status, iconClass) {
  elements.chatHeader.innerText = name;
  elements.chatStatus.innerText = status;
  elements.headerIcon.innerHTML = `<i class="fa-solid ${iconClass}"></i>`;
}

export function appendMessageToUI(msg, type, currentUserId) {
  const msgDiv = document.createElement("div");
  msgDiv.className = `msg ${type}`;

  const content = msg.content || msg.message;
  let name =
    type === "sent"
      ? "You"
      : msg.db_user?.name || msg.User?.name || msg.senderName || "User";

  msgDiv.innerHTML = `
        <div class="user-name">${name}</div>
        <div class="message-text">${content}</div>
    `;
  elements.chatBox.appendChild(msgDiv);
  elements.chatBox.scrollTop = elements.chatBox.scrollHeight;
}

export function updateActiveUI(element) {
  document
    .querySelectorAll(".chat-item")
    .forEach((item) => item.classList.remove("active"));
  if (element) element.classList.add("active");
}
