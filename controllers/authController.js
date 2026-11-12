const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { User } = require("../models");

// to create JWT
const signToken = (user) =>
  jwt.sign({ roles: user.roles }, process.env.JWT_SECRET, {
    subject: String(user.id),
    expiresIn: process.env.JWT_EXPIRES_IN || "1d",
    algorithm: "HS256",
  });

const register = async (req, res) => {
  const { name, email, password } = req.body ?? {};

  if (typeof name != "string" || name.trim() === "") {
    return res
      .status(400)
      .json({ error: " Name is required and must be a non-empty string." });
  }

  if (typeof email != "string" || !/^\S+@\S+\.\S+$/.test(email.trim())) {
    return res.status(400).json({ error: "Email must be a vaild email" });
  }

  if (
    typeof password != "string" ||
    password.length < 8 ||
    password.length > 100
  ) {
    return res.status(400).json({
      error: "Password must be a string between 8 and 100 characters.",
    });
  }

  try {
    const user = await User.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      passwordHash: await bcrypt.hash(password, 12),
    });
    res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    if (err.name === "SequelizeUniqueConstraintError") {
      return res.status(409).json({ error: "Email already exists" });
    }
    throw err;
  }
};

const login = async (req, res) => {
  const { email, password } = req.body ?? {};

  if (typeof email !== "string" || typeof password !== "string") {
    return res
      .status(400)
      .json({ error: "Email and password are required and must be strings." });
  }

  const user = await User.unscoped().findOne({
    where: { email: email.trim().toLowerCase() },
  });

  const ok = user && (await bcrypt.compare(password, user.passwordHash));

  if (!ok) {
    return res.status(400).json({ error: "Invalid email or password" });
  }

  const { passwordHash, ...safeUser } = user.toJSON();
  res.json({ user: safeUser, token: signToken(user) });
};

module.exports = { register, login, signToken };
