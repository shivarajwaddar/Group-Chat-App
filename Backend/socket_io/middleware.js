const jwt = require("jsonwebtoken");

const authMiddleware = (socket, next) => {
  // 1. Pull token from handshake (set in chat.js auth object)
  const token = socket.handshake.auth.token;

  if (!token) {
    return next(new Error("Authentication error: Token missing"));
  }

  // 2. Verify Token
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      // Best Practice: Check if the error is specifically due to expiration
      if (err.name === "TokenExpiredError") {
        return next(new Error("jwt expired"));
      }
      return next(new Error("Authentication error: Invalid token"));
    }

    // 3. Attach decoded data (userId, name, email) to the socket object
    // This allows handlers like chat.js to know who is sending messages
    socket.user = decoded;
    next();
  });
};

module.exports = authMiddleware;
