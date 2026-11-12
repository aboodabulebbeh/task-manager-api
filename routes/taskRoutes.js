const express = require("express");
const validateId = require("../middleware/validateId");
const {
  createTask,
  listTasks,
  getTaskById,
  updateTask,
  deleteTask,
  exportTasks,
} = require("../controllers/taskController");

const {
  startExport,
  exportStatus,
  downloadExport,
} = require("../controllers/exportController");

const { authenticate } = require("../middleware/auth");

const router = express.Router();

router.use("/tasks", authenticate); // Apply authentication middleware to all task routes

router.post("/tasks", createTask);
router.get("/tasks", listTasks);
router.get("/tasks/export", exportTasks);
router.post("/tasks/export", startExport);
router.get("/tasks/export/:jobId", exportStatus);
router.get("/tasks/export/:jobId/download", downloadExport);
router.get("/tasks/:id", validateId("Task"), getTaskById);
router.patch("/tasks/:id", validateId("Task"), updateTask);
router.delete("/tasks/:id", validateId("Task"), deleteTask);

module.exports = router;
