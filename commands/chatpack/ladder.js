module.exports = {
  name: "ladder",
  description: "content laddering",
  aliases: ["lad", "ladr", "ldr"],
  syntax: "[-e] <content>",
  run: async (client, message, args) => {
    if (!args.length) {
      return message?.reply("`WARNING`\n-# Please provide a sentence to ladder.");
    }

    const isSingleMessage = args[0] === "-e";
    if (isSingleMessage) args.shift();

    message?.delete();

    if (isSingleMessage) {
      const content = args.join("\n");
      await message.channel.send(content);
    } else {
      for (const word of args) {
        await message.channel.send(word);
      }
    }
  },
};
