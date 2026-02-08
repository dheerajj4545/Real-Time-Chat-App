const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

/* ---------------- MONGODB CONNECT ---------------- */

mongoose.connect(process.env.MONGO_URL)
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log(err));

/* ---------------- USER SCHEMA ---------------- */

const userSchema = new mongoose.Schema({
  username: String,
  email: String,
  password: String,
  avatar: String,
  lastSeen: {
    type: Date,
    default: Date.now
  },
  isOnline: {
    type: Boolean,
    default: false
  }
});

const User = mongoose.model("User", userSchema);

/* ---------------- MESSAGE SCHEMA ---------------- */

const messageSchema = new mongoose.Schema({
  id: String,
  username: String,
  room: String,
  message: String,
  type: String,
  time: String,
  status: {
    type: String,
    default: "sent"
  }
});

const Message = mongoose.model("Message", messageSchema);

/* ---------------- AUTH ROUTES ---------------- */

app.post("/api/auth/signup", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    const exist = await User.findOne({ email });
    if (exist) return res.status(400).json("User already exists");

    const hashed = await bcrypt.hash(password, 10);

    const user = new User({
      username,
      email,
      password: hashed,
    });

    await user.save();
    res.json({ msg: "Signup successful" });
  } catch (err) {
    res.status(500).json("Signup error");
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json("User not found");

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(400).json("Wrong password");

    const token = jwt.sign(
      { id: user._id },
      "secret123",
      { expiresIn: "7d" }
    );

    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        avatar: user.avatar
      },
    });
  } catch (err) {
    res.status(500).json("Login error");
  }
});

/* ---------------- AVATAR UPLOAD ---------------- */

app.post("/api/upload-avatar", async (req, res) => {
  try {
    const { username, avatar } = req.body;

    await User.updateOne({ username }, { avatar });

    res.json("Avatar updated");
  } catch (err) {
    res.status(500).json("Avatar upload error");
  }
});

/* -------- USERS LIST -------- */

app.get("/api/users", async (req, res) => {
  try {
    const users = await User.find({}, "username avatar isOnline lastSeen");
    res.json(users);
  } catch (err) {
    res.status(500).json("Error fetching users");
  }
});

/* ---------------- SOCKET ---------------- */

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

let users = [];

io.on("connection", (socket) => {
  console.log("Connected:", socket.id);

  socket.on("join", async ({ username, room }) => {
    socket.join(room);

    await User.updateOne({ username }, { isOnline: true });

    users = users.filter((u) => u.id !== socket.id);
    users.push({ id: socket.id, username, room });

    io.to(room).emit(
      "onlineUsers",
      users.filter((u) => u.room === room)
    );

    const oldMessages = await Message.find({ room }).sort({ _id: 1 });
    socket.emit("oldMessages", oldMessages);
  });

  socket.on("sendMessage", async ({ message, username, room, type }) => {
    const msg = new Message({
      id: Date.now().toString(),
      message,
      username,
      room,
      type: type || "text",
      time: new Date().toLocaleTimeString(),
      status: "delivered"
    });

    await msg.save();
    io.to(room).emit("receiveMessage", msg);
  });

  socket.on("typing", ({ username, room }) => {
    socket.to(room).emit("typing", username);
  });

  socket.on("deleteMessage", async ({ id, room }) => {
    await Message.deleteOne({ id });
    io.to(room).emit("messageDeleted", id);
  });

  socket.on("seen", async ({ room }) => {
    await Message.updateMany({ room }, { status: "seen" });
    io.to(room).emit("seen");
  });

  /* 🔥 TAB CLOSE → CHECK ROOM EMPTY → DELETE HISTORY */
  socket.on("leaveRoom", async ({ username, room }) => {
    users = users.filter((u) => u.id !== socket.id);

    const usersLeft = users.filter((u) => u.room === room);

    if (usersLeft.length === 0) {
      await Message.deleteMany({ room });
      console.log("Room deleted:", room);
    }

    io.to(room).emit(
      "onlineUsers",
      users.filter((u) => u.room === room)
    );
  });

  socket.on("disconnect", async () => {
  const user = users.find((u) => u.id === socket.id);
  users = users.filter((u) => u.id !== socket.id);

  if (user) {
    await User.updateOne(
      { username: user.username },
      {
        isOnline: false,
        lastSeen: new Date()
      }
    );

    io.to(user.room).emit(
      "onlineUsers",
      users.filter((u) => u.room === user.room)
    );

    /* 🔥 NEW LOGIC */
    const roomUsers = users.filter(u => u.room === user.room);

    // Agar room me koi nahi bacha
    if (roomUsers.length === 0) {
      await Message.deleteMany({ room: user.room });
      console.log("Room cleared:", user.room);
    }
  }
});
});

server.listen(5000, () => console.log("Server running 5000"));