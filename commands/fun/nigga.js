module.exports = {
  name: "nigga",
  description: "nigga percentage",
  syntax: "[user]",
  run: async (client, message, args) => {
    const user = message.mentions.users.first() || message.author;
    const niggaPercent = Math.floor(Math.random() * 101);
    message?.edit(`🐒 **${user.username}** is ${niggaPercent}% nigga!`);
  },
};
