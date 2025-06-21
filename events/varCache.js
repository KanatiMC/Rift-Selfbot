const AutoReactions = require("../models/AutoReactions.js");
const AutoReply = require("../models/AutoReplies.js");
const Status = require("../models/Config.js");

module.exports = {
  name: "ready",
  async execute(client) {
    await loadStatusAndQuotes(client);
    await loadRpcButtons(client);
    await initializeReactions(client);
    await loadAutoReplies(client);

    await require("./presence").execute(client);
  },
};

async function loadRpcButtons(client) {
  try {
    const savedStatus = await Status.findOne({
      customPrefix: client.configCache.customPrefix,
    });

    if (savedStatus) {
      client.configCache = {
        ...client.configCache,
        buttonOne: savedStatus.buttonOne || client.configCache.buttonOne,
        buttonTwo: savedStatus.buttonTwo || client.configCache.buttonTwo,
      };
    }
  } catch (err) {
    console.error("Error loading RPC buttons from database:", err);
  }
}

async function initializeReactions(client) {
  try {
    const reactionData = await AutoReactions.find({});
    if (reactionData.length === 0) {
      client.reactionCache = { users: [], channels: [] };
      await new AutoReactions(client.reactionCache).save();
    } else {
      client.reactionCache = {
        users: [],
        channels: [],
      };
      reactionData.forEach((record) => {
        if (record.users) {
          client.reactionCache.users.push(...record.users);
        }
        if (record.channels) {
          client.reactionCache.channels.push(...record.channels);
        }
      });
    }

    client.reactionsPaused = false;
  } catch (err) {
    console.error("   [?] Error loading autoreactions from database:", err);
  }
}

async function loadStatusAndQuotes(client) {
  try {
    const statusData = await Status.findOne();
    if (statusData) {
      client.configCache.customPrefix = statusData.customPrefix || ";";
      client.configCache.defaultStatus = statusData.defaultStatus || null;
      client.configCache.imageUrl = statusData.imageUrl || null;
      client.configCache.defaultLink = statusData.defaultLink || null;
      client.configCache.rpc = statusData.rpc || "basic";
      client.configCache.rpcType = statusData.rpcType || "STREAMING";
      client.configCache.afkEnabled = statusData.afkEnabled || false;
      client.configCache.afkStatus = statusData.afkStatus || null;
      client.configCache.afkStartTime = statusData.afkStartTime || null;
      client.configCache.quotes = statusData.quotes || [];
      client.configCache.buttonOne = {
        name: statusData.buttonOne?.name || null,
        link: statusData.buttonOne?.link || null,
      };
      client.configCache.buttonTwo = {
        name: statusData.buttonTwo?.name || null,
        link: statusData.buttonTwo?.link || null,
      };

      console.log(
        `   [+] ${
          client.configCache.customPrefix
            ? `Prefix: ${client.configCache.customPrefix} [database]`
            : `Prefix: ; [default]`
        }`
      );
    }
  } catch (err) {
    console.error("   [?] loading status and quotes from database:", err);
  }
}

async function loadAutoReplies(client) {
  try {
    const autoReplies = await AutoReply.find();

    autoReplies.forEach((autoReply) => {
      client.autoReplyCache.set(autoReply.userId, {
        content: autoReply.content || null,
        mimic: autoReply.mimic || false,
      });
    });
  } catch (err) {
    console.error(
      "   [?] Error loading auto-reply/mimic data into cache:",
      err
    );
  }
}
