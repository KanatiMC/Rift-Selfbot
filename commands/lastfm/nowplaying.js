const config = require("../../data/config");
const { Client, Message } = require("discord.js-selfbot-v13");
const cheerio = require("cheerio");
const axios = require("axios");
const https = require("https");

const httpsAgent = new https.Agent({ family: 4 });

module.exports = {
  name: "nowplaying",
  description: "shows current track",
  aliases: ["np", "now", "playing"],
  /**
   *
   * @param {Client} client
   * @param {Message} message
   */

  run: async (client, message, args) => {
    if (!config.lastfmKey || !config.lastfmUser)
      return message?.reply(
        "`WARNING`\n-# Please setup your Last.FM config to use this command!"
      );
    const msg = message?.reply("Fetching info!");
    const trackInfo = await getCurrentTrack();
    if (trackInfo && trackInfo.nowPlaying) {
      let replyMessage = `**Now Playing:** [${trackInfo.title}](<${trackInfo.trackUrl}>) by **${trackInfo.artist}**\n-# ${trackInfo.trackScrobbles} track scrobbles 𓌜 ${trackInfo.artistScrobbles} artist scrobbles`;
      let altReplyMessage = `**Now Playing:** ${trackInfo.title} by **${trackInfo.artist}**\n-# ${trackInfo.trackScrobbles} track scrobbles 𓌜 ${trackInfo.artistScrobbles} artist scrobbles`;

      (await msg).edit(replyMessage).catch(async (err) => {
        console.error(err);
        (await msg).edit(altReplyMessage).catch(console.error);
      });
    } else {
      (await msg)
        .edit("`INFO`\n-# There's no track is playing currently.")
        .catch(console.error);
    }
  },
};

async function getCurrentTrack() {
  try {
    const res = await axios.get(
      `https://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=${config.lastfmUser}&api_key=${config.lastfmKey}&format=json&limit=1`,
      {
        httpsAgent: httpsAgent,
      }
    );

    const track = res.data.recenttracks.track[0];
    const totalScrobbles = res.data.recenttracks["@attr"].total || null;
    const nowPlaying = (track["@attr"] && track["@attr"].nowplaying) || false;
    const artist = track.artist["#text"] || null;
    const title = track.name || null;
    const album = track.album["#text"] || null;
    const trackUrl = track.url || null;
    const albumImage = track.image ? track.image[0]["#text"] : imageKey;

    const scrobbles = await fetchScrobbles(artist, title);
    const artistScrobbles = scrobbles.artistCount;
    const trackScrobbles = scrobbles.trackCount;

    return {
      artist,
      title,
      album,
      trackUrl,
      albumImage,
      nowPlaying,
      totalScrobbles,
      artistScrobbles,
      trackScrobbles,
    };
  } catch (error) {
    console.error(error);
    return null;
  }
}

async function fetchScrobbles(artist, songTitle) {
  const artistUrl = `https://www.last.fm/user/${
    config.lastfmUser
  }/library/music/${encodeURIComponent(artist)}`;
  const trackUrl = `https://www.last.fm/user/${
    config.lastfmUser
  }/library/music/${encodeURIComponent(artist)}/_/${encodeURIComponent(
    songTitle
  )}`;

  try {
    const artistResponse = await axios.get(artistUrl, {
      httpsAgent: httpsAgent,
    });
    const trackResponse = await axios.get(trackUrl, {
      httpsAgent: httpsAgent,
    });

    const $artist = cheerio.load(artistResponse.data);
    const $track = cheerio.load(trackResponse.data);

    const artistScrobblesCount = $artist(".metadata-list .metadata-display")
      .first()
      .text()
      .replace(",", "");
    const trackScrobblesCount = $track(
      ".library-track-metadata .metadata-display"
    )
      .first()
      .text()
      .replace(",", "");

    const artistCount = parseInt(artistScrobblesCount, 10) || 0;
    const trackCount = parseInt(trackScrobblesCount, 10) || 0;

    return { artistCount, trackCount };
  } catch (error) {
    return { artistCount: 0, trackCount: 0 };
  }
}
