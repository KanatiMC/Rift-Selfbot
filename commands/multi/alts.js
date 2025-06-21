const fs = require("fs");
const path = require("path");
const { Client, Intents } = require("discord.js-selfbot-v13");

module.exports = {
  name: "alts",
  description: "alt management",
  syntax: "<type> [content]",
  aliases: ["accounts", "accs"],
  run: async (client, message, args, { slowmode }) => {
    const type = args[0];
    const content = args.slice(1).join(" ");

    if (!type) {
      return message?.reply(
        "`ERROR`\n-# Please specify a type: `name`, `status`, or `upload`."
      );
    }

    if (
      (type === "name" || type === "status") &&
      (!client.altClients ||
        !Array.isArray(client.altClients) ||
        client.altClients.length === 0)
    ) {
      return message?.reply(
        "`ERROR`\n-# No alt clients available for modification."
      );
    }

    const changeDisplayName = async (altClient, newDisplayName) => {
      for (const guild of altClient.guilds.cache.values()) {
        try {
          const altMember = guild.members.cache.get(altClient.user.id);
          if (altMember) {
            await altMember.setNickname(newDisplayName);
          }
        } catch (error) {}
      }
    };

    const changeStatus = async (altClient, newStatus) => {
      try {
        await altClient.user.setPresence({
          activities: [{ name: newStatus }],
          type: "STREAMING",
          status: "online",
        });
      } catch (error) {
        console.error("Failed to set status:", error);
      }
    };

    if (type === "name") {
      if (!content) {
        return message?.reply(
          "`ERROR`\n-# Please provide a display name to set for the alt accounts."
        );
      }
      message?.reply("`INFO`\n-# Changing display name for all alt tokens...");
      client.altClients.forEach(async (altClient) => {
        await changeDisplayName(altClient, content);
      });
      return message?.reply(
        "`SUCCESS`\n-# Display name changed to `" +
          content +
          "` for all alt tokens."
      );
    } else if (type === "status") {
      if (!content) {
        return message?.reply(
          "`ERROR`\n-# Please provide a status to set for the alt accounts."
        );
      }
      message?.reply("`INFO`\n-# Changing status for all alt tokens...");
      client.altClients.forEach(async (altClient) => {
        await changeStatus(altClient, content);
      });
      return message?.reply(
        "`SUCCESS`\n-# Status changed to `" + content + "` for all alt tokens."
      );
    } else if (type === "upload") {
      const filePath = path.join(
        __dirname,
        "..",
        "..",
        "data",
        "files",
        "alts.txt"
      );

      if (content === "clear") {
        fs.writeFileSync(filePath, "");
        message?.reply("`SUCCESS`\n-# Cleared the contents of `alts.txt`.");
        client.altClients = [];
        loadAltAccounts(client, message, true);
        return;
      }

      if (content) {
        fs.appendFileSync(filePath, content + "\n");
        loadAltAccounts(client, message);
        return;
      }

      if (!message.attachments.size) {
        return message?.reply(
          "`ERROR`\n-# Please attach a .txt file or provide a token as an argument."
        );
      }

      const attachment = message.attachments.first();
      if (!attachment.name.endsWith(".txt")) {
        return message?.reply(
          "`ERROR`\n-# The attached file must be a **.txt** file."
        );
      }

      const fetch = await import("node-fetch").then((module) => module.default);
      const response = await fetch(attachment.url);
      const buffer = await response.buffer();

      fs.appendFile(filePath, `${buffer}\n`, async (err) => {
        if (err) {
          console.error("Error appending file:", err);
          return message?.reply("`ERROR`\n-# Failed to upload the file.");
        }

        for (const altClient of client.altClients) {
          await altClient.destroy();
        }

        client.altClients = [];
        loadAltAccounts(client, message);
      });

      return;
    } else {
      return message?.reply(
        "`ERROR`\n-# Invalid type. Use `name`, `status`, or `upload`."
      );
    }
  },
};

async function loadAltAccounts(client, message, cleared) {
  const altsFilePath = "data/files/alts.txt";
  const invalidFilePath = "data/logs/invalid.txt";

  try {
    const data = fs.readFileSync(altsFilePath, "utf8");
    let tokens = data
      .split("\n")
      .map((line) => line.trim().split(":").pop())
      .filter(Boolean);

    const uniqueTokens = [...new Set(tokens)];
    if (uniqueTokens.length < tokens.length) {
      tokens = uniqueTokens;
      fs.writeFileSync(altsFilePath, tokens.join("\n") + "\n");
      message?.reply("`INFO`\n-# Duplicate tokens detected and removed.");
    }

    const invalidTokens = [];

    tokens.forEach((token) => {
      const altClient = new Client();
      altClient
        .login(token)
        .then(() => {
          client.altClients.push(altClient);
        })
        .catch(() => {
          console.log(`[!] INVALID: ${token}`);
          invalidTokens.push(token);
        });
    });

    if (cleared) {
      return message?.reply(
        "`SUCCESS`\n-# Successfully cleared all loaded tokens."
      );
    }

    if (invalidTokens.length > 0) {
      fs.appendFileSync(invalidFilePath, invalidTokens.join("\n") + "\n");
      fs.writeFileSync(
        altsFilePath,
        tokens.filter((token) => !invalidTokens.includes(token)).join("\n") +
          "\n"
      );
      return message?.reply(
        "`INFO`\n-# Invalid tokens removed, valid tokens updated in `alts.txt`."
      );
    } else {
      return message?.reply(
        "`SUCCESS`\n-# Successfully loaded **" +
          client.altClients.length +
          "** tokens."
      );
    }
  } catch (err) {
    console.error("[!] Error loading accounts:", err);
    return message?.reply(
      "`ERROR`\n-# There was an issue loading alt accounts. Please try again later."
    );
  }
}
