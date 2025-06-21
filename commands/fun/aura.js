module.exports = {
  name: "aura",
  description: "aura color detector",
  syntax: "[user]",
  run: async (client, message, args) => {
    const user = message.mentions.users.first() || message.author;
    const colors = ["Red", "Blue", "Green", "Yellow", "Purple", "Black", "White", "Gold", "Pink"];
    const auraColor = colors[Math.floor(Math.random() * colors.length)];
    message?.edit(`🔮 **${user.username}**'s aura is **\`${auraColor.toLowerCase()}\`**!`);
  },
};
