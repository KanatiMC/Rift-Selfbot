const { Client, Message } = require("discord.js-selfbot-v13");

module.exports = {
  name: "autodelete",
  description: "auto deleter",
  aliases: ["adel", "ad"],
  syntax: "<start|end|list> <user>",
  /**
   * @param {Client} client
   * @param {Message} message
   * @param {string[]} args
   */
  run: async (client, message, args) => {
    if (!client.autoDelete) client.autoDelete = [];

    const action = args[0]?.toLowerCase();
    let userIdentifier = args[1] || null;

    if (!action || !["start", "end", "list"].includes(action)) {
      return message.reply("`WARNING`\n-# Please specify a valid action: `start`, `end`, or `list`.");
    }

    if (action === "list") {
      if (client.autoDelete.length === 0) {
        return message.reply("`WARNING`\n-# The autopurge list is currently empty.");
      }
      return message.reply(
        `\`AUTO DELETER\`\n${client.autoDelete
          .map((id) => `<@${id}> (${id})`)
          .join("\n")}`
      );
    }

    const mentionedUser = message.mentions.users.first();
    if (mentionedUser) {
      userIdentifier = mentionedUser.id;
    } else if (/^\d{16,23}$/.test(userIdentifier)) {
      // Valid user ID
    } else {
      const userObj = client.users.cache.find(
        (user) => user.username.toLowerCase() === userIdentifier?.toLowerCase()
      );
      if (userObj) {
        userIdentifier = userObj.id;
      } else {
        return message.reply(
          "`WARNING`\n-# Could not find a user `" +
            userIdentifier +
            "` in the client cache."
        );
      }
    }

    if (!userIdentifier) {
      return message.reply("`WARNING`\n-# Please specify a valid user by mention, username, or user ID.");
    }

    if (action === "start") {
      if (client.autoDelete.includes(userIdentifier)) {
        return message.reply("`WARNING`\n-# This user is already in the autopurge list.");
      }
      client.autoDelete.push(userIdentifier);
      return message.reply(`\`SUCCESS\`\n-# Added <@${userIdentifier}> (${userIdentifier}) to the autopurge list.`);
    }

    if (action === "end") {
      const index = client.autoDelete.indexOf(userIdentifier);
      if (index === -1) {
        return message.reply("`WARNING`\n-# This user is not in the autopurge list.");
      }
      client.autoDelete.splice(index, 1);
      return message.reply(`\`SUCCESS\`\n-# Removed <@${userIdentifier}> (${userIdentifier}) from the autopurge list.`);
    }
  },
};
