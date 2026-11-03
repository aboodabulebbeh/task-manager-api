const express = require("express");
const validateId = require("../middleware/validateId");
const {
  createTask,
  listTasks,
  getTaskById,
  updateTask,
  deleteTask,
  listUserTask,
} = require("../controllers/taskController");

const router = express.Router();

router.post("/tasks", createTask);
router.get("/tasks", listTasks);
router.get("/users/:id/tasks", validateId("User"), listUserTask);
router.get("/tasks/:id", validateId("Task"), getTaskById);
router.patch("/tasks/:id", validateId("Task"), updateTask);
router.delete("/tasks/:id", validateId("Task"), deleteTask);

module.exports = router;
