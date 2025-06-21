const { Client, Message } = require("discord.js-selfbot-v13");

const client = new Client();
client.editsnipes = new Map();

module.exports = {
  name: "messageUpdate",
  tier: 'basic',
  /**
   * 
   * @param {Message} oldMessage 
   * @param {Message} newMessage 
   */
  async execute(client, oldMessage, newMessage) {
    if (client && client.editsnipes) {
      client.editsnipes.set(`edit_${newMessage.channel.id}`, {
        oldContent: oldMessage.content,
        newContent: newMessage.content,
        author: oldMessage.author,
        image: oldMessage.attachments.first()?.proxyURL || null,
      });
    }
  },
};
