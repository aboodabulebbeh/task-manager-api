const { Task, User } = require("../models");

// is this user allowed to access this task ?
const canAccess = (task, user) =>
  user.roles === "admin" || task.userId === user.id;

// Define the userInclude object to include user details in task queries
const userInclude = { model: User, as: "user", attributes: ["id", "name"] };

const createTask = async (req, res) => {
  const { title, description, completed } = req.body ?? {};

  if (typeof title !== "string" || title.trim() === "") {
    return res
      .status(400)
      .json({ error: "Title is required and must be a non-empty string." });
  }

  if (completed !== undefined && typeof completed !== "boolean") {
    return res.status(400).json({ error: "Completed must be a boolean." });
  }

  if (description !== undefined && typeof description !== "string") {
    return res.status(400).json({ error: "Description must be a string." });
  }

  const task = await Task.create({
    title: title.trim(),
    description: description ?? "",
    completed: completed ?? false,
    userId: req.user.id, // from the authenticated user, not from the request body
  });
  res.status(201).json(task);
};

const listTasks = async (req, res) => {
  const { completed } = req.query;
  const where = req.user.roles === "admin" ? {} : { userId: req.user.id };
  if (completed !== undefined) {
    if (completed !== "true" && completed !== "false") {
      return res
        .status(400)
        .json({ error: "Completed query parameter must be 'true' or 'false'" });
    }
    where.completed = completed === "true";
  }

  const tasks = await Task.findAll({
    where,
    include: userInclude, // include user details in the response
    order: [["id", "ASC"]],
  });
  res.json(tasks);
};

const getTaskById = async (req, res) => {
  const task = await Task.findByPk(req.params.id, { include: userInclude });
  if (!task || !canAccess(task, req.user)) {
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
  if (!task || !canAccess(task, req.user)) {
    return res.status(404).json({ error: "Task not found" });
  }

  if (title !== undefined) task.title = title.trim();
  if (description !== undefined) task.description = description;
  if (completed !== undefined) task.completed = completed;

  await task.save();
  res.json(task);
};

const deleteTask = async (req, res) => {
  /*
  const deleted = await Task.destroy({ where: { id: req.params.id } }); ser destoy method returns the number of rows deleted (0 if none were deleted)
  if (deleted === 0) {
    return res.status(404).json({ error: "Task not found" });
  }

  res.status(204).send();*/
  const task = await Task.findByPk(req.params.id);
  if (!task || !canAccess(task, req.user)) {
    return res.status(404).json({ error: "Task not found" });
  }

  await task.destroy(); // to delete the task from the database
  res.status(204).send(); // 204 No Content indicates that the request was successful but there is no content to send in the response
};

module.exports = {
  createTask,
  listTasks,
  getTaskById,
  updateTask,
  deleteTask,
};
