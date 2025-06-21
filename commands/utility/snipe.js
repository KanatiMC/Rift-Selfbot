const { Client, Message } = require("discord.js-selfbot-v13");

module.exports = {
  name: "snipe",
  description: "snipe deleted content",
  aliases: ["s"],
  /**
   *
   * @param {Client} client
   * @param {Message} message
   */

  run: async (client, message, args) => {
    const msg = client.snipes.get(`del_${message.channel.id}`);
    if (!msg)
      return message?.reply(
        `\`WARNING\`\n-# Couldn\'t find any deleted messages in this channel.`
      );

    message?.reply(
      `\`SNIPE\`\n-# Channel: <#${message.channel.id}>\n-# Author: \`${
        msg.author.username
      }\`\n-# Content: ${
        msg.content ? `\`${msg.content}\`` : "*none*"
      }\n-# Image: ${msg.image ? `[link](<${msg.image}>)` : "*none*"}`
    );
  },
};
