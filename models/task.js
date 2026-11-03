const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const Task = sequelize.define(
  "Task",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    title: { type: DataTypes.TEXT, allowNull: false },
    description: { type: DataTypes.TEXT, defaultValue: "" },
    completed: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  },
  {
    tableName: "tasks",
    underscored: true, // عشان يحول الاسماء من camelCase ل snake_case
    updatedAt: false,
  },
);
module.exports = Task;
