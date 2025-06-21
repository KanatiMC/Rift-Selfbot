module.exports = {
  name: "cupsize",
  description: "shows cup size",
  syntax: "[user]",
  run: async (client, message, args) => {
    const cupSizes = [
      "AA",
      "A",
      "B",
      "C",
      "D",
      "DD",
      "E",
      "F",
      "FF",
      "G",
      "GG",
      "H",
      "HH",
      "I",
      "J",
    ];

    const user = message.mentions.users.first() || message.author;

    const randomCupSize = cupSizes[Math.floor(Math.random() * cupSizes.length)];

    message?.edit(
      `**${user.username}'s**  cup size is **${randomCupSize}**! 🍒`
    );
  },
};
