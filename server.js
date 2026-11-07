// بحطو عشان يقرأ ملف .env
require("dotenv").config();

const app = require("./app");
const sequelize = require("./config/database");
require("./models"); // عشان يقرأ كل الموديلات ويعمل associations بينهم

if (!process.env.JWT_SECRET || !process.env.DATABASE_URL) {
  console.error("Missing JWT_SECRET or DATABASE_URL in environment");
  process.exit(1);
}
const PORT = process.env.PORT || 3000;

async function start() {
  try {
    await sequelize.authenticate();
    await sequelize.sync({ alter: true });
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
