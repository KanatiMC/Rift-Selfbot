const { Client, Message } = require("discord.js-selfbot-v13");
const fs = require("fs");
const path = require("path");

module.exports = {
  name: "help",
  description: "advanced help command",
  aliases: ["cmds", "h"],
  syntax: "[command/category]",
  /**
   * @param {Client} client
   * @param {Message} message
   */
  run: async (client, message, args) => {
    let customPrefix = client.configCache?.customPrefix || "";

    const padString = (str, len) =>
      str + " ".repeat(Math.max(0, len - str.length));

    if (args[0]) {
      const cmdName = args[0];
      const cmd =
        client.commands.get(cmdName.toLowerCase()) ||
        client.commands.find(
          (cmd) => cmd.aliases && cmd.aliases.includes(cmdName.toLowerCase())
        );

      if (cmd) {
        let replyMsg = `### \`\`\`[RIFT] | ${
          cmd.category ? `${cmd.category}`.toUpperCase() : "???"
        } COMMANDS\`\`\`\n\`\`\`ini\n`;
        const cmdDisplayName = cmd.name
          ? `${customPrefix}${cmd.name}`
          : "No Name";
        const description = cmd.description
          ? cmd.description
          : "No description provided";
        const aliases = cmd.aliases ? `Aliases` : "";
        const usage = cmd.syntax ? `Usage` : "";

        const longestCell = Math.max(
          cmdDisplayName.length,
          aliases.length,
          usage.length
        );

        replyMsg += `[+] ${padString(
          cmdDisplayName,
          longestCell + 2
        )} | ${description}\n`;

        // if (cmd.tier) {
        //   replyMsg += `[+] ${padString("Tier", longestCell + 2)} | \`${
        //     cmd.tier
        //   }\`\n`;
        // }

        if (cmd.aliases && cmd.aliases.length > 0) {
          replyMsg += `[+] ${padString(
            "Aliases",
            longestCell + 2
          )} | ${cmd.aliases.map((alias) => `\`${alias}\``).join(", ")}\n`;
        }

        if (cmd.syntax) {
          replyMsg += `[+] ${padString(
            "Usage",
            longestCell + 2
          )} | \`${customPrefix}${cmdName} ${cmd.syntax}\`\n`;
        }

        return message?.reply(
          `${replyMsg}\`\`\``
        );
      } else {
        const category = args[0].toLowerCase();
        const commandsInCategory = client.commands.filter(
          (cmd) =>
            typeof cmd.category === "string" &&
            cmd.category.toLowerCase() === category
        );

        if (commandsInCategory.size === 0) {
          return message.channel.send(
            `\`WARNING\`\n-# ${category.toUpperCase()} is not a valid category or command name.`
          );
        }

        let replyMsg = `### \`\`\`[RIFT] | ${category.toUpperCase()} COMMANDS\`\`\`\n\`\`\`ini\n`;

        const longestName =
          Math.max(...commandsInCategory.map((cmd) => cmd.name.length)) +
          customPrefix.length;

        commandsInCategory.forEach((cmd) => {
          const cmdDisplayName = `${customPrefix}${cmd.name}`;
          const description = cmd.description
            ? cmd.description
            : "No description provided";

          replyMsg += `[+] ${padString(
            cmdDisplayName,
            longestName + 2
          )} | ${description}\n`;
        });

        return message?.reply(
          `${replyMsg}\`\`\``
        );
      }
    } else {
      let replyMsg = `### \`\`\`[RIFT] | CATEGORIES\`\`\`\n\`\`\`ini\n`;

      const categoryMap = new Map();
      
      client.commands.forEach((cmd) => {
        const category = cmd.category || "UNKNOWN";
        categoryMap.set(category, (categoryMap.get(category) || 0) + 1);
      });
      
      categoryMap.forEach((count, category) => {
        replyMsg += `[+] ${padString(category.toUpperCase(), 10)} | ${count} commands\n`;
      });
      
      return message?.reply(
        `${replyMsg}\`\`\``
      );
          
    }
  },
};
