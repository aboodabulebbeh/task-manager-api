// بحطو عشان يقرأ ملف .env
require("dotenv").config();

const app = require("./app");
const sequelize = require("./config/database");
const Task = require("./models/task");

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
