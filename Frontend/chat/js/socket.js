/**
 * socket.js - Handles Socket.io events
 */
export function initSocket(token) {
  return io("http://localhost:3000", { auth: { token } });
}

export function setupSocketListeners(socket, state, callback) {
  socket.on("receive_message", (data) => {
    if (data.room === state.currentRoomId) {
      if (String(data.senderId) !== String(state.currentUserId)) {
        callback(data, "received", state.currentUserId);
      }
    }
  });
}
