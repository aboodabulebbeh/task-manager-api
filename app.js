const express = require("express");
const taskRoutes = require("./routes/taskRoutes");
const userRoutes = require("./routes/userRoutes");

const app = express();

// Middleware to parse JSON request bodies
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/", taskRoutes);
app.use("/", userRoutes);

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

module.exports = app;
