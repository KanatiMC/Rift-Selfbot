const config = require(`../data/config`);
const axios = require("axios");
const fs = require("fs");

module.exports = {
  name: "messageCreate",
  tier: null,
  async execute(client, message) {
    let prefix = "";

    if (client.configCache.customPrefix)
      prefix = client.configCache.customPrefix;
    else prefix = config.prefix;

    if (message.author.bot || message.author.id !== client.user.id) return;
    if (message.content.indexOf(prefix) !== 0) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/g);
    const command = args.shift().toLowerCase();
    const cmd =
      client.commands.get(command) ||
      client.commands.find(
        (cmd) => cmd.aliases && cmd.aliases.includes(command)
      );

    if (!cmd) return;

    try {
      if (cmd.disabled) {
        return message.reply(`\`WARNING\`\n-# This command is currently disabled.`);
      }

      const slowmode =
        message.channel.type !== "DM" && message.channel.rateLimitPerUser > 0;

      const logMessage = `[${new Date().toISOString()}] ${command} | ${args.join(
        " "
      )}\n`;
      fs.appendFile("data/logs/commands.txt", logMessage, (err) => {
        if (err) console.error("Error logging command usage:", err);
      });

      cmd.run(client, message, args, { slowmode });
    } catch (error) {
      console.error("ERROR: ", error);
      return message?.reply(
        `\`ERROR\`\n-# An error occurred while trying to execute: \`${prefix}${command}\``
      );
    }
  },
};
