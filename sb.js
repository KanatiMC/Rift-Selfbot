require("dotenv").config();
const fs = require("fs");
const config = require(`./data/config.js`);
const vars = require("./vars.js");
const { Client, Collection } = require("discord.js-selfbot-v13");
const mongoose = require("mongoose");
const axios = require("axios");
const path = require("path");

const client = new Client({
  applicationId: config.applicationId,
});

client.config = config;
client.configCache = {
  customPrefix: ";",
  rpc: "basic",
  rpcType: "STREAMING",
  defaultStatus: `default status`,
  imageUrl: null,
  defaultLink: null,
  buttonOne: null,
  buttonTwo: null,
  afkEnabled: false,
  afkStatus: null,
  afkStartTime: null,
  quotes: [],
};
client.cooldowns = new Map();
client.snipes = new Map();

client.autoReplyCache = new Map();
client.mimicCache = new Map();
client.reactionCache = null;
client.userReactionsPaused = {};
client.reactionsPaused = true;

client.privateMusic = false;
client.privateByAfk = false;
client.isSpamming = false;

client.rpcEnabled = true;
client.snipeNitro = false;
client.evalBool = false;
client.commands = new Collection();
client.categories = fs.readdirSync(`./commands`);
client.altClients = [];

client.once("ready", async () => {
  console.log(`[+] MAIN : ${client.user.username}`);
  await connectDB(`db_${client.user.id}`);

  await require("./events/varCache.js").execute(client);

  ["eventHandler", "commandHandler", "errorHandler"].forEach((handler) => {
    require(`./handlers/${handler}`)(client);
  });

  loadAltAccounts(client);
  console.log("[i] Alt client loading initialized");
});

async function connectDB(databaseName) {
  if (mongoose.connection.readyState === 0) {
    try {
      await mongoose.connect(config.mongo, { dbName: databaseName });
      console.log(`[+] Connected to MongoDB database: ${databaseName}`);
    } catch (err) {
      console.error(`[!] MongoDB connection error: ${err}`);
    }
  } else {
    console.log(`[o] Already connected to MongoDB database: ${databaseName}`);
  }
}

async function loadAltAccounts() {
  const altsFilePath = "data/files/alts.txt";
  const invalidFilePath = "data/logs/invalid.txt";

  const data = fs.readFileSync(altsFilePath, "utf8");
  let tokens = data
    .split("\n")
    .map((line) => {
      const trimmedLine = line.trim();
      if (trimmedLine.includes(":")) {
        const parts = trimmedLine.split(":");
        return parts[parts.length - 1];
      }
      return trimmedLine;
    })
    .filter((token) => token);

  const uniqueTokens = [...new Set(tokens)];
  if (uniqueTokens.length < tokens.length) {
    console.log("   [?] Duplicate tokens detected and removed.");
    tokens = uniqueTokens;

    fs.writeFileSync(altsFilePath, tokens.join("\n") + "\n");
    console.log(`   [?] Updated ${altsFilePath} with unique tokens.`);
  }

  const invalidTokens = [];
  const loadedAltUsernames = [];

  const loginPromises = tokens.map(async (token) => {
    const altClient = new Client();
    return altClient
      .login(token)
      .then(() => {
        client.altClients.push(altClient);
        loadedAltUsernames.push(altClient.user.tag);
      })
      .catch(() => {
        invalidTokens.push(token);
      });
  });

  Promise.allSettled(loginPromises).then(() => {
    if (loadedAltUsernames.length > 0) {
      console.log(
        `   [+] Loaded alt clients: ${loadedAltUsernames.join(", ")}`
      );
    } else {
      console.log(`   [!] No valid alt clients were loaded.`);
    }

    if (invalidTokens.length > 0) {
      fs.appendFileSync(invalidFilePath, invalidTokens.join("\n") + "\n");
      console.log(
        `   [?] Logged invalid tokens to ${path.resolve(invalidFilePath)}`
      );

      const validTokens = tokens.filter(
        (token) => !invalidTokens.includes(token)
      );
      fs.writeFileSync(altsFilePath, validTokens.join("\n") + "\n");
      console.log(
        `   [?] Removed invalid tokens from ${path.resolve(altsFilePath)}`
      );
    }
  });
}

client.login(config.token);
