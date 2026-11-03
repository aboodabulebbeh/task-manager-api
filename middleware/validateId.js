const validateId = (req, res, next) => {
  const { id } = req.params;
  if (!/^\d+$/.test(id) || Number(id) < 1 || Number(id) > 2147483647) {
    return res.status(404).json({ error: "Task not found" });
  }
  next();
};

module.exports = validateId;
