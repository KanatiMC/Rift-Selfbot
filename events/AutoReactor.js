module.exports = {
  name: "messageCreate",
  tier: 'plus',
  async execute(client, message) {
    if (client.reactionsPaused) return;

    const userReactionsPaused = client.userReactionsPaused || {};
    const userID = message.author.id;

    if (userReactionsPaused[userID]) return;

    const reactionCache = client.reactionCache;
    if (!reactionCache) return;

    const user = reactionCache.users.find((record) => record.user === userID);
    if (!user) return;

    const reactions = user.reactions || [];
    if (reactions.length === 0) return;

    const multiReactEnabled = user.multiReact;

    const allClients = multiReactEnabled
      ? [client, ...(client.altClients || [])].filter((c) => c && c.user)
      : [client];

    for (const reaction of reactions) {
      try {
        const mainReactionSuccessful = await tryReact(client, message, reaction);

        if (mainReactionSuccessful) {
          const altClients = allClients.slice(1);
          const reactionPromises = altClients.map((altClient) =>
            tryReact(altClient, message, reaction)
          );
          await Promise.all(reactionPromises);
        }
      } catch (err) {
        console.error("Error reacting to message:", err);
      }
    }
  },
};

async function tryReact(client, message, emoji) {
  try {
    const channel = client.channels.cache.get(message.channel.id);
    if (!channel) {
      return false;
    }

    const msg = await channel.messages.fetch(message.id);
    await msg.react(emoji);
    return true;
  } catch (err) {
    return false;
  }
}
