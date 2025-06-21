let lastMessage = "";

module.exports = {
  name: "messageCreate",
  tier: 'plus',
  async execute(client, message) {
    if (message.author.bot) return;

    const cachedAutoReply = client.autoReplyCache.get(message.author.id);

    const mimic = client.mimicCache.get(message.author.id);

    if (mimic) {
      if (message.content && message.content.trim().length > 0) {
        if (message.content === lastMessage || message.content.startsWith('`')) return;
        lastMessage = message?.content;
        message?.channel.send(message.content);
      }
    }

    if (cachedAutoReply && cachedAutoReply.content) {
      message?.reply(cachedAutoReply.content);
    }
  },
};
