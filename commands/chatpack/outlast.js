const fs = require("fs");
const path = require("path");

module.exports = {
  name: "outlast",
  description: "outlasting spam",
  syntax: "<start|end> <target> [-alts|-all] [-rl]",
  run: async (client, message, args) => {
    if (args[0] === "end") {
      if (client.isSpamming) {
        client.isSpamming = false;
        return message?.reply("`WARNING`\n-# Outlast has been stopped.");
      } else {
        return message?.reply(
          "`WARNING`\n-# No ongoing outlast session to stop."
        );
      }
    }

    if (args[0] === "start") {
      if (client.isSpamming) {
        return message?.reply(
          "`WARNING`\n-# An outlast session is already running."
        );
      }

      client.isSpamming = true;

      const handleRateLimit = args.includes("-rl");
      const useAltsOnly = args.includes("-alts");
      const useAllClients = args.includes("-all");
      let mentionedUser = message.mentions.users.first() || null;
      let userIdentifier = args[1] || null;

      if (mentionedUser) {
        userIdentifier = mentionedUser.id;
      } else if (/^\d{16,23}$/.test(userIdentifier)) {
        // Already a valid user ID
      } else {
        const userObj = client.users.cache.find(
          (user) =>
            user.username.toLowerCase() === userIdentifier?.toLowerCase()
        );
        if (userObj) {
          userIdentifier = userObj.id;
        } else {
          return message?.reply(
            "`INFO`\n-# Could not find a user `" +
              userIdentifier +
              "` in the client cache."
          );
        }
      }

      let targetUser;
      if (userIdentifier) {
        try {
          targetUser = await client.users.fetch(userIdentifier);
        } catch (error) {
          return message?.reply(
            "`ERROR`\n-# Could not fetch user with ID: `" +
              userIdentifier +
              "`"
          );
        }
      }

      const filePath = path.join(__dirname, "../../data/files/words.txt");
      let spamMessages = [];

      try {
        const data = fs.readFileSync(filePath, "utf8");
        spamMessages = data.split("\n").filter((line) => line.trim() !== "");
      } catch (err) {
        return message?.reply(
          "`ERROR`\n-# Could not read content from the `words.txt` file."
        );
      }

      if (spamMessages.length === 0) {
        return message?.reply("`ERROR`\n-# No content in the `words.txt` file.");
      }

      const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

      let counter = 1;

      const outlast = async (clientInstance, channelId) => {
        while (client.isSpamming) {
          const randomMessage =
            spamMessages[Math.floor(Math.random() * spamMessages.length)];

          try {
            if (targetUser) {
              await clientInstance.channels.cache.get(channelId)?.send(
                `# ${randomMessage}\n<@${targetUser.id}>\n-# \`${counter}\``
              );
            } else {
              await clientInstance.channels.cache.get(channelId)?.send(
                `# ${randomMessage}\n-# \`${counter}\``
              );
            }
          } catch (error) {
            if (
              error.code === 50013 ||
              error.code === 50007 ||
              error.message.includes("rate limit")
            ) {
              const retryAfter = error.retry_after || 1000;
              if (handleRateLimit) {
                await sleep(retryAfter);
              } else {
                console.error("Rate limit hit, stopping spam.");
                client.isSpamming = false;
                break;
              }
            } else {
              console.error(error);
              break;
            }
          }
          counter++;
          await sleep(1205);
        }
      };

      if (useAltsOnly) {
        client.altClients.forEach((altClient) => {
          outlast(altClient, message.channel.id);
        });
      } else if (useAllClients) {
        outlast(client, message.channel.id);
        client.altClients.forEach((altClient) => {
          outlast(altClient, message.channel.id);
        });
      } else {
        outlast(client, message.channel.id);
      }
    } else {
      return message?.reply(
        "`WARNING`\n-# Please use `outlast start [target] [limit] [-alts] [-all]` or `outlast end`."
      );
    }
  },
};
