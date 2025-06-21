const fs = require("fs");
const axios = require("axios");
require("dotenv").config();

module.exports = {
  name: "joiner",
  description: "token joiner/booster",
  syntax: "<code> [count] [boost]",
  aliases: ["join"],
  run: async (client, message, args) => {
    if (!args[0]) return message?.reply("`WARNING`\n-# Please provide an invite code.");

    const inviteCode = args[0];
    const maxCount = args[1] ? parseInt(args[1], 10) : null;
    const boostEnabled = args[2] && args[2].toLowerCase() === "boost";

    const isValid = await isInviteCodeValid(inviteCode);
    if (!isValid) {
      return message?.reply("`WARNING`\n-# The provided invite code is invalid or expired.");
    }

    let tokens;
    const attachment = message.attachments.first();
    if (attachment) {
      try {
        tokens = await loadTokensFromAttachment(attachment);
      } catch (error) {
        return message?.reply("`ERROR`\n-# Failed to read tokens from the attached file.");
      }
    } else {
      tokens = loadTokensFromFile();
    }

    if (!tokens || tokens.length === 0) {
      return message.reply("`WARNING`\n-# No tokens found to use for joining.");
    }

    const proxies = loadProxies();
    const successfulJoins = [];
    const failedJoins = [];
    const successfulBoosts = [];
    const failedBoosts = [];
    const selectedTokens = maxCount ? tokens.slice(0, maxCount) : tokens;

    message.delete();

    let statusMessage = await message.channel.send(
      `### \`\`\`[RIFT] | JOINER INITIATED\`\`\`\n-# Attempting to join with ${selectedTokens.length} tokens...`
    );

    for (const token of selectedTokens) {
      const proxy = proxies[Math.floor(Math.random() * proxies.length)];
      const { success, status, guildId } = await joinServer(token, inviteCode, proxy);

      if (success) {
        successfulJoins.push({ token });
        
        // Attempt to boost if boosting is enabled
        if (boostEnabled) {
          const boostResult = await boostGuild(token, guildId);
          if (boostResult.success) {
            successfulBoosts.push({ token });
          } else {
            failedBoosts.push({ token });
          }
        }
      } else {
        failedJoins.push({ token });
      }

      const maskedToken = maskString(token, 6, 6);
      const joinStatus = `${maskedToken} | Join: ${status} | Boost: ${boostEnabled ? (boostResult ? boostResult.status : "N/A") : "Disabled"}`;

      await statusMessage.edit(
        `### \`\`\`[RIFT] | JOINER (${successfulJoins.length + failedJoins.length}/${selectedTokens.length})\`\`\`\n\`\`\`ini\n${joinStatus}\n\`\`\`\n`
      );

      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    const successList = successfulJoins.map(({ token }) => `${maskString(token, 6, 6)}`).join("\n");
    const failedList = failedJoins.map(({ token }) => `${maskString(token, 6, 6)}`).join("\n");
    const successBoostList = successfulBoosts.map(({ token }) => `${maskString(token, 6, 6)}`).join("\n");
    const failedBoostList = failedBoosts.map(({ token }) => `${maskString(token, 6, 6)}`).join("\n");

    await statusMessage.edit(
      `### \`\`\`[RIFT] | JOINER COMPLETE\`\`\`\n\`\`\`ini\nJoined (${successfulJoins.length})\n${successList || "None"}\n\nFailed Joins (${failedJoins.length})\n${failedList || "None"}\n\nBoosted (${successfulBoosts.length})\n${boostEnabled ? (successBoostList || "None") : "Boosting Disabled"}\n\nFailed Boosts (${failedBoosts.length})\n${boostEnabled ? (failedBoostList || "None") : "Boosting Disabled"}\`\`\``
    );
  },
};

// Helper function to load proxies from a file
function loadProxies() {
  return fs.existsSync("/home/ubuntu/scraper/proxies.txt")
    ? fs
        .readFileSync("/home/ubuntu/scraper/proxies.txt", "utf-8")
        .split("\n")
        .map((p) => p.trim())
        .filter(Boolean)
    : [];
}

// Helper function to join a server with a token and proxy
async function joinServer(token, inviteCode, proxy) {
  try {
    const response = await axios({
      method: "post",
      url: `https://discord.com/api/v9/invites/${inviteCode}`,
      headers: {
        Authorization: token,
      },
      proxy: {
        host: proxy.split(":")[0],
        port: parseInt(proxy.split(":")[1]),
      },
    });
    return { success: true, status: response.status, guildId: response.data.guild.id };
  } catch (error) {
    return { success: false, status: error.response ? error.response.status : "Unknown Error" };
  }
}

// Helper function to boost a server with a token (requires guildId)
async function boostGuild(token, guildId) {
  try {
    const response = await axios({
      method: "post",
      url: `https://discord.com/api/v9/guilds/${guildId}/premium/subscription`,
      headers: {
        Authorization: token,
      },
      data: { user_premium_guild_subscription_slot_ids: [] },
    });
    return { success: true, status: response.status };
  } catch (error) {
    return { success: false, status: error.response ? error.response.status : "Boost Failed" };
  }
}

// Helper function to check if an invite code is valid
async function isInviteCodeValid(inviteCode) {
  try {
    const response = await axios.get(`https://discord.com/api/v9/invites/${inviteCode}`);
    return response.status === 200;
  } catch {
    return false;
  }
}

// Helper function to load tokens from a local file
function loadTokensFromFile() {
  return fs.existsSync("/home/ubuntu/scraper/tokens.txt")
    ? fs
        .readFileSync("/home/ubuntu/scraper/tokens.txt", "utf-8")
        .split("\n")
        .map((token) => token.trim())
        .filter(Boolean)
    : [];
}

// Helper function to load tokens from an attachment
async function loadTokensFromAttachment(attachment) {
  const response = await axios.get(attachment.url, { responseType: "text" });
  return response.data
    .split("\n")
    .map((token) => token.trim())
    .filter(Boolean);
}

// Helper function to mask tokens for display (only show a few characters)
function maskString(str, start = 0, end = 0) {
  return str.substring(0, start) + "*".repeat(str.length - start - end) + str.substring(str.length - end);
}
