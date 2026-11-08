const Redies = require("ioredis");

const redies = new Redies(process.env.REDIS_URL || "redis://localhost:6379", {...});