const Task = require("../models/task");

const createTask = async (req, res) => {
  const { title, description, completed } = req.body ?? {};
  if (typeof title !== "string" || title.trim() === "") {
    return res
      .status(400)
      .json({ error: "Title is required and must be a non-empty string." });
  }

  // +++++++++++++++++++++++++++++++++++++++++++
  if (completed !== undefined && typeof completed !== "boolean") {
    return res.status(400).json({ error: "Completed must be a boolean." });
  }
  if (description !== undefined && typeof description !== "string") {
    return res.status(400).json({ error: "Description must be a string." });
  }
  //++++++++++++++++++++++++++++++++++++++++++++
  const task = await Task.create({
    title: title.trim(),
    description: description ?? "",
    completed: completed ?? false,
  });
  res.status(201).json(task);
};

const listTasks = async (req, res) => {
  const { completed } = req.query;
  if (completed === undefined) {
    const tasks = await Task.findAll({ order: [["id", "ASC"]] });
    return res.json(tasks);
  }
  if (completed !== "true" && completed !== "false") {
    return res.status(400).json({
      error: "Completed query parameter must be 'true' or 'false'.",
    });
  }

  const tasks = await Task.findAll({
    where: { completed: completed === "true" },
    order: [["id", "ASC"]],
  });
  res.json(tasks);
};

const getTaskById = async (req, res) => {
  const task = await Task.findByPk(req.params.id);
  if (!task) {
    return res.status(404).json({ error: "Task not found" });
  }
  res.json(task);
};

const updateTask = async (req, res) => {
  const { title, description, completed } = req.body ?? {};

  if (
    title !== undefined &&
    (typeof title !== "string" || title.trim() === "")
  ) {
    return res.status(400).json({ error: "Title must be non-empty string." });
  }

  if (description !== undefined && typeof description !== "string") {
    return res.status(400).json({ error: "Description must be a string." });
  }
  if (completed !== undefined && typeof completed !== "boolean") {
    return res.status(400).json({ error: "Completed must be a boolean." });
  }

  if (
    title === undefined &&
    description === undefined &&
    completed === undefined
  ) {
    return res.status(400).json({
      error:
        "At least one field (title, description, completed) must be provided for update.",
    });
  }

  const task = await Task.findByPk(req.params.id);
  if (!task) {
    return res.status(404).json({ error: "Task not found" });
  }

  if (title !== undefined) task.title = title.trim();
  if (description !== undefined) task.description = description;
  if (completed !== undefined) task.completed = completed;

  await task.save();
  res.json(task);
};

const deleteTask = async (req, res) => {
  const deleted = await Task.destroy({ where: { id: req.params.id } });
  if (deleted === 0) {
    return res.status(404).json({ error: "Task not found" });
  }

  res.status(204).send();
};

module.exports = { createTask, listTasks, getTaskById, updateTask, deleteTask };
