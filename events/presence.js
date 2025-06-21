require('dotenv');
const { RichPresence, Util } = require("discord.js-selfbot-rpc");
const { exit } = require("process");
const cheerio = require("cheerio");
const axios = require("axios");
const https = require("https");
const config = require(`../data/config.js`);
const vars = require(`../vars.js`);
const httpsAgent = new https.Agent({ family: 4 });

module.exports = {
  name: "ready",
  async execute(client) {
    const applicationId = config.applicationId;
    client.rpcEnabled = true;

    async function execRpc() {
      try {
        const imageUrl = client.configCache.imageUrl || null;

        const defaultStatus =
          typeof client.configCache.defaultStatus === "string"
            ? client.configCache.defaultStatus
            : "default";

        if (client.configCache.rpc === "basic") {
          const presence = {
            activities: [
              {
                application_id: applicationId,
                name: defaultStatus,
                details: defaultStatus,
                assets: {
                  large_image: imageUrl || null,
                },
                type: client.configCache.rpcType || "PLAYING",
                url: client.configCache.defaultLink || null,
              },
            ],
            buttons: [
              ...(client.configCache.buttonOne?.name &&
              client.configCache.buttonOne?.link
                ? [
                    {
                      name: client.configCache.buttonOne.name,
                      url: client.configCache.buttonOne.link,
                    },
                  ]
                : []),
              ...(client.configCache.buttonTwo?.name &&
              client.configCache.buttonTwo?.link
                ? [
                    {
                      name: client.configCache.buttonTwo.name,
                      url: client.configCache.buttonTwo.link,
                    },
                  ]
                : []),
            ],
          };

          client.user.setPresence(presence);
        } else if (client.configCache.rpc === "advanced") {
          const trackInfo = await getCurrentTrack();
          let robloxInfo = await getRobloxGame(process.env.ROBLOX_COOKIE);

          if (robloxInfo && robloxInfo.placeId) {
            const { gameName, placeId, jobId, joinLink } = robloxInfo;

            client.user.setPresence({
              activities: [
                {
                  application_id: applicationId,
                  name: `ROBLOX`,
                  details: gameName,
                  type: "PLAYING",
                  assets: {
                    large_image: imageUrl,
                  },
                },
              ],
              buttons: [{ name: "Join Game", url: joinLink }],
            });
          }
          else if (trackInfo && trackInfo.nowPlaying && !client.privateMusic) {
            const {
              artist,
              title,
              album,
              totalScrobbles,
              artistScrobbles,
              trackScrobbles,
              albumImage,
              trackUrl,
            } = trackInfo;

            client.user.setPresence({
              activities: [
                {
                  application_id: applicationId,
                  name: `music • ${totalScrobbles} scrobbles`,
                  state: `${artist}${
                    album
                      ? album.toLowerCase() !== title.toLowerCase()
                        ? ` • ${album}`
                        : ""
                      : ""
                  }`,
                  details: title,
                  type: "LISTENING",
                  assets: {
                    large_image: albumImage || imageUrl,
                    large_text: `${trackScrobbles}x track • ${artistScrobbles}x artist`,
                  },
                },
              ],
              buttons: [{ name: "View on Last.fm", url: trackUrl }],
            });
          } else {
            client.user.setPresence({
              activities: [
                {
                  application_id: applicationId,
                  name: client.configCache.afkStatus ? `afk` : defaultStatus,
                  state: `${client.user.username} • ${
                    client.configCache.afkStatus || client.user.presence.status
                  }`,
                  details: defaultStatus,
                  type: client.configCache.rpcType || "PLAYING",
                  assets: {
                    large_image: imageUrl,
                  },
                },
              ],
              buttons: [
                ...(client.configCache.buttonOne?.name &&
                client.configCache.buttonOne?.link
                  ? [
                      {
                        name: client.configCache.buttonOne.name,
                        url: client.configCache.buttonOne.link,
                      },
                    ]
                  : []),
                ...(client.configCache.buttonTwo?.name &&
                client.configCache.buttonTwo?.link
                  ? [
                      {
                        name: client.configCache.buttonTwo.name,
                        url: client.configCache.buttonTwo.link,
                      },
                    ]
                  : []),
              ],
            });
          }
        }
      } catch (error) {
        return;
      }
    }

    async function startRpcInterval() {
      await execRpc();
      rpcInterval = setInterval(execRpc, 15000);
    }

    startRpcInterval();

    client.on("rpcStop", () => {
      clearInterval(rpcInterval);
      client.user.setPresence(null);
    });

    client.on("rpcStart", () => {
      startRpcInterval();
    });

    const stopRpcOnExit = () => {
      clearInterval(rpcInterval);
      if (client.user) {
        client.user.setPresence(null);
      }
      process.exit(0);
    };

    process.on("SIGINT", stopRpcOnExit);
    process.on("SIGTERM", stopRpcOnExit);
    process.on("exit", stopRpcOnExit);
  },
};

async function getCurrentTrack() {
  if (!config.lastfmUser || !config.lastfmKey) return null;
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

    const { imageId } = await getSpotifyAlbumCover(artist, title) || null;
    const albumImage = imageId ? `spotify:${imageId}` : null;

    const scrobbles = await fetchScrobbles(artist, title);
    const artistScrobbles = scrobbles.artistCount;
    const trackScrobbles = scrobbles.trackCount;

    return {
      artist,
      title,
      album,
      nowPlaying,
      totalScrobbles,
      artistScrobbles,
      trackScrobbles,
      trackUrl,
      albumImage,
    };
  } catch (error) {
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
    const artistResponse = await axios.get(artistUrl, { httpsAgent });
    const trackResponse = await axios.get(trackUrl, { httpsAgent });

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

async function getSpotifyAccessToken() {
  const tokenUrl = "https://accounts.spotify.com/api/token";
  const authString = Buffer.from(
    `${vars.spotifyClientId}:${vars.spotifyClientSecret}`
  ).toString("base64");

  try {
    const response = await axios.post(
      tokenUrl,
      "grant_type=client_credentials",
      {
        headers: {
          Authorization: `Basic ${authString}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    if (response.data && response.data.access_token) {
      return response.data.access_token;
    } else {
      throw new Error("No access token returned from Spotify");
    }
  } catch (error) {
    console.error("Error fetching Spotify access token:", error.message);
    return null;
  }
}

async function getSpotifyAlbumCover(artist, title) {
  const accessToken = await getSpotifyAccessToken();
  if (!accessToken) return null;

  const searchUrl = `https://api.spotify.com/v1/search?q=artist:${encodeURIComponent(
    artist
  )}%20track:${encodeURIComponent(title)}&type=track&limit=1`;

  try {
    const response = await axios.get(searchUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const track = response.data.tracks.items[0] || null;
    if (track && track.album && track.album.images.length > 0) {
      const fullUrl = track.album.images[0]?.url || null;

      const imageId = fullUrl?.split("/").pop().split(".")[0] || null;

      return { imageId, fullUrl };
    }

    return { imageId: null, fullUrl: null };
  } catch (error) {
    return { imageId: null, fullUrl: null };
  }
}

async function getRobloxGame(cookie) {
    try {
        const userResponse = await axios.get("https://users.roblox.com/v1/users/authenticated", {
            headers: { "Cookie": `.ROBLOSECURITY=${cookie}` },
            httpsAgent
        });

        const userId = userResponse.data.id;

        const presenceResponse = await axios.post(
            "https://presence.roblox.com/v1/presence/users",
            { userIds: [userId] },
            { headers: { "Cookie": `.ROBLOSECURITY=${cookie}`, "Content-Type": "application/json" } },
            { httpsAgent }
        );

        const userPresence = presenceResponse.data.userPresences[0];

        if (userPresence && userPresence.userPresenceType === 2) {
            const gameName = userPresence.lastLocation || "Playing Roblox";
            const placeId = userPresence.placeId;
            const jobId = userPresence.gameInstanceId;

            const joinLink = `roblox://placeId=${placeId}&gameInstanceId=${jobId}`;

            return {
                gameName,
                placeId,
                jobId,
                joinLink
            };
        } else {
            return {
                gameName: "Not playing Roblox",
                placeId: null,
                jobId: null,
                joinLink: null
            };
        }
    } catch (error) {
        console.error("Error fetching Roblox game info:", error);
        return {
            gameName: "Error fetching data",
            placeId: null,
            jobId: null,
            joinLink: null
        };
    }
}