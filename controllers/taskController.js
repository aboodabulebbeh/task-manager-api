const { Task, User } = require("../models");
const redis = require("../config/redis");
const { Op } = require("sequelize");
const { csvEscape } = require("../utils/csv");

//this is a name and format for redis
const cacheKey = (userId, completed, page, limit) =>
  `tasks:user:${userId}:${completed ?? "all"}:page:${page}:limit:${limit}`;

const invalidateTasksCache = async (userId) => {
  try {
    const stream = redis.scanStream({
      match: `tasks:user:${userId}:*`,
    });
    for await (const keys of stream) {
      if (keys.length > 0) await redis.del(...keys);
    }
  } catch (err) {
    console.error("Redis del failed: ", err.message);
  }
};

// Define the userInclude object to include user details in task queries
const userInclude = { model: User, as: "user", attributes: ["id", "name"] };

const exportTasks = async (req, res) => {
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

  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", 'attachment; filename="tasks.csv"');

  const header = [
    "id",
    "title",
    "description",
    "completed",
    "created_at",
    "user_id",
    "user_name",
  ];
  res.write("\uFEFF" + header.map(csvEscape).join(",") + "\r\n");

  const BATCH = 2000;
  let lastId = 0;

  try {
    while (true) {
      const tasks = await Task.findAll({
        where: { ...where, id: { [Op.gt]: lastId } },
        include: userInclude,
        order: [["id", "ASC"]],
        limit: BATCH,
      });
      if (tasks.length === 0) break;

      const chunk = tasks
        .map((t) =>
          [
            t.id,
            t.title,
            t.description,
            t.completed,
            t.createdAt ? t.createdAt.toISOString() : "",
            t.userId,
            t.user?.name,
          ]
            .map(csvEscape)
            .join(","),
        )
        .join("\r\n");

      if (!res.write(chunk + "\r\n")) {
        await new Promise((resolve) => res.once("drain", resolve));
      }

      lastId = tasks[tasks.length - 1].id;
      if (tasks.length < BATCH) break;
    }
    res.end();
  } catch (err) {
    console.error("Export failed:", err.message);
    res.destroy(err);
  }
};

// is this user allowed to access this task ?
const canAccess = (task, user) =>
  user.roles === "admin" || task.userId === user.id;

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
  await invalidateTasksCache(req.user.id);
  res.status(201).json(task);
};

const listTasks = async (req, res) => {
  const { completed } = req.query;

  const page = req.query.page === undefined ? 1 : Number(req.query.page);
  const limit = req.query.limit === undefined ? 10 : Number(req.query.limit);

  if (!Number.isInteger(page) || page < 1) {
    return res.status(400).json({ error: "page must be positive integer" });
  }

  if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
    return res
      .status(400)
      .json({ error: "limit must be positive integer between 1 and 100" });
  }
  const where = req.user.roles === "admin" ? {} : { userId: req.user.id };
  if (completed !== undefined) {
    if (completed !== "true" && completed !== "false") {
      return res
        .status(400)
        .json({ error: "Completed query parameter must be 'true' or 'false'" });
    }
    where.completed = completed === "true";
  }

  const useCache = req.user.roles !== "admin";
  const key = cacheKey(req.user.id, completed, page, limit);

  if (useCache) {
    try {
      const cached = await redis.get(key);
      if (cached) return res.json(JSON.parse(cached)); //JSON.parse(cached): We convert the text into an array.
    } catch (err) {
      console.error("Redis get failed:", err.message);
    }
  }

  // This retrieves from the database only the tasks for the requested page, along with the total number of tasks.
  const { count, rows } = await Task.findAndCountAll({
    where,
    include: userInclude, // include user details in the response
    order: [["id", "ASC"]],
    limit,
    offset: (page - 1) * limit, // How many tasks does he skip from the start
  });

  const result = {
    data: rows,
    pagination: {
      page,
      limit,
      total: count,
      totalPages: Math.ceil(count / limit),
    },
  };

  if (useCache) {
    try {
      await redis.set(key, JSON.stringify(result)); // JSON.Stringfy :A function that converts any JavaScript object or array into text.
    } catch (err) {
      console.error("Redis set failed:", err.message);
    }
  }
  res.json(result);
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
  await invalidateTasksCache(task.userId);
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
  await invalidateTasksCache(task.userId);
  res.status(204).send(); // 204 No Content indicates that the request was successful but there is no content to send in the response
};

module.exports = {
  createTask,
  listTasks,
  getTaskById,
  updateTask,
  deleteTask,
  exportTasks,
};
