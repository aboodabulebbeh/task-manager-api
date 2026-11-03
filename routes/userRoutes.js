const express = require("express");
const { createUser, listUsers } = require("../controllers/userController");

const router = express.Router();

router.post("/users", createUser);
router.get("/users", listUsers);

module.exports = router;
