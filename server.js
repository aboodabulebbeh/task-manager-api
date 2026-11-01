// بحطو عشان يقرأ ملف .env
require("dotenv").config();

// استيراد مكتبه express و pg
const express = require("express");
const {Pool} = require("pg");

const app = express();
//  بقرأ الطلب يلي موجود بال body يلي ببعتو واذا كان json بحولو ل JS
app.use(express.json());

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
})

const COLUMNS = `id, title, description, completed, created_at AS "createdAt"`;

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
    const { rows } = await pool.query(
        `INSERT INTO tasks (title, description, completed)
        VALUES ($1, $2, $3)
        RETURNING ${COLUMNS}`,
        [title.trim(), description ?? "", completed ?? false],
    );
    res.status(201).json(rows[0]);
});


app.get("/tasks", async (req, res) => {
  const { completed } = req.query;
    if (completed === undefined) {
        const { rows } = await pool.query(
            `SELECT ${COLUMNS} FROM tasks ORDER BY id`,
        );
        return res.json(rows);
  }
  if (completed !== "true" && completed !== "false") {
    return res.status(400).json({
      error: "Completed query parameter must be 'true' or 'false'.",
    });
  }

    const { rows } = await pool.query(
        `SELECT ${COLUMNS} FROM tasks WHERE completed = $1 ORDER BY id`,
        [completed === "true"],
    );
  res.json(rows);
});

app.get("/tasks/:id", validateId, async (req, res) => {

    const { rows } = await pool.query(
        `SELECT ${COLUMNS} FROM tasks WHERE id = $1`,
        [req.params.id],
    );
    if (rows.length === 0) {
        return res.status(404).json({ error: "Task not found" });
    }
    res.json(rows[0]);
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


    const { rows } = await pool.query(
        `UPDATE tasks
        SET title = COALESCE($1, title),
            description = COALESCE($2, description),
            completed = COALESCE($3, completed)
        WHERE id = $4
        RETURNING ${COLUMNS}`,
        [
            title !== undefined ? title.trim() : null,
            description ?? null,
            completed ?? null,
            req.params.id,
        ],
    );
    if (rows.length === 0) {
        return res.status(404).json({ error: "Task not found" });
    }   
    res.json(rows[0]);
});


app.delete("/tasks/:id", validateId, async (req, res) => {
    const result = await pool.query("DELETE FROM tasks WHERE id = $1 ", [
        req.params.id,
    ]);

  if (result.rowCount === 0) {
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
/*
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
*/
const PORT = process.env.PORT || 3000;

async function start() {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS tasks (
            id SERIAL PRIMARY KEY,
            title Text NOT NULL,
            description Text DEFAULT '',
            completed BOOLEAN NOT NULL DEFAULT false,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )`
        );
        console.log("Connected to PostgreSQL");
        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    }
    catch (err){
        console.error("PostgreSQL connection error:", err.message);
        // بطلع بسبب الخطأ
        process.exit(1);
    }
};

start();
