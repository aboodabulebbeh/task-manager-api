const { User } = require("../models");

const listUserTask = async (req, res) => {
  const targetId = Number(req.params.id);
  if (req.user.roles !== "admin" && req.user.id !== targetId) {
    return res.status(403).json({ error: "Forbidden" });
  }

  const user = await User.findByPk(targetId);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  const tasks = await user.getTasks({ order: [["id", "ASC"]] });
  res.json(tasks);
};
/*
const createUser = async (req, res) => {
  const { name, email } = req.body ?? {};

  if (typeof name !== "string" || name.trim() === "") {
    return res
      .status(400)
      .json({ error: "Name is required and must be a non-empty string." });
  }
  if (typeof email !== "string" || !/^\S+@\S+\.\S+$/.test(email.trim())) {
    return res.status(400).json({ error: "Email must be a valid email." });
  }

  try {
    const user = await User.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
    });
    res.status(201).json(user);
  } catch (err) {
    if (err.name === "SequelizeUniqueConstraintError") {
      return res.status(409).json({ error: "Email already exists" });
    }
    throw err;
  }
};
*/

const listUsers = async (req, res) => {
  const users = await User.findAll({ order: [["id", "ASC"]] });
  res.json(users);
};

module.exports = { listUsers, listUserTask };
