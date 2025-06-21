const { Client, Message, MessageEmbed } = require("discord.js-selfbot-v13");
const axios = require("axios");

module.exports = {
  name: "actions",
  description: "perform various actions, including NSFW actions",
  run: async (client, message, args) => {
    const action = args[0];
    const target = message.mentions.users.first() || args[1];
    if (!target) return message.reply("Please mention someone to interact with!");

    const actions = {
      kiss: "kiss",
      hug: "hug",
      bite: "bite",
      wave: "wave",
      lewd: "lewd",
      pat: "pat",
      slap: "slap",
      highfive: "high five",
      poke: "poke",
      cuddle: "cuddle",
      dance: "dance",
      smile: "smile",
      wink: "wink",
      
      // NSFW actions
      spank: "spank",
      moan: "moan",
      tease: "tease",
      lick: "lick"
    };

    if (!actions[action]) {
      return message.reply(`Available actions: ${Object.keys(actions).join(", ")}`);
    }

    try {
      const response = await axios.get(`https://api.giphy.com/v1/gifs/search`, {
        params: {
          api_key: "ej1A5DFU0MROqqWHo3KBWAN82l5N9jjY",
          q: actions[action],
          limit: 10,
          rating: "r"
        }
      });

      const gifList = response.data.data;
      if (gifList.length === 0) {
        return message.reply("Couldn't find any GIFs for that action. Try again later!");
      }

      const randomGif = gifList[Math.floor(Math.random() * gifList.length)].images.original.url;

      message.channel.send(`\`${client.user.username}\` x \`${target.user ? target.user.username : target}\`\n-# ${randomGif}`);
    } catch (error) {
      console.error(error);
      message.reply("Couldn't fetch a GIF. Try again later!");
    }
  }
};
