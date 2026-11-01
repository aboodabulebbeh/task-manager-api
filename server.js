// بحطو عشان يقرأ ملف .env
require("dotenv").config();

// استيراد مكتبه express
const express = require("express");
//    {اتصال بال database, بحدد انواع الاعمده }
const { Sequelize, DataTypes } = require("sequelize");

const app = express();
//  بقرأ الطلب يلي موجود بال body يلي ببعتو واذا كان json بحولو ل JS
app.use(express.json());

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: "postgres", // database type
  logging: false, // عشان ما يطلعلي كل استعلامات ال database بال console
});

const Task = sequelize.define(
  "Task",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    title: { type: DataTypes.TEXT, allowNull: false },
    description: { type: DataTypes.TEXT, defaultValue: "" },
    completed: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  },
  {
    tableName: "tasks",
    underscored: true, // عشان يحول الاسماء من camelCase ل snake_case
    updatedAt: false,
  },
);

const validateId = (req, res, next) => {
  const { id } = req.params;
  if (!/^\d+$/.test(id) || Number(id) < 1 || Number(id) > 2147483647) {
    return res.status(404).json({ error: "Task not found" });
  }
  next();
};

app.get("/", (req, res) => {
  res.json({ status: "ok" });
});

app.post("/tasks", async (req, res) => {
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
});

app.get("/tasks", async (req, res) => {
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
});

app.get("/tasks/:id", validateId, async (req, res) => {
  const task = await Task.findByPk(req.params.id);
  if (!task) {
    return res.status(404).json({ error: "Task not found" });
  }
  res.json(task);
});

app.patch("/tasks/:id", validateId, async (req, res) => {
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

  const updates = {};
  if (title !== undefined) updates.title = title.trim();
  if (description !== undefined) updates.description = description;
  if (completed !== undefined) updates.completed = completed;

  await task.update(updates);
  res.json(task);
});

app.delete("/tasks/:id", validateId, async (req, res) => {
  const deleted = await Task.destroy({ where: { id: req.params.id } });
  if (deleted === 0) {
    return res.status(404).json({ error: "Task not found" });
  }

  res.status(204).send();
});

app.use((req, res) => {
  res
    .status(404)
    .json({ error: `Route ${req.method} ${req.originalUrl} not found` });
});

//error handler because we use 4 paramerts, if we use 2/3 parameters its becomes a middleware and not an error handler
app.use((err, req, res, next) => {
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ error: "Invalid JSON payload" });
  }

  console.error(err);
  res.status(500).json({ error: "Internal Server Error" });
});

const PORT = process.env.PORT || 3000;

async function start() {
  try {
    await sequelize.authenticate();
    await Task.sync();
    console.log("Connected to PostgreSQL");
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (err) {
    console.error("PostgreSQL connection error:", err.message);
    // بطلع بسبب الخطأ
    process.exit(1);
  }
}

start();
