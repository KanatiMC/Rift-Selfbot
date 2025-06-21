const { Client, Message } = require("discord.js-selfbot-v13");
const Config = require("../../models/Config");
const config = require('../../data/config');
const axios = require('axios');

module.exports = {
  name: "richpresence",
  description: "manage the rpc",
  aliases: ["rpc"],
  syntax: "<start|stop|btn|type|img|mode> <args>",

  /**
   *
   * @param {Client} client
   * @param {Message} message
   */
  run: async (client, message, args) => {
    if (!args.length) {
      return message?.reply(
        "`WARNING`\n-# You need to specify a subcommand. Subcommands: `start`, `stop`, `btn`, `type`, `img`, `mode`"
      );
    }

    const subcommand = args[0].toLowerCase();

    if (subcommand === "btn") {
      if (args.length < 2) {
        return message?.reply(
          "`USAGE`\n-# Use: `rpc btn <buttonNumber> <text|disable> [link]`"
        );
      }

      const buttonNumber = args[1];
      if (!["1", "2"].includes(buttonNumber)) {
        return message?.reply("You must specify button `1` or `2`.");
      }

      let buttonKey = buttonNumber === "1" ? "buttonOne" : "buttonTwo";
      let userStatus = await Config.findOne({
        customPrefix: client.configCache.customPrefix,
      });
      if (!userStatus) {
        userStatus = new Config();
      }

      if (args[2].toLowerCase() === "disable") {
        userStatus[buttonKey] = { name: null, link: null };
        await userStatus.save();
        client.configCache[buttonKey] = null;
        return message?.reply(
          `\`SUCCESS\`\n-# Button ${buttonNumber} has been disabled and will not appear in the RPC.`
        );
      }

      const buttonText = args[2];
      let buttonLink = args.slice(3).join(" ");

      if (
        buttonLink &&
        !buttonLink.startsWith("http://") &&
        !buttonLink.startsWith("https://")
      ) {
        buttonLink = `https://${buttonLink}`;
      }

      userStatus[buttonKey] = {
        name: buttonText,
        link: buttonLink,
      };
      await userStatus.save();

      client.configCache[buttonKey] = {
        name: buttonText,
        link: buttonLink,
      };

      return message?.reply(
        `\`SUCCESS\`\n-# Button ${buttonNumber} updated\n-# **Name**: \`${buttonText}\`\n-# **Link**: \`${buttonLink}\``
      );
    } else if (subcommand === "start") {
      if (!client.rpcEnabled) {
        client.rpcEnabled = true;
        client.emit("rpcStart");
        return message?.reply("`SUCCESS`\n-# RPC system has been enabled.");
      } else {
        return message?.reply("`WARNING`\n-# RPC system is already running.");
      }
    } else if (subcommand === "stop") {
      if (client.rpcEnabled) {
        client.rpcEnabled = false;
        client.emit("rpcStop");
        return message?.reply("`SUCCESS`\n-# RPC system has been disabled.");
      } else {
        return message?.reply("`WARNING`\n-# RPC system is already disabled.");
      }
    } else if (subcommand === "type") {
      if (args.length < 2) {
        return message?.reply(
          "`USAGE`\n-# Use: `rpc type <streaming|watching|listening|playing>`"
        );
      }

      const validTypes = {
        streaming: "STREAMING",
        watching: "WATCHING",
        listening: "LISTENING",
        playing: "PLAYING",
      };

      const selectedType = args[1].toLowerCase();
      const rpcType = validTypes[selectedType];

      if (!rpcType) {
        return message?.reply(
          "`ERROR`\n-# Invalid type. Available types: `streaming`, `watching`, `listening`, `playing`."
        );
      }

      let userStatus = await Config.findOne({
        customPrefix: client.configCache.customPrefix,
      });
      if (!userStatus) {
        userStatus = new Config();
      }

      userStatus.rpcType = rpcType;
      await userStatus.save();

      client.configCache.rpcType = rpcType;

      return message?.reply(
        `\`SUCCESS\`\n-# RPC type has been updated.\n-# **Type**: \`${rpcType}\``
      );
    } else if (subcommand === "img") {
      if (!message.attachments.size) {
        return message?.reply(
          "`WARNING`\n-# You must attach an image file (`.gif`, `.png`, `.jpeg`, `.jpg`) to use this command."
        );
      }

      const attachment = message.attachments.first();
      const validExtensions = [".gif", ".png", ".jpeg", ".jpg"];
      const fileExtension = attachment.url
        .split("?")[0]
        .substring(attachment.url.lastIndexOf("."))
        .toLowerCase();

      if (!validExtensions.includes(fileExtension)) {
        return message?.reply(
          "`ERROR`\n-# Invalid file type. Allowed extensions: `.gif`, `.png`, `.jpeg`, `.jpg`."
        );
      }

      let userStatus = await Config.findOne({
        customPrefix: client.configCache.customPrefix,
      });
      if (!userStatus) {
        userStatus = new Config();
      }

      const imageUrl = attachment.url;

      userStatus.imageUrl = imageUrl;
      await userStatus.save();

      client.configCache.imageUrl = imageUrl;

      return message?.reply(
        `\`SUCCESS\`\n-# RPC image has been updated.\n-# **URL**: \`${imageUrl}\``
      );
    } else if (subcommand === "mode") {
      if (args.length < 2) {
        return message?.reply("`USAGE`\n-# Use: `rpc mode <basic|advanced>`");
      }

      const selectedMode = args[1].toLowerCase();
      if (!["basic", "advanced"].includes(selectedMode)) {
        return message?.reply(
          "`ERROR`\n-# Invalid mode. Available modes: `basic`, `advanced`."
        );
      }

      let userStatus = await Config.findOne({
        customPrefix: client.configCache.customPrefix,
      });
      if (!userStatus) {
        userStatus = new Config();
      }

      userStatus.rpc = selectedMode;
      await userStatus.save();

      client.configCache.rpc = selectedMode;

      return message?.reply(
        `\`SUCCESS\`\n-# RPC mode has been updated.\n-# **Mode**: \`${selectedMode}\``
      );
    } else {
      return message?.reply(
        "`WARNING`\n-# Unknown subcommand. Available subcommands: `start`, `stop`, `btn`, `type`, `img`, `mode`."
      );
    }
  },
};
