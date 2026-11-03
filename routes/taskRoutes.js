const express = require("express");
const validateId = require("../middleware/validateId");
const {
  createTask,
  listTasks,
  getTaskById,
  updateTask,
  deleteTask,
} = require("../controllers/taskController");

const router = express.Router();

router.post("/", createTask);
router.get("/", listTasks);
router.get("/:id", validateId, getTaskById);
router.patch("/:id", validateId, updateTask);
router.delete("/:id", validateId, deleteTask);

module.exports = router;
