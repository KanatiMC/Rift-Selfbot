const { Client, Message } = require("discord.js-selfbot-v13");
const AutoReply = require("../../models/AutoReplies");

module.exports = {
  name: "autoreply",
  description: "user auto replying",
  aliases: ["ar", "auto"],
  syntax: "<start/stop> <user> <content>",
  /**
   *
   * @param {Client} client
   * @param {Message} message
   */
  run: async (client, message, args) => {
    if (args.length < 2) {
      return message?.reply(
        "`WARNING`\n-# No arguments provided! Use: `autoreply <start/stop> <user> [message]`"
      );
    }

    const autoReplyCache = client.autoReplyCache;

    const action = args[0].toLowerCase();
    let mentionedUser = message.mentions.users.first();
    let userIdentifier = args[1];

    if (mentionedUser) {
      userIdentifier = mentionedUser.id;
    } else if (/^\d{16,23}$/.test(userIdentifier)) {
      // Already a valid user ID
    } else {
      const userObj = client.users.cache.find(
        (user) => user.username.toLowerCase() === userIdentifier.toLowerCase()
      );
      if (userObj) {
        userIdentifier = userObj.id;
      } else {
        return message?.reply(
          `\`INFO\`\n-# Couldn't find a user \`${userIdentifier}\` in the client cache.`
        );
      }
    }

    if (userIdentifier === client.user.id)
      return message?.reply(
        `\`WARNING\`\n-# You can't start auto replies to yourself.`
      );

    if (action === "start") {
      const replyMessage = args.slice(2).join(" ");
      if (!replyMessage) {
        return message?.reply(
          "`WARNING`\n-# You must provide a message to auto-reply with."
        );
      }

      try {
        const existingAutoReply = await AutoReply.findOne({
          userId: userIdentifier,
        });

        if (existingAutoReply) {
          existingAutoReply.content = replyMessage;
          await existingAutoReply.save();

          autoReplyCache.set(userIdentifier, {
            content: replyMessage,
            mimic: existingAutoReply.mimic
          });

          message?.reply(
            `\`SUCCESS\`\n-# Updated auto-reply for user: **${userIdentifier}**.`
          );
        } else {
          const newAutoReply = new AutoReply({
            userId: userIdentifier,
            content: replyMessage,
          });
          await newAutoReply.save();

          // Save to the cache
          autoReplyCache.set(userIdentifier, {
            content: replyMessage
          });

          message?.reply(
            `\`SUCCESS\`\n-# Auto-reply started for user: **${userIdentifier}**.`
          );
        }
      } catch (err) {
        console.error("Error starting auto-reply:", err);
        message?.reply(
          "`ERROR`\n-# An error occurred while starting auto-reply."
        );
      }
    } else if (action === "stop") {
      try {
        const deletedReply = await AutoReply.findOneAndDelete({
          userId: userIdentifier,
        });

        if (deletedReply) {
          autoReplyCache.delete(userIdentifier);

          message?.reply(
            `\`SUCCESS\`\n-# Stopped auto-reply for user: **${userIdentifier}**.`
          );
        } else {
          message?.reply("`INFO`\n-# No auto-reply found for this user.");
        }
      } catch (err) {
        console.error("Error stopping auto-reply:", err);
        message?.reply(
          "`ERROR`\n-# An error occurred while stopping the auto-reply."
        );
      }
    } else {
      message?.reply("`WARNING`\n-# Invalid action! Use: `start` or `stop`");
    }
  },
};
