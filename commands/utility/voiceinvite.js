const { Client, Message } = require("discord.js-selfbot-v13");

module.exports = {
  name: "voiceinvite",
  description: "current voice chat info",
  aliases: ["vinv"],
  /**
   *
   * @param {Client} client
   * @param {Message} message
   */

  run: async (client, message, args) => {
    const author = message.author;

    let foundChannel = false;
    let inviteLink = "";
    let vcName = "";
    let vcId = "";
    let serverName = "";

    for (const guild of client.guilds.cache.values()) {
      const messageAuthor = guild.members.cache.get(author.id);
      if (messageAuthor && messageAuthor.voice.channel) {
        foundChannel = true;
        const voiceChannel = messageAuthor.voice.channel;

        vcName = voiceChannel.name;
        vcId = voiceChannel.id;
        serverName = client.guilds.cache.get(voiceChannel.guildId).name;

        try {
          inviteLink = await voiceChannel.createInvite({
            maxAge: 60 * 60,
          });
          break;
        } catch (error) {
          console.error(`Could not create invite for the voice channel.`);
          return message?.reply(
            `\`WARNING\`\nCouldn\'t create an invite for the voice channel.`
          );
        }
      }
    }

    if (foundChannel && inviteLink) {
      if (message.channel.type === "DM" || message.channel.type === "GROUP_DM")
        return message?.reply(
          `\`CURRENT VC\`\n-# Server: \`${serverName}\`\n-# Channel: \`${vcName}\`\n-# **[Join VC](<${inviteLink}>)**`
        );
      else {
        let linkPerms = false;
        const currentChannel = message.channel;
        if (await currentChannel.permissionsFor(client.user).has("EMBED_LINKS"))
          linkPerms = true;

        return message?.reply(
          `\`CURRENT VC\`\n-# Server: \`${serverName}\`\n-# Channel: \`${vcName}\`\n-# <#${vcId}>`
        );
      }
    } else {
      return message?.reply(
        `\`WARNING\`\n-# You\'re currently not in a voice channel.`
      );
    }
  },
};
