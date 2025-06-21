module.exports = {
  name: "spam",
  description: "content spammer",
  aliases: ["flood"],
  syntax: "<start/end> <content> [-ca|-cm]",

  run: async (client, message, args) => {
    if (args[0] === "end") {
      if (client.isSpamming) {
        client.isSpamming = false;
        return message?.reply("`INFO`\n-# Spamming has been stopped.");
      } else {
        return message?.reply(
          "`WARNING`\n-# No ongoing spamming session to stop."
        );
      }
    }

    if (args[0] === "start") {
      if (args.length < 2) {
        return message?.reply(
          "`ERROR`\n-# Please provide the content to spam."
        );
      }

      if (client.isSpamming) {
        return message?.reply(
          "`WARNING`\n-# A spamming session is already running."
        );
      }

      client.isSpamming = true;

      const useAllAltsOnly = args.includes("-ca");
      const useMainAndAllAlts = args.includes("-cm");
      const countArg = args.find((arg) => arg.startsWith("-c") && !useAllAltsOnly && !useMainAndAllAlts);
      const spamCount = useAllAltsOnly || useMainAndAllAlts ? Infinity : (countArg ? parseInt(countArg.slice(2), 10) : 1);

      const spamContent = args.slice(1).join(" ")
        .replace(/-altmulti/g, "")
        .replace(/-ca/g, "")
        .replace(/-cm/g, "")
        .replace(/-c\d+/g, "")
        .trim();

      const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

      const spammer = async (clientInstance, channelId) => {
        while (client.isSpamming) {
          try {
            const channel = clientInstance.channels.cache.get(channelId);
            if (!channel) {
              break;
            }

            await channel.send(`${spamContent}`);
          } catch (error) {
            if (error.code === 50013 || error.code === 50007) {
              break;
            } else {
              console.error(error);
              break;
            }
          }
        }
      };

      const runSessions = () => {
        const clients = useMainAndAllAlts ? [client, ...client.altClients] : (useAllAltsOnly ? client.altClients : [client]);

        let activeClients = spamCount === Infinity ? clients : clients.slice(0, spamCount);
        let index = spamCount;

        activeClients.forEach((activeClient) => {
          spammer(activeClient, message.channel.id);
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
              spammer(clientInstance, message.channel.id);
            });
          }
        }, 1000);
      };

      runSessions();
    } else {
      return message?.reply(
        "`WARNING`\n-# Please use `spam <start/end> <content> [-altmulti] [-c<count> or -ca or -cm]`."
      );
    }
  },
};
