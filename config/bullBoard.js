const { createBullBoard } = require("@bull-board/api");
const { BullMQAdapter } = require("@bull-board/api/bullMQAdapter");
const { ExpressAdapter } = require("@bull-board/express");
const exportQueue = require("../queues/exportQueue");

const BASE_PATH = "/admin/queues";

const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath(BASE_PATH);

createBullBoard({
  queues: [new BullMQAdapter(exportQueue)],
  serverAdapter,
});

const basicAuth = (req, res, next) => {
  const { BULL_BOARD_USER, BULL_BOARD_PASSWORD } = process.env;
  if (!BULL_BOARD_USER || !BULL_BOARD_PASSWORD) {
    return res.status(503).json({ error: "Queue dashboard is not configured" });
  }
  const [scheme, encoded] = (req.headers.authorization ?? "").split(" ");
  const [user, ...rest] =
    scheme === "Basic" && encoded
      ? Buffer.from(encoded, "base64").toString().split(":")
      : [];
  if (user === BULL_BOARD_USER && rest.join(":") === BULL_BOARD_PASSWORD) {
    return next();
  }
  res.set("WWW-Authenticate", 'Basic realm="Queues"');
  res.status(401).send("Authentication required");
};

module.exports = { BASE_PATH, basicAuth, router: serverAdapter.getRouter() };
