require("dotenv").config();

const { Worker } = require("bullmq");
const fs = require("fs");
const path = require("path");
const { once } = require("events");
const { Op } = require("sequelize");
const { Task, User } = require("./models");
const connection = require("./config/queueConnection");
const { csvEscape } = require("./utils/csv");

const EXPORT_DIR = path.join(__dirname, "exports");
fs.mkdirSync(EXPORT_DIR, { recursive: true });

const userInclude = { model: User, as: "user", attributes: ["id", "name"] };
const BATCH = 2000;

const worker = new Worker(
  "export",
  async (job) => {
    const { userId, isAdmin, completed } = job.data;

    const where = isAdmin ? {} : { userId };
    if (completed !== null) where.completed = completed;

    const total = await Task.count({ where });
    const filePath = path.join(EXPORT_DIR, `${job.id}.csv`);
    const stream = fs.createWriteStream(filePath);

    try {
      const header = [
        "id",
        "title",
        "description",
        "completed",
        "created_at",
        "user_id",
        "user_name",
      ];
      stream.write("\uFEFF" + header.map(csvEscape).join(",") + "\r\n");

      let lastId = 0;
      let done = 0;

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

        if (!stream.write(chunk + "\r\n")) await once(stream, "drain");

        lastId = tasks[tasks.length - 1].id;
        done += tasks.length;
        await job.updateProgress(
          total ? Math.round((done / total) * 100) : 100,
        );

        if (tasks.length < BATCH) break;
      }

      stream.end();
      await once(stream, "finish");
      return { file: `${job.id}.csv`, rows: done };
    } catch (err) {
      stream.destroy();
      fs.unlink(filePath, () => {});
      throw err; // BullMQ بيعلّم المهمة failed
    }
  },
  { connection, concurrency: 2 },
);

worker.on("completed", (job) => console.log(`Export ${job.id} done`));
worker.on("failed", (job, err) =>
  console.error(`Export ${job?.id} failed:`, err.message),
);

console.log("Export worker started");
