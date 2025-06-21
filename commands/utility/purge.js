const { Client, Message } = require("discord.js-selfbot-v13");
const AutoReactions = require("../../models/AutoReactions");

module.exports = {
  name: "purge",
  description: "purge your messages",
  aliases: ["delete", "del", "c"],
  syntax: "<count>",
  /**
   *
   * @param {Client} client
   * @param {Message} message
   */

  run: async (client, message, args) => {
    let matches = message.content.match(/\d+|"([^"]*)"/g);
    let end = false;
    if (matches) {
      let [n] = matches.map((v) => v.replace(/"/g));
      await (async function () {
        for (let i = -1; i < n; i++) {
          await message.channel.messages
            .fetch({
              limit: 100,
            })
            .then(async (messages) => {
              messages = messages.filter(
                (msg) => msg.author.id === `${message.author.id}`
              );
              if (messages.size > 0) {
                try {
                  await messages.first().delete();
                } catch (error) {
                  i--;
                  console.log(error);
                }
              }
            });
          if (end) break;
        }
      })();
    }
  },
};
