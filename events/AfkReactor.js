module.exports = {
  name: "messageCreate",
  tier: 'basic',
  async execute(client, message) {
    let statusCache = client.configCache;
    if (statusCache.afkStartTime) {
      let cooldownTime = 30;
        
      if (message.author.id === client.user.id) return;
  
      const userId = message.author.id;
      const currentTime = Date.now();
  
      if (client.cooldowns.has(userId)) {
        const cooldownEnd = client.cooldowns.get(userId);
        if (currentTime < cooldownEnd) {
          return;
        }
      }
  
      const afkDuration = formatDuration(Date.now() - statusCache.afkStartTime);
      const afkMessage = `AFK: **${statusCache.afkStatus}**\n-# AFK \`${afkDuration}\` ago!`;
  
      if (message.content.includes(`<@${client.user.id}>`)) {
        message.reply(afkMessage).catch(console.error);
        client.cooldowns.set(userId, currentTime + (cooldownTime * 1000));
      } else if (message.reference && message.reference.messageId) {
        let referenceMessage =
          message.channel.messages.cache.get(message.reference.messageId) || null;
        if (referenceMessage?.author?.id === client.user.id) {
          message.reply(afkMessage).catch(console.error);
          client.cooldowns.set(userId, currentTime + (cooldownTime * 1000));
        }
      }
    }
  },
};

function formatDuration(duration) {
  const seconds = Math.floor((duration / 1000) % 60);
  const minutes = Math.floor((duration / (1000 * 60)) % 60);
  const hours = Math.floor((duration / (1000 * 60 * 60)) % 24);
  const days = Math.floor(duration / (1000 * 60 * 60 * 24));

  return `${days > 0 ? `${days}d ` : ""}${hours > 0 ? `${hours}h ` : ""}${
    minutes > 0 ? `${minutes}m ` : ""
  }${seconds}s`;
}
