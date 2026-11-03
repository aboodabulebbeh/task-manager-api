const User = require("./user");
const Task = require("./task");

User.hasMany(Task, {
  foreignKey: { name: "userId", allowNull: false },
  onDelete: "CASCADE",
});
Task.belongsTo(User, {
  foreignKey: { name: "userId", allowNull: false },
  as: "user",
});
module.exports = { User, Task };
