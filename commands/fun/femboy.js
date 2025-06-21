module.exports = {
  name: "femboy",
  description: "femboy percentage",
  syntax: "[user]",
  run: async (client, message, args) => {
    const user = message.mentions.users.first() || message.author;
    const femboyPercent = Math.floor(Math.random() * 101);
    message?.edit(`💅 **${user.username}** is ${femboyPercent}% femboy!`);
  },
};
