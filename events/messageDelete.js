module.exports = {
  name: "messageDelete",
  tier: "basic",
  async execute(client, message) {
    if (!client || (client && !client.snipes)) return;
    client.snipes.set(`del_${message.channel.id}`, {
      content: message.content,
      author: message.author,
      image: message.attachments ? message.attachments.first()?.proxyURL : null,
    });
  },
};
