module.exports = {
  name: "simp",
  description: "simp ratio",
  syntax: "[user]",
  run: async (client, message, args) => {
    const user = message.mentions.users.first() || message.author;
    const simpPercent = Math.floor(Math.random() * 101);
    message?.edit(`💔 **${user.username}** is ${simpPercent}% simp! 😬`);
  },
};
