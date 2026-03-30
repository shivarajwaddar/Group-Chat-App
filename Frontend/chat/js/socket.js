/**
 * socket.js - Real-time Communication Logic
 */

export const initSocket = (token) => {
  return io("http://localhost:3000", { auth: { token } });
};

export function setupSocketListeners(socket, state, appendMessageToUI) {
  socket.off("receive_message");

  socket.on("receive_message", (msg) => {
    console.log("Socket received message:", msg);

    // 1. Ignore if from me
    const myId = state.currentUserId || localStorage.getItem("currentUserId");
    const senderId = msg.senderId || msg.dbUserId;
    if (String(senderId) === String(myId)) return;

    // 2. Map data for UI
    const messageData = {
      ...msg,
      content: msg.content || msg.message || "",
    };

    // 3. Logic to show the message
    const isGroup =
      msg.groupId && state.currentRoomId === `group_${msg.groupId}`;
    const isPrivate = msg.room === state.currentRoomId;

    if (isGroup || isPrivate) {
      appendMessageToUI(messageData, "received");
    }
  });
}
