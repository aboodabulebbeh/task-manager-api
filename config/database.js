const { Sequelize } = require("sequelize");
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: "postgres", // database type
  logging: false, // عشان ما يطلعلي كل استعلامات ال database بال console
});
module.exports = sequelize;
