const { Client, Message } = require("discord.js-selfbot-v13");
const Status = require("../../models/Config");

module.exports = {
  name: "afk",
  description: "afk system",
  aliases: ["dnd"],
  syntax: "[true] [status]",
  /**
   *
   * @param {Client} client
   * @param {Message} message
   */

  run: async (client, message, args) => {
    const inputReason = args.join(" ");
    let customPrefix = client.configCache.customPrefix || "";

    if (inputReason.toLowerCase() === "off") {
      if (!client.configCache.afkStatus)
        return message?.reply(
          `\`WARNING\`\n-# You\'re not AFK.\n-# Use \"${customPrefix}afk [status]\" to set your AFK.`
        );
      client.configCache.afkEnabled == false;
      client.configCache.afkStatus = null;
      client.configCache.afkStartTime = null;

      if (client.privateMusic && client.privateByAfk) {
        client.privateMusic = false;
        client.privateByAfk = false;
      }

      await saveAfkStatusToDB(
        client.configCache.afkEnabled,
        client.configCache.afkStatus,
        client.configCache.afkStartTime
      );
      message?.reply(
        `AFK disabled.${
          client.privateMusic && client.privateByAfk
            ? "\n-# private music disabled"
            : ""
        }`
      );
    } else {
      let varCheck = args[0]?.toLowerCase();
      if (varCheck === "true" || varCheck === "prv") {
        client.privateMusic = true;
        client.privateByAfk = true;
        args.shift();
      }

      if (args.join().length > 30)
        return message?.reply(
          `\`WARNING\`\n-# AFK status can\'t be longer than \`30 characters\``
        );
      client.configCache.afkEnabled = true;
      client.configCache.afkStatus = args.length > 0 ? args.join(" ") : "AFK";
      client.configCache.afkStartTime = Date.now();

      await saveAfkStatusToDB(
        client.configCache.afkEnabled,
        client.configCache.afkStatus,
        client.configCache.afkStartTime
      );
      message?.reply(
        `AFK: \`${client.configCache.afkStatus}\`.${
          client.privateMusic && client.privateByAfk
            ? "\n-# private music enabled"
            : ""
        }`
      );
    }
  },
};

function formatDuration(duration) {
  const seconds = Math.floor((duration / 1000) % 60);
  const minutes = Math.floor((duration / (1000 * 60)) % 60);
  const hours = Math.floor((duration / (1000 * 60 * 60)) % 24);
  const days = Math.floor(duration / (1000 * 60 * 60 * 24));

  return `${days > 0 ? `${days}d ` : ""}${hours > 0 ? `${hours}h ` : ""}${
    minutes > 0 ? `${minutes}m ` : ""
  }${seconds}s`;
}

async function saveAfkStatusToDB(afkEnabled, afkStatus, afkStartTime) {
  try {
    await Status.updateOne(
      {},
      {
        $set: {
          afkEnabled: afkEnabled,
          afkStatus: afkStatus,
          afkStartTime: afkStartTime,
        },
      },
      { upsert: true }
    );
  } catch (err) {
    console.error("Error saving AFK status to database:", err);
  }
}
