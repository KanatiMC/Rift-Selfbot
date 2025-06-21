const { Client, Message } = require("discord.js-selfbot-v13");

module.exports = {
  name: "editsnipe",
  description: "snipe edited content",
  aliases: ["es"],
  /**
   *
   * @param {Client} client
   * @param {Message} message
   */

  run: async (client, message, args) => {
    const msg = client.editsnipes.get(`edit_${message.channel.id}`);
    if (!msg)
      return message?.reply(
        `\`WARNING\`\n-# Couldn\'t find any edited messages in this channel.`
      );

    message?.reply(
      `\`EDITSNIPE\`\n-# Channel: <#${message.channel.id}>\n-# Author: \`${
        msg.author.username
      }\`\n-# Old: ${
        msg.oldContent ? `\`${msg.oldContent}\`` : "*none*"
      }\n-# New: ${
        msg.newContent ? `\`${msg.newContent}\`` : "*none*"
      }\n-# Image: ${msg.image ? `[link](<${msg.image}>)` : "*none*"}`
    );
  },
};
