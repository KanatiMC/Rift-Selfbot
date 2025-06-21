const { Client, Message } = require("discord.js-selfbot-v13");
const axios = require("axios");

module.exports = {
  name: "credits",
  description: "Shows credits and version",
  aliases: ["creds"],
  /**
   * @param {Client} client
   * @param {Message} message
   */
  run: async (client, message, args, { slowmode }) => {
    const devId = "1158429903629336646"; // warn

    const fetchUsername = async (userId) => {
      try {
        const response = await axios.get(
          `https://api.wxrn.lol/api/discord/${userId}`
        );
        if (response.data && response.data.username) {
          return `\`${response.data.username}\``;
        }
        return userId;
      } catch (error) {
        return userId;
      }
    };

    const dev = await fetchUsername(devId);

    const replyMessage = `### \`\`\`[RIFT] | CREDITS\`\`\`\n\`\`\`ini\n[•] Developer: ${dev}`;

    await message?.reply(replyMessage);
  },
};
