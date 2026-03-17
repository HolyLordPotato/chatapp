const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

// Track connected users
const users = {};

// Serve static files from /public
app.use(express.static(path.join(__dirname, "public")));

io.on("connection", (socket) => {
  console.log(`🔌 Socket connected: ${socket.id}`);

  // Handle user joining
  socket.on("user:join", (username) => {
    users[socket.id] = username;
    console.log(`👤 ${username} joined`);

    // Notify everyone else
    socket.broadcast.emit("system:message", {
      text: `${username} joined the chat`,
      timestamp: Date.now(),
    });

    // Send current user list to all clients
    io.emit("users:update", Object.values(users));
  });

  // Handle incoming chat message
  socket.on("chat:message", (msg) => {
    const username = users[socket.id] || "Anonymous";
    console.log(`💬 [${username}]: ${msg}`);

    io.emit("chat:message", {
      username,
      text: msg,
      timestamp: Date.now(),
      socketId: socket.id,
    });
  });

  // Handle typing indicator
  socket.on("chat:typing", (isTyping) => {
    const username = users[socket.id];
    if (username) {
      socket.broadcast.emit("chat:typing", { username, isTyping });
    }
  });

  // Handle disconnect
  socket.on("disconnect", () => {
    const username = users[socket.id];
    if (username) {
      delete users[socket.id];
      console.log(`❌ ${username} disconnected`);

      io.emit("system:message", {
        text: `${username} left the chat`,
        timestamp: Date.now(),
      });

      io.emit("users:update", Object.values(users));
    }
  });
});

server.listen(PORT, () => {
  console.log(`🚀 Chat server running at http://localhost:${PORT}`);
});