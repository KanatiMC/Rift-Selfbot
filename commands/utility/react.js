const { Client, Message } = require("discord.js-selfbot-v13");
const AutoReactions = require("../../models/AutoReactions");

module.exports = {
  name: "react",
  description: "auto react system",
  aliases: ["r", "reaction", "reactions"],
  syntax: "<add|stop|rmv|list|trigger> [user] [emojis|nomask|multiReact]",

  /**
   *
   * @param {Client} client
   * @param {Message} message
   */
  run: async (client, message, args) => {
    try {
      if (args.length === 0) {
        return message?.reply(
          "`WARNING`\n-# You need to specify a subcommand (`add`, `rmv`, `end`, `list`, `trigger`)"
        );
      }

      const subCommand = args[0].toLowerCase();
      if (!["add", "a", "rmv", "r", "end", "e", "list", "l", "trigger", "t"].includes(subCommand)) {
        return message?.reply(
          "`WARNING`\n-# Invalid subcommand. Use `add`, `rmv`, `end`, `list`, `trigger`."
        );
      }

      let userIdentifier;
      const mentionedUser = message.mentions.users.first();
      const showFull = args.includes("nomask");
      const multiReact = args.includes("-multi");

      args = args.filter((arg) => !["nomask", "-multi"].includes(arg));

      if (mentionedUser) {
        userIdentifier = mentionedUser.id;
        args.splice(1, 1);
      } else if (args[1] && !["list", "trigger"].includes(subCommand)) {
        userIdentifier = args[1];

        if (/^\d{16,23}$/.test(userIdentifier)) {
          args.splice(1, 1);
        } else {
          const userObj = client.users.cache.find(
            (user) => user.username === userIdentifier
          );
          if (userObj) {
            userIdentifier = userObj.id;
            args.splice(1, 1);
          } else {
            return message?.reply(
              `\`WARNING\`\n-# Could not find a user with the username \`${userIdentifier}\` in the client cache.`
            );
          }
        }
      }

      if (subCommand === "add" || subCommand === "a" || subCommand === "rmv" || subCommand === "r") {
        if (args.length < 2) {
          return message?.reply("`WARNING`\n-# You need to include at least one reaction.");
        }

        let reactionArray = args.slice(1).map((arg) => {
          const match = arg.match(/<(a?):\w+:(\d{16,23})>/);
          return match ? match[2] : arg;
        });

        reactionArray = reactionArray.filter((reaction) => reaction !== null);

        if (reactionArray.length === 0) {
          return message?.reply("`WARNING`\nNo valid reaction(s) provided.");
        }

        const isRemove = subCommand === "rmv" || subCommand === "r";
        await handleAutoReaction(client, userIdentifier, reactionArray, isRemove, multiReact).then(() => {
          message?.react("✅");
        });
      } else if (subCommand === "end" || subCommand === "e") {
        await removeAutoReaction(client, userIdentifier).then(() => {
          message?.react("✅");
        });
      } else if (subCommand === "list" || subCommand === "l") {
        await listAutoReactions(client, message, userIdentifier, showFull);
      } else if (subCommand === "trigger" || subCommand === "t") {
        if (!userIdentifier) {
          await toggleGlobalReactions(client, message);
        } else {
          await toggleUserReactions(client, message, userIdentifier);
        }
      }
    } catch (err) {
      message?.reply("`ERROR`\n-# An error occurred while processing the react command.");
      console.error("Error in react command:", err);
    }
  },
};

async function handleAutoReaction(client, identifier, reactionArray, isRemove, multiReact = false) {
  try {
    let reactionCache = client.reactionCache;
    let userId = identifier;

    if (!/^\d+$/.test(identifier)) {
      const userObj = client.users.cache.find(
        (user) => user.username === identifier || `<@${user.id}>` === identifier
      );

      if (userObj) {
        userId = userObj.id;
      } else {
        return console.error(
          `User "${identifier}" not found in the client cache.`
        );
      }
    }

    let userReactionEntry = await AutoReactions.findOne({
      "users.user": userId,
    });

    if (!userReactionEntry) {
      userReactionEntry = new AutoReactions({
        users: [{ user: userId, channels: [], reactions: [], multiReact }],
        channels: [],
      });
    }

    const userIndex = userReactionEntry.users.findIndex(
      (usr) => usr.user === userId
    );

    if (userIndex !== -1) {
      // Update reactions
      reactionArray.forEach((reaction) => {
        if (isRemove) {
          userReactionEntry.users[userIndex].reactions = userReactionEntry.users[userIndex].reactions.filter(
            (existingReaction) => existingReaction !== reaction
          );
        } else if (
          !userReactionEntry.users[userIndex].reactions.includes(reaction)
        ) {
          userReactionEntry.users[userIndex].reactions.push(reaction);
        }
      });

      // Update multiReact setting
      userReactionEntry.users[userIndex].multiReact = multiReact;
    } else if (!isRemove) {
      reactionArray.forEach((reaction) => {
        userReactionEntry.users.push({
          user: userId,
          channels: [],
          reactions: [reaction],
          multiReact,
        });
      });
    }

    await userReactionEntry.save();

    // Update reactionCache
    const cacheUserIndex = reactionCache.users.findIndex(
      (usr) => usr.user === userId
    );

    if (cacheUserIndex !== -1) {
      if (isRemove) {
        reactionCache.users[cacheUserIndex].reactions = reactionCache.users[cacheUserIndex].reactions.filter(
          (reaction) => !reactionArray.includes(reaction)
        );
      } else {
        reactionCache.users[cacheUserIndex].reactions = [
          ...new Set([
            ...reactionCache.users[cacheUserIndex].reactions,
            ...reactionArray,
          ]),
        ];
        reactionCache.users[cacheUserIndex].multiReact = multiReact;
      }
    } else if (!isRemove) {
      reactionCache.users.push({
        user: userId,
        channels: [],
        reactions: [...reactionArray],
        multiReact,
      });
    }
  } catch (err) {
    console.error("Error handling auto reactions:", err);
  }
}

async function removeAutoReaction(client, identifier) {
  try {
    let reactionCache = client.reactionCache;
    let userId = identifier;

    const userReactionEntry = await AutoReactions.findOne({
      "users.user": userId,
    });

    if (!userReactionEntry) {
      return console.error(`User "${userId}" has no reactions to remove.`);
    }

    const userIndex = userReactionEntry.users.findIndex(
      (record) => record.user === userId
    );

    if (userIndex !== -1) {
      userReactionEntry.users.splice(userIndex, 1);

      const cacheIndex = reactionCache.users.findIndex(
        (usr) => usr.user === userId
      );
      if (cacheIndex !== -1) {
        reactionCache.users.splice(cacheIndex, 1);
      }

      await AutoReactions.deleteOne({ "users.user": userId });

      return true;
    } else {
      return false;
    }
  } catch (err) {
    console.error("Error removing auto reactions:", err);
  }
}

async function listAutoReactions(client, message, userIdentifier = null, showFull = false) {
  try {
    let reactionCache = client.reactionCache;
    if (
      !reactionCache ||
      !reactionCache.users ||
      reactionCache.users.length === 0
    ) {
      return message?.reply("\`WARNING\`\n-# No auto-reaction users found.");
    }

    let reactionsList = ``;

    const usersToDisplay = userIdentifier
      ? reactionCache.users.filter((user) => user.user === userIdentifier)
      : reactionCache.users;

    if (usersToDisplay.length === 0) {
      return message?.reply(
        `\`WARNING\`\n-# No auto-reaction data found for user: \`${userIdentifier}\``
      );
    }

    usersToDisplay.forEach((user) => {
      const userObj = client.users.cache.get(user.user);
      const username = userObj ? userObj.username : `Unknown (${user.user})`;

      const displayedUsername = showFull
        ? username
        : maskUsername(username);

      let userReactions = user.reactions
        .map(
          (reaction) => client.emojis.cache.get(reaction) || `\`${reaction}\``
        )
        .join(" ");
      reactionsList += `\`${displayedUsername}\` => ${userReactions || "None"}\n`;
    });

    message?.reply(
      reactionsList || "\`WARNING\`\n-# No auto-reaction users found."
    );
  } catch (err) {
    console.error("Error listing auto-reaction users:", err);
    message?.reply(
      "`ERROR`\n-# An error occurred while fetching the auto-reaction users."
    );
  }
}

async function toggleGlobalReactions(client, message) {
  client.reactionsPaused = !client.reactionsPaused;
  let emoji = client.reactionsPaused ? "⏸" : "▶";
  message?.react(emoji);
}

async function toggleUserReactions(client, message, userId) {
  try {
    let userReactionsPaused = client.userReactionsPaused || {};
    if (!userReactionsPaused[userId]) {
      userReactionsPaused[userId] = true;
      message?.react("⏸");
    } else {
      userReactionsPaused[userId] = false;
      message?.react("▶");
    }
    client.userReactionsPaused = userReactionsPaused;
  } catch (err) {
    console.error("Error toggling user reactions:", err);
  }
}

function maskUsername(username) {
  if (username.length <= 2) {
    return username;
  }
  return `${username[0]}${'*'.repeat(username.length - 2)}${username[username.length - 1]}`;
}
