const jwt = require("jsonwebtoken");

const authMiddleware = (socket, next) => {
  //comming form client form chat js
  const token = socket.handshake.auth.token;

  if (!token) {
    return next(new Error("Authentication error: Token missing"));
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return next(new Error("Authentication error: Invalid token"));

    // Attach user data (decoded from JWT) to the socket object
    socket.user = decoded;
    next();
  });
};

module.exports = authMiddleware;
