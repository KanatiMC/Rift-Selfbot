const Config = require("../models/Config");

module.exports = {
  name: "messageCreate",
  tier: null,
  async execute(client, message) {
    if (message.author.id !== client.user.id) return;
    if (!message.content.toLowerCase().startsWith("setprefix")) return;
    const args = message.content.split(/ +/g);

    if (!args[1])
      return message?.reply(
        `\`PREFIX\`\n-# Your current prefix ${
          client.configCache.customPrefix
            ? `\`${client.configCache.customPrefix}\``
            : "*no prefix*"
        }`
      );

    if (args[1] !== "off" && args[1].length !== 1)
      return message?.reply(
        `\`WARNING\`\n-# You can only provide a single character to set as prefix or \`off\` to disable the prefix.`
      );

    if (args[1] === "off") client.configCache.customPrefix = null;
    else client.configCache.customPrefix = args[1];
    const saved = await saveStatusAndQuotes(client);
    if (saved) message?.reply(`\`SUCCESS\`\n-# Succesfully changed prefix to: \`${args[1]}\``);
    else message?.reply(`\`ERROR\`\n-# An error occured while trying to change the prefix.`);
  },
};

async function saveStatusAndQuotes(client) {
  try {
    const updated = await Config.updateOne(
      {},
      {
        $set: {
          customPrefix: client.configCache.customPrefix,
        },
      },
      { upsert: true }
    );
    if (updated) return true;
    else return false;
  } catch (err) {
    console.error("Error saving status and quotes to database:", err);
    return false;
  }
}
