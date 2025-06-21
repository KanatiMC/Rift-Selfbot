const fs = require("fs");
const path = require("path");

module.exports = {
  name: "autopressure",
  description: "auto pressure spam",
  aliases: ["ap", "press"],
  syntax: "<start/end> <target> [-all|-alts]",

  run: async (client, message, args) => {
    if (args[0] === "end") {
      if (client.isSpamming) {
        client.isSpamming = false;
        return message?.reply(
          "`WARNING`\n-# Auto-pressure has been stopped."
        );
      } else {
        return message?.reply(
          "`WARNING`\n-# No ongoing auto-pressure session to stop."
        );
      }
    }

    if (args[0] === "start") {
      if (client.isSpamming) {
        return message?.reply(
          "`WARNING`\n-# An auto-pressure session is already running."
        );
      }

      client.isSpamming = true;

      const useAllAltsOnly = args.includes("-alts");
      const useMainAndAllAlts = args.includes("-all");
      const countArg = args.find((arg) => arg.startsWith("-c") && !useAllAltsOnly && !useMainAndAllAlts);
      const spamCount = useAllAltsOnly || useMainAndAllAlts ? Infinity : (countArg ? parseInt(countArg.slice(2), 10) : 1);

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

      const autopress = async (clientInstance, channelId) => {
        let delay = 0;

        while (client.isSpamming) {
          const randomMessage =
            spamMessages[Math.floor(Math.random() * spamMessages.length)];

          const channel = clientInstance.channels.cache.get(channelId);
          if (!channel) {
            return;
          }

          try {
            if (targetUser) {
              await channel.send(
                `# ${randomMessage.toUpperCase()}\n<@${targetUser.id}>`
              );
            } else {
              await channel.send(`# ${randomMessage.toUpperCase()}`);
            }

            delay = 0;
          } catch (error) {
            if (error.code === 50013 || error.code === 50007) {
              client.isSpamming = false;
              break;
            } else if (error.message.includes("rate limit")) {
              const retryAfter = error.retry_after || 1000;
              delay = retryAfter + 1000;
            } else {
              console.error(error);
              break;
            }
          }

          if (delay > 0) {
            await sleep(delay);
          }
        }
      };

      const runSessions = () => {
        const clients = useMainAndAllAlts ? [client, ...client.altClients] : (useAllAltsOnly ? client.altClients : [client]);

        let activeClients = spamCount === Infinity ? clients : clients.slice(0, spamCount);
        let index = spamCount;

        activeClients.forEach((activeClient) => {
          autopress(activeClient, message.channel.id);
        });

        const interval = setInterval(() => {
          if (!client.isSpamming) {
            clearInterval(interval);
            return;
          }

          if (activeClients.some((c) => c.rateLimited)) {
            activeClients = spamCount === Infinity ? clients : clients.slice(index, index + spamCount);
            index = (index + spamCount) % clients.length;

            activeClients.forEach((clientInstance) => {
              autopress(clientInstance, message.channel.id);
            });
          }
        }, 1000);
      };

      runSessions();
    } else {
      return message?.reply(
        "`WARNING`\n-# Please use `autopressure start [target] [-ca] [-cm] [-c<count>]` or `autopressure end`."
      );
    }
  },
};
