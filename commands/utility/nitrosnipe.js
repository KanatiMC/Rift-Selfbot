const { Client, Message } = require("discord.js-selfbot-v13");

module.exports = {
  name: "nitrosnipe",
  description: "trigger nitro sniper",
  aliases: ["nsnipe", "ns"],
  syntax: "<on|off>",
  /**
   *
   * @param {Client} client
   * @param {Message} message
   */
  run: async (client, message, args) => {
    if (args.length < 1) {
      return message?.reply(
        `\`USAGE\`\n-# Use: \`${
          client.configCache.customPrefix || "r;"
        }nitrosnipe <on|off>\``
      );
    }

    const action = args[0].toLowerCase();
    if (action === "on") {
      if (!client.snipeNitro) {
        client.snipeNitro = true;
        return message?.reply("`SUCCESS`\n-# Enabled nitro sniping.");
      } else {
        return message?.reply("`WARNING`\n-# Nitro sniper is already enabled.");
      }
    } else if (action === "off") {
      if (client.snipeNitro) {
        client.snipeNitro = false;
        return message?.reply("`SUCCESS`\n-# Disabled nitro sniping.");
      } else {
        return message?.reply("`WARNING`\n-# Nitro sniper is already disabled.");
      }
    } else {
      return message?.reply(
        `\`USAGE\`\n-# Use: \`${
          client.configCache.customPrefix || "r;"
        }nitrosnipe <on|off>\``
      );
    }
  },
};
