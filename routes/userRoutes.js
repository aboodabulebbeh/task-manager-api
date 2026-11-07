const express = require("express");
const { authenticate, authorize } = require("../middleware/auth");
const validateId = require("../middleware/validateId");
const { listUsers, listUserTask } = require("../controllers/userController");

const router = express.Router();

//router.post("/users", createUser);
router.get("/users", authenticate, authorize("admin"), listUsers);
router.get("/users/:id/tasks", authenticate, validateId("User"), listUserTask);

module.exports = router;
