module.exports = {
  name: "sigma",
  description: "sigma percentage",
  syntax: "[user]",
  run: async (client, message, args) => {
    const user = message.mentions.users.first() || message.author;
    const sigmaPercent = Math.floor(Math.random() * 101);
    message?.edit(`🧠 **${user.username}** is ${sigmaPercent}% Sigma! 💪`);
  },
};
