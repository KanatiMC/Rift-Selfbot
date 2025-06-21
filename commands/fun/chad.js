module.exports = {
  name: "chad",
  description: "chad ratio",
  syntax: "[user]",
  run: async (client, message, args) => {
    const user = message.mentions.users.first() || message.author;
    const chadLevel = Math.floor(Math.random() * 101);
    message?.edit(`😎 **${user.username}** is ${chadLevel}% Chad! 🦸‍♂️`);
  },
};
