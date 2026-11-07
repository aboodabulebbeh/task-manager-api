const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const User = sequelize.define(
  "User",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.TEXT, allowNull: false },
    email: { type: DataTypes.TEXT, allowNull: false, unique: true },
    passwordHash: { type: DataTypes.TEXT, allowNull: false },
    roles: {
      type: DataTypes.ENUM("user", "admin"), // role can be either "user" or "admin"
      allowNull: false, // role is required
      defaultValue: "user", // default role is "user"
    },
  },
  {
    tableName: "users",
    underscored: true, // عشان يحول الاسماء من camelCase ل snake_case
    updatedAt: false,
    // defaultScope is used to define the default behavior of the model when querying data. In this case, we are excluding the passwordHash attribute from the results by default. This is a security measure to prevent exposing sensitive information.
    defaultScope: { attributes: { exclude: ["passwordHash"] } }, // exclude passwordHash by default
  },
);

module.exports = User;
