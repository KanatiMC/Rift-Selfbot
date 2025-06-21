const { Client, Message } = require("discord.js-selfbot-v13");
const AutoReactions = require("../../models/AutoReactions");

module.exports = {
  name: "userinfo",
  description: "user info command",
  aliases: ["user", "uinfo"],
  syntax: "<mention/username/userId>",
  /**
   *
   * @param {Client} client
   * @param {Message} message
   */

  run: async (client, message, args) => {
    if (args.length === 0) {
      return message?.reply(
        "`WARNING`\n-# Specify a user (mention, ID, or username) and at least one reaction to add."
      );
    }

    const mentionedUser = message.mentions.users.first();
    let userIdentifier = args[0];

    if (mentionedUser) {
      userIdentifier = mentionedUser.id;
      args.shift();
    } else if (/^\d{16,23}$/.test(userIdentifier)) {
      args.shift();
    } else {
      const userObj = client.users.cache.find(
        (user) => user.username === userIdentifier
      );

      if (userObj) {
        userIdentifier = userObj.id;
        args.shift();
      } else {
        return message?.reply(
          `\`WARNING\`\n-# Couldn\'t find a user \`${userIdentifier}\` in the client cache.`
        );
      }
    }

    if (userIdentifier) {
      const user = client.users.cache.get(userIdentifier);
      if (user.bot)
        return message?.reply(
          `\`WARNING\`\n-# This command can\'t be used on bots/applications!`
        );

      user
        .fetch()
        .then(async () => {
          let channel = message.channel;
          let ms = client.guilds.cache.filter((guild) =>
            guild.members.cache.has(user.id)
          );
          let premiumSince = user.premiumSince
            ? new Date(user.premiumSince).toString()
            : "*null*";
          let premiumType = user.premiumType
            ? `${
                user.premiumType === 0
                  ? "**No Nitro**"
                  : user.premiumType === 1
                  ? "**Nitro Classic**"
                  : user.premiumType === 2
                  ? "**Nitro (Boost)**"
                  : user.premiumType === 3
                  ? "**Nitro Basic**"
                  : "*none*"
              }`
            : "*null*";
          let bio = `${user.bio ? `${user.bio}` : "*null*"}`;
          let HexAccentColor = `${
            user.hexAccentColor ? `**${user.hexAccentColor}**` : "*null*"
          }`;
          let HexThemeColor = `${
            user.hexThemeColor ? `**${user.hexThemeColor}**` : "*null*"
          }`;
          let mutualServers = `${ms
            .map((guild) => `\`${guild.name}\``)
            .join(`**, **`)}`;
          let banner = user.bannerURL
            ? `${
                user.bannerURL()
                  ? `[link](<${user.bannerURL({
                      dynamic: true,
                    })}?size=1024&quot>)`
                  : "*null*"
              }`
            : "*null*";
          let pfp = user.displayAvatarURL
            ? `[link](<${user.displayAvatarURL({ dynamic: true })}>)`
            : "*null*";
          channel.messages.fetch({
            limit: 100,
          });

          message?.reply(`\`BASIC\`
-# UID: **${user.id}**
-# Display: ${user.displayName ? `**${user.displayName}**` : "*null*"}
-# Username: **${user.username}**
-# PFP: ${pfp}
-# Banner: ${banner}
-# Bio: ${bio}
-# Accent Hex: ${HexAccentColor}
-# Theme Hex: ${HexThemeColor}
\`EXTRA\`
-# Servers: ${client.user.id === user.id ? "*self-info safety*" : mutualServers}

-# ***Fetched info for \`${userIdentifier}\`***`);
        })
        .catch(console.error);
    }
  },
};
