const axios = require('axios');

module.exports = {
  name: "messageCreate",
  tier: "plus",
  async execute(client, message) {
    if (!client.snipeNitro) return;
    if (message.author.id === client.user.id) return;

    if (containsNitroGiftLink(message.content)) {
      const nitroRegex = /(discord\.gift|discordapp\.com\/gift)\/\w+/;
      const nitroMatch = nitroRegex.exec(message.content);

      const nitroCode = nitroMatch[0].split("/")[1];
      axios({
        method: "POST",
        url: `https://discordapp.com/api/v6/entitlements/gift-codes/${nitroCode}/redeem`,
        headers: {
          Authorization: client.token,
        },
      })
        .then(() =>
          console.log(`NITRO SNIPED: ${nitroCode}`)
        )
        .catch(() =>
          console.error(`FAILED SNIPE: ${nitroCode} (EXPIRED/FAKE/CLAIMED)`)
        );
    }
  },
};

function containsNitroGiftLink(text) {
  const nitroGiftRegex = /discord\.gift\/[a-zA-Z0-9]+/;
  return nitroGiftRegex.test(text);
}
