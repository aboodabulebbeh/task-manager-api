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

const listUsers = async (req, res) => {
  const users = await User.findAll({ order: [["id", "ASC"]] });
  res.json(users);
};

module.exports = { listUsers, listUserTask };
