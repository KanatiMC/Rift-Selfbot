module.exports = {
  name: "sus",
  description: "sus ratio",
  syntax: "[user]",
  run: async (client, message, args) => {
    const user = message.mentions.users.first() || message.author;
    const susLevel = Math.floor(Math.random() * 101);
    message?.edit(`🤨 **${user.username}** is ${susLevel}% sus!`);
  },
};
