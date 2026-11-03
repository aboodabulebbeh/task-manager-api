const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const User = sequelize.define(
  "User",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.TEXT, allowNull: false },
    email: { type: DataTypes.TEXT, allowNull: false, unique: true },
  },
  {
    tableName: "users",
    underscored: true, // عشان يحول الاسماء من camelCase ل snake_case
    updatedAt: false,
  },
);

module.exports = User;
