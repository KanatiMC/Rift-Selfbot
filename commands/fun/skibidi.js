module.exports = {
  name: "skibidi",
  description: "skibidi percentage",
  syntax: "[user]",
  run: async (client, message, args) => {
    const user = message.mentions.users.first() || message.author;
    const skibidiPercent = Math.floor(Math.random() * 101);
    message?.edit(`🎶 **${user.username}** is ${skibidiPercent}% Skibidi! 🕺`);
  },
};
