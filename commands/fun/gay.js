module.exports = {
  name: "gay",
  description: "gay percentage",
  syntax: "[user]",
  run: async (client, message, args) => {
    const user = message.mentions.users.first() || message.author;
    const gayPercent = Math.floor(Math.random() * 101); // Generates between 0% and 100%
    message?.edit(`🌈 **${user.username}** is ${gayPercent}% gay!`);
  },
};
