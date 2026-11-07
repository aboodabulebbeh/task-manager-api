const jwt = require("jsonwebtoken");
const { User } = require("../models");

// how are you
const authenticate = async (req, res, next) => {
  const [schema, token] = (req.headers.authorization ?? "").split(" ");
  if (schema !== "Bearer" || !token) {
    return res.status(401).json({ error: "Authorization required" });
  }

  let payload;
  try {
    // jwt.verify will throw an error if the token is invalid or expired, calculate the payload from the token using the secret key and the HS256 algorithm
    payload = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ["HS256"],
    });
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }

  // payload from the token
  const user = await User.findByPk(payload.sub);
  if (!user) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }

  req.user = user;
  next();
};

// ...roles its rest parameter, it can take any number of arguments and store them in an array called roles
//your privilege
const authorize =
  (...roles) =>
  (req, res, next) => {
    if (!roles.includes(req.user.roles)) {
      return res
        .status(403)
        .json({ error: "Forbidden: insufficient permissions" });
    }
    next();
  };

module.exports = { authenticate, authorize };
