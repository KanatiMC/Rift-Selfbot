module.exports = {
  name: "messageCreate",
  tier: "plus",
  async execute(client, message) {
    if (!client.autoDelete) client.autoDelete = [];

    if (client.autoDelete.includes(message.author.id)) {
      try {
        if (!message.deletable) return;
        await message.delete();
      } catch (error) {
        return;
      }
    }
  },
};
