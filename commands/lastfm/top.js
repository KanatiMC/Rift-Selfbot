const config = require("../../data/config");
const axios = require("axios");
const https = require("https");

const httpsAgent = new https.Agent({ family: 4 });

module.exports = {
  name: "top",
  description: "personal top Last.FM",
  aliases: ["stats"],
  syntax: "<artists|a|tracks|t|albums|al> [limit] [name]",
  run: async (client, message, args) => {
    if (!config.lastfmKey || !config.lastfmUser)
      return message?.reply(
        "`WARNING`\n-# Please setup your Last.FM config to use this command!"
      );
    if (!args[0]) {
      return message?.reply(
        `\`WARNING\`\n-# No arguments provided. Valid args: **artists**/**a**, **tracks**/**t**, **albums**/**al**`
      );
    }

    let category = "";
    if (args[0].toLowerCase() === "artists" || args[0].toLowerCase() === "a") {
      category = "artists";
    } else if (
      args[0].toLowerCase() === "tracks" ||
      args[0].toLowerCase() === "t"
    ) {
      category = "tracks";
    } else if (
      args[0].toLowerCase() === "albums" ||
      args[0].toLowerCase() === "al"
    ) {
      category = "albums";
    } else {
      return message?.reply(
        `\`WARNING\`\n-# Invalid argument. Valid args: **artists**/**a**, **tracks**/**t**, **albums**/**al**`
      );
    }

    args.shift();

    let limit = 5;
    let artistName = null;

    if (args.length > 0) {
      if (!isNaN(args[0])) {
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
          `\`WARNING\`\n-# List limit can't be greater than \`15\`.`
        );
      }

      if (category !== "artists" && args.length > 0) {
        artistName = args.join(" ");
      }
    }

    const fetchAllPages = async (category, artistName) => {
      let allItems = [];
      let page = 1;
      let totalPages = 1;

      do {
        const url = `https://ws.audioscrobbler.com/2.0/?method=user.gettop${category}&user=${config.lastfmUser}&api_key=${config.lastfmKey}&period=overall&format=json&limit=100&page=${page}`;

        const response = await axios.get(url, { httpsAgent });
        const data = response.data;
        const items =
          category === "artists"
            ? data.topartists?.artist
            : category === "tracks"
            ? data.toptracks?.track
            : data.topalbums?.album;

        if (!items) {
          throw new Error(`Failed to fetch top ${category} data.`);
        }

        allItems = allItems.concat(items);

        totalPages = parseInt(
          data[
            category === "artists"
              ? "topartists"
              : category === "tracks"
              ? "toptracks"
              : "topalbums"
          ]["@attr"].totalPages
        );
        page++;
      } while (page <= totalPages);

      return allItems;
    };

    try {
      const fetchMessage = await message?.reply(
        `\`FETCHING\`\n-# Please wait while fetching the info...`
      );

      const items = await fetchAllPages(category, artistName);

      let filteredItems = items;

      if (artistName && (category === "tracks" || category === "albums")) {
        const artistLower = artistName.toLowerCase();

        const artistRegex = new RegExp(`(^|\\s)${artistLower}(\\s|$)`, "i");

        filteredItems = items.filter((item) =>
          artistRegex.test(item.artist.name.toLowerCase())
        );

        if (filteredItems.length === 0) {
          return fetchMessage.edit(
            `\`WARNING\`\n-# No ${category} found for the artist \`${artistName}\` in your top ${category}.`
          );
        }
      }

      const topItems = filteredItems
        .sort((a, b) => parseInt(b.playcount) - parseInt(a.playcount))
        .slice(0, limit);

      let output = `\`TOP ${limit} ${
        category === "artists"
          ? "ARTISTS"
          : category === "albums"
          ? artistName
            ? `ALBUMS FOR ${artistName.toUpperCase()}`
            : "ALBUMS"
          : artistName
          ? `TRACKS FOR ${artistName.toUpperCase()}`
          : "TRACKS"
      }\`\n`;

      topItems.forEach((item, index) => {
        output += `-# __#${index + 1}__ • **[${item.name}](<${item.url}>)**${
          category === "tracks" || category === "albums"
            ? ` by *${item.artist.name}*`
            : ""
        } ~ \`${item.playcount} plays\`\n`;
      });

      fetchMessage.edit(output);
    } catch (error) {
      message?.reply(`\`ERROR\`\n-# Could not retrieve data: ${error.message}`);
    }
  },
};
