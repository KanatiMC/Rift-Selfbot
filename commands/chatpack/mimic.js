const { Client, Message } = require("discord.js-selfbot-v13");
const Mimic = require("../../models/UserMimic");

module.exports = {
  name: "mimic",
  description: "user mimicking",
  aliases: ["repeat"],
  syntax: "<start/stop> <user>",
  /**
   *
   * @param {Client} client
   * @param {Message} message
   */
  run: async (client, message, args) => {
    if (args.length < 2) {
      return message?.reply(
        "`WARNING`\n-# No arguments provided! Use: `mimic <start/stop> <mention/username/userId>`"
      );
    }
    
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
          `\`INFO\`\n-# Could not find a user \`${userIdentifier}\` in the client cache.`
        );
      }
    }

    if (action === "start") {
      try {
        const existingEntry = await Mimic.findOne({ userId: userIdentifier });

        if (existingEntry) {
          existingEntry.mimic = true;
          await existingEntry.save();
          client.mimicCache.set(userIdentifier, true);
          message?.reply(`\`SUCCESS\`\n-# Mimic started for user: **${userIdentifier}**.`);
        } else {
          const newEntry = new Mimic({
            userId: userIdentifier,
            mimic: true,
          });
          await newEntry.save();
          client.mimicCache.set(userIdentifier, true);
          message?.reply(`\`SUCCESS\`\n-# Mimic started for user: **${userIdentifier}**.`);
        }

      } catch (err) {
        console.error("Error starting mimic:", err);
        message?.reply("`ERROR`\n-# An error occurred while starting mimic.");
      }
    } else if (action === "stop") {
      try {
        const existingEntry = await Mimic.findOne({ userId: userIdentifier });

        if (existingEntry && existingEntry.mimic) {
          existingEntry.mimic = false;
          await existingEntry.save();
          client.mimicCache.delete(userIdentifier);
          message?.reply(`\`SUCCESS\`\n-# Stopped mimicking user: **${userIdentifier}**.`);
        } else {
          message?.reply("`INFO`\n-# No mimic found for this user.");
        }
      } catch (err) {
        console.error("Error stopping mimic:", err);
        message?.reply("`ERROR`\n-# An error occurred while stopping mimic.");
      }
    } else {
      message?.reply("`WARNING`\n-# Invalid action! Use: `start` or `stop`");
    }
  },
};
