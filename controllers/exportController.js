const path = require("path");
const fs = require("fs");
const exportQueue = require("../queues/exportQueue");

const EXPORT_DIR = path.join(__dirname, "..", "exports");

// جيب المهمة وتأكد إنها للمستخدم نفسه
const getOwnJob = async (req) => {
  const job = await exportQueue.getJob(req.params.jobId);
  if (!job || job.data.userId !== req.user.id) return null;
  return job;
};

const startExport = async (req, res) => {
  const { completed } = req.query;
  if (
    completed !== undefined &&
    completed !== "true" &&
    completed !== "false"
  ) {
    return res
      .status(400)
      .json({ error: "Completed query parameter must be 'true' or 'false'" });
  }

  const job = await exportQueue.add("export-tasks", {
    userId: req.user.id,
    isAdmin: req.user.roles === "admin",
    completed: completed === undefined ? null : completed === "true",
  });

  res.status(202).json({
    jobId: job.id,
    statusUrl: `/tasks/export/${job.id}`,
  });
};

const exportStatus = async (req, res) => {
  const job = await getOwnJob(req);
  if (!job) return res.status(404).json({ error: "Job not found" });

  const status = await job.getState(); // waiting | active | completed | failed
  const body = { jobId: job.id, status, progress: job.progress };

  if (status === "completed") {
    body.downloadUrl = `/tasks/export/${job.id}/download`;
  }
  if (status === "failed") {
    body.error = job.failedReason;
  }
  res.json(body);
};

const downloadExport = async (req, res) => {
  const job = await getOwnJob(req);
  if (!job) return res.status(404).json({ error: "Job not found" });

  if ((await job.getState()) !== "completed") {
    return res.status(409).json({ error: "Export is not ready yet" });
  }

  const filePath = path.join(EXPORT_DIR, `${job.id}.csv`);
  if (!fs.existsSync(filePath)) {
    return res.status(410).json({ error: "File expired" });
  }
  res.download(filePath, "tasks.csv");
};

module.exports = { startExport, exportStatus, downloadExport };
