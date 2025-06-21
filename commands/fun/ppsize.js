module.exports = {
  name: "ppsize",
  description: "shows pp size",
  syntax: "[user]",
  run: async (client, message, args) => {
    const user = message.mentions.users.first() || message.author;
    const ppSize = Math.floor(Math.random() * 20) + 1;
    const ppRepresentation = `8${"=".repeat(ppSize)}D`;
    message?.edit(`**${user.username}'s** pp size is: ${ppRepresentation} 🍆`);
  }, 
};
