/**
 * ui.js - Handles Screen Updates & Media Rendering
 */
export const elements = {
  welcomeScreen: document.getElementById("welcomeScreen"),
  chatContent: document.getElementById("chatContent"),
  chatBox: document.getElementById("chatBox"),
  chatHeader: document.getElementById("chatHeader"),
  chatStatus: document.getElementById("chatStatus"),
  headerIcon: document.getElementById("headerIcon"),
  msgInput: document.getElementById("msgInput"),
  fileInput: document.getElementById("fileInput"),
  availableUsers: document.getElementById("availableUsers"),
  availableGroups: document.getElementById("availableGroups"),
};

export function toggleChatScreen(isVisible) {
  elements.welcomeScreen.style.display = isVisible ? "none" : "flex";
  elements.chatContent.style.display = isVisible ? "flex" : "none";
}

/**
 * Simplified Header Update
 */
export function updateHeader(name, status, iconClass) {
  elements.chatHeader.innerText = name;
  elements.chatStatus.innerText = status;
  elements.headerIcon.innerHTML = `<i class="fa-solid ${iconClass}"></i>`;
}

/**
 * Helper to determine how to render S3 content (Images, Video, Audio, Docs)
 */
function getMessageHTML(content) {
  if (!content || !content.includes("amazonaws.com")) {
    return `<div class="message-text">${content || ""}</div>`;
  }

  const urlParts = content.split("?")[0].split(".");
  const ext = urlParts.pop().toLowerCase();

  if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext)) {
    return `<img src="${content}" class="chat-img-bubble" alt="Sent Image" onclick="window.open('${content}', '_blank')">`;
  }

  if (["mp4", "webm", "ogg"].includes(ext)) {
    return `
      <video controls class="chat-video-bubble" style="max-width: 100%; border-radius: 10px;">
        <source src="${content}" type="video/${ext}">
        Your browser does not support video.
      </video>`;
  }

  if (["mp3", "wav", "m4a"].includes(ext)) {
    return `
      <div class="audio-container">
        <audio controls style="width: 200px;"><source src="${content}"></audio>
      </div>`;
  }

  return `
    <div class="file-download-bubble" onclick="window.open('${content}', '_blank')">
      <i class="fa-solid fa-file-arrow-down"></i>
      <span>Download File (.${ext})</span>
    </div>`;
}

export function appendMessageToUI(msg, type, currentUserId) {
  const msgDiv = document.createElement("div");
  msgDiv.className = `msg ${type}`;

  const content = msg.content || msg.message || "";
  let name =
    type === "sent" ? "You" : msg.db_user?.name || msg.User?.name || "User";

  const contentHTML = getMessageHTML(content);

  msgDiv.innerHTML = `
        <div class="user-name">${name}</div>
        <div class="bubble-content">${contentHTML}</div>
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

export function clearChatBox() {
  elements.chatBox.innerHTML = "";
}
