const fs = require("fs");
const path = require("path");

if (!fs.existsSync("data/errors")) {
  fs.mkdirSync("data/errors");
}

function logErrorToFile(filePath, errorMessage) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${errorMessage}\n`;
  fs.appendFileSync(filePath, logMessage, "utf8");
}

module.exports = (client) => {
  const errorLogPath = "data/errors/errors.log";
  const unhandledRejectionLogPath = "data/errors/unhandledRejections.log";
  const uncaughtExceptionLogPath = "data/errors/uncaughtExceptions.log";

  client.on("error", (error) => {
    console.error("[Client Error]", error.message);
    logErrorToFile(errorLogPath, `[Client Error] ${error.stack || error.message}`);
  });

  client.on("warn", (warning) => {
    console.warn("[Client Warning]", warning);
    logErrorToFile(errorLogPath, `[Client Warning] ${warning}`);
  });

  client.on("shardError", (error, shardId) => {
    console.error(`[Shard Error - Shard ${shardId}]`, error.message);
    logErrorToFile(errorLogPath, `[Shard Error - Shard ${shardId}] ${error.stack || error.message}`);
  });

  client.on("rateLimit", (rateLimitInfo) => {
    console.warn("[Rate Limit Warning]", rateLimitInfo);
    logErrorToFile(errorLogPath, `[Rate Limit Warning] ${JSON.stringify(rateLimitInfo)}`);
  });

  process.on("unhandledRejection", (reason, promise) => {
    console.error("[Unhandled Rejection]", reason);
    logErrorToFile(unhandledRejectionLogPath, `[Unhandled Rejection] ${reason.stack || reason}`);
  });

  process.on("uncaughtException", (error) => {
    console.error("[Uncaught Exception]", error.message);
    logErrorToFile(uncaughtExceptionLogPath, `[Uncaught Exception] ${error.stack || error.message}`);
  });

  process.on("uncaughtExceptionMonitor", (error) => {
    console.error("[Uncaught Exception (Monitor)]", error.message);
    logErrorToFile(uncaughtExceptionLogPath, `[Uncaught Exception (Monitor)] ${error.stack || error.message}`);
  });

  process.on("warning", (warning) => {
    console.warn("[Process Warning]", warning);
    logErrorToFile(errorLogPath, `[Process Warning] ${warning.stack || warning}`);
  });

  console.log("   [+] Error handlers loaded");
};
