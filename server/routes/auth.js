const router = require("express").Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");


// SIGNUP
router.post("/signup", async (req, res) => {
  const { username, email, password } = req.body;

  const hashed = await bcrypt.hash(password, 10);

  const user = new User({
    username,
    email,
    password: hashed,
  });

  await user.save();

  res.json({ msg: "User created" });
});


// LOGIN
router.post("/login", async (req, res) => {
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
      avatar: user.avatar,
    },
  });
});

module.exports = router;
