const { Client, Message } = require("discord.js-selfbot-v13");
const Status = require("../../models/Config");

module.exports = {
  name: "quote",
  description: "rpc status quotes",
  aliases: ["quotes", "qt", "qts"],
  syntax: "<add/rmv/set/list/rnd> [quote/index]",
  /**
   *
   * @param {Client} client
   * @param {Message} message
   */

  run: async (client, message, args) => {
    const subCommand = args.shift()?.toLowerCase();
    let customPrefix = client.configCache.customPrefix || "";

    if (!subCommand) {
      return message?.reply(
        "`WARNING`\n-# Provide a subcommand: `add`, `rmv`, `list`, `set` or `rnd`"
      );
    }

    switch (subCommand) {
      case "add": {
        const newQuote = args.join(" ");
        if (!newQuote)
          return message?.reply(
            "`WARNING`\n-# Please provide content for the new quote."
          );

        client.configCache.quotes.push(newQuote);
        await saveStatusAndQuotes(client);
        return message?.reply(
          `\`QUOTE ADDED\`\n-# ${client.configCache.quotes.length}: ${newQuote}`
        );
      }

      case "rmv": {
        const index = parseInt(args[0]);
        if (
          isNaN(index) ||
          index <= 0 ||
          index > client.configCache.quotes.length
        ) {
          return message?.reply(
            "**WARNING**\n-# Invalid index. Use `$quote list` to see all quotes and their indices."
          );
        }

        const removedQuote = client.configCache.quotes.splice(index - 1, 1);
        await saveStatusAndQuotes(client);
        return message?.reply(`\`QUOTE REMOVED\`\n-# ${index}: ${removedQuote}`);
      }

      case "list": {
        if (client.configCache.quotes.length === 0) {
          return message?.reply("`WARNING`\n-# There are no quotes saved yet.");
        }

        const quoteList = client.configCache.quotes
          .map((quote, index) => `**${index + 1}**: ${quote}`)
          .join("\n");

        return message?.reply(quoteList);
      }

      case "rnd": {
        if (client.configCache.quotes.length === 0) {
          return message?.reply(
            "`WARNING`\n-# There are no quotes to choose from."
          );
        }

        let randomQuote;
        do {
          randomQuote =
            client.configCache.quotes[
              Math.floor(Math.random() * client.configCache.quotes.length)
            ];
        } while (randomQuote === client.configCache.defaultStatus);

        client.configCache.defaultStatus = randomQuote;
        await saveStatusAndQuotes(client);
        return message?.reply(`\`RANDOM QUOTE SET\`\n-# ${randomQuote}`);
      }

      case "set": {
        const quoteIndex = parseInt(args, 10) - 1;

        if (
          isNaN(quoteIndex) ||
          quoteIndex < 0 ||
          quoteIndex >= client.configCache.quotes.length
        ) {
          return message?.reply(
            "**WARNING**\n-# Invalid index. Use `$quote list` to see all quotes and their indices."
          );
        }

        client.configCache.defaultStatus =
          client.configCache.quotes[quoteIndex];
        await saveStatusAndQuotes(client);
        return message?.reply(
          `\`QUOTE SET\`\n-# ${client.configCache.defaultStatus}`
        );
      }

      default: {
        return message?.reply(
          `**WARNING**\n-# Invalid arguments provided. Usage: \`${customPrefix}quote <add/rmv/list/set/rnd> [quote/index]\``
        );
      }
    }
  },
};

async function saveStatusAndQuotes(client) {
  try {
    await Status.updateOne(
      {},
      {
        $set: {
          defaultStatus: client.configCache.defaultStatus,
          quotes: client.configCache.quotes,
        },
      },
      { upsert: true }
    );
  } catch (err) {
    console.error("Error saving status and quotes to database:", err);
  }
}
