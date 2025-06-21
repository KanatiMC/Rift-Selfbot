const config = require("../../data/config");
const axios = require("axios");
const https = require("https");

const httpsAgent = new https.Agent({ family: 4 });

module.exports = {
  name: "recent",
  description: "display recent tracks",
  aliases: ["recenttracks", "rt"],
  syntax: "[limit] [artist]",
  run: async (client, message, args) => {
    if (!config.lastfmKey || !config.lastfmUser)
      return message?.reply(
        "`WARNING`\n-# Please setup your Last.FM config to use this command!"
      );
    let limit = 5;
    let artistName = null;

    if (args.length > 0 && !isNaN(args[0])) {
      limit = parseInt(args[0]);
      args.shift();
    }

    if (isNaN(limit) || limit < 1) {
      return message?.reply(
        `\`WARNING\`${
          limit < 1 ? `\n-# Provide a valid integer between 1 and 15!` : ""
        }${isNaN(limit) ? `\n-# \`${limit}\` is not a valid number.` : ""}`
      );
    }

    if (limit > 15) {
      return message?.reply(
        `\`WARNING\`\n-# The limit for recent tracks can't be greater than \`15\``
      );
    }

    if (args.length > 0) {
      artistName = args.join(" ").toLowerCase();
    }

    let url = `https://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=${config.lastfmUser}&api_key=${config.lastfmKey}&limit=100&format=json`;

    try {
      const response = await axios.get(url, {
        httpsAgent: httpsAgent,
      });

      const items = response.data.recenttracks?.track;

      if (!items || items.length === 0) {
        return message?.reply(`\`ERROR\`\n-# No recent tracks found.`);
      }

      let filteredItems = items;

      if (artistName) {
        filteredItems = items.filter(
          (track) => track.artist["#text"].toLowerCase() === artistName
        );

        if (filteredItems.length === 0) {
          return message?.reply(
            `\`WARNING\`\n-# No recent tracks found for the artist \`${artistName}\`.`
          );
        }
      }

      const topItems = filteredItems.slice(0, limit);

      let output = `\`RECENT ${limit} ${
        artistName ? `TRACKS FOR ${artistName.toUpperCase()}` : "TRACKS"
      }\`\n`;

      topItems.forEach((item, index) => {
        const artist = item.artist["#text"];
        const trackName = item.name;
        const trackUrl = item.url || "#";
        const albumName = item.album["#text"]
          ? ` from *${item.album["#text"]}*`
          : "";
        const nowPlaying = item["@attr"]?.nowplaying ? true : false;

        let timestamp = "";
        if (index === 0) {
          if (nowPlaying) {
            timestamp = " **(Now Playing)**";
          } else if (item.date) {
            const unixTimestamp = Math.floor(
              new Date(item.date["uts"] * 1000).getTime() / 1000
            );
            timestamp = ` (<t:${unixTimestamp}:R>)`;
          }
        }

        output += `-# __#${
          index + 1
        }__ • **[${trackName}](<${trackUrl}>)** by *${artist}*${albumName}${timestamp}\n`;
      });

      message?.reply(output);
    } catch (error) {
      message?.reply(`\`ERROR\`\n-# Could not retrieve data: ${error.message}`);
    }
  },
};
