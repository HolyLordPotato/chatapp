const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const PORT = process.env.PORT || 3000;

const users = {};

app.use(express.static(path.join(__dirname, "public")));

io.on("connection", (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  socket.on("user:join", (username) => {
    users[socket.id] = username;
    console.log(`${username} joined`);

    socket.broadcast.emit("system:message", {
      text: `${username} joined the chat`,
      timestamp: Date.now(),
    });

    io.emit("users:update", Object.values(users));
  });

  socket.on("chat:message", (msg) => {
    const username = users[socket.id] || "Anonymous";
    console.log(`[${username}]: ${msg}`);

    io.emit("chat:message", {
      username,
      text: msg,
      timestamp: Date.now(),
    });
  });

  socket.on("disconnect", () => {
    const username = users[socket.id];
    delete users[socket.id];

    if (username) {
      io.emit("system:message", {
        text: `${username} left the chat`,
        timestamp: Date.now(),
      });

      io.emit("users:update", Object.values(users));
    }
  });
});

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
