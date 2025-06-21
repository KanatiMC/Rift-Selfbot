const { Client, Message } = require("discord.js-selfbot-v13");

module.exports = {
  name: "musicstatus",
  description: "music rpc trigger",
  aliases: ["ms", "mrpc"],
  /**
   *
   * @param {Client} client
   * @param {Message} message
   */

  run: async (client, message, args) => {
    if (!client.privateMusic) client.privateMusic = true;
    else client.privateMusic = false;
    let msg = client.privateMusic ? "\`SUCCESS\`\n-# Music RPC has been disabled." : "\`SUCCESS\`\n-# Music RPC has been enabled.";
    message?.reply(msg);
  },
};
