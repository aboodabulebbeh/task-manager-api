const { Queue } = require("bullmq");
const connection = require("../config/queueConnection");

const exportQueue = new Queue("export", {
  connection,
  defaultJobOptions: {
    removeOnComplete: { age: 24 * 3600 }, // يمسح المهمة بعد 24 ساعة
    removeOnFail: { age: 24 * 3600 },
  },
});

module.exports = exportQueue;
