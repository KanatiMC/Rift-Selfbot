const { Client, Message } = require("discord.js-selfbot-v13");
const ToDo = require("../../models/ToDo");

module.exports = {
  name: "todo",
  description: "todo system",
  aliases: ["td"],
  syntax: "td <add|rmv|done|undo|list> <item/index>",
  /**
   *
   * @param {Client} client
   * @param {Message} message
   */

  run: async (client, message, args) => {
    if (
      (args[0] && (args[0] === "list" || args[0] === "l") && args.length < 1) || 
      (args[0] && !(args[0] === "list" || args[0] === "l") && args.length < 2)
    ) { 
      return message?.reply(
        `Invalid command usage\n-# Arguments: \`<add|rmv|done|undo|list> <item/index>\`.`
      );
    }

    const action = args[0].toLowerCase();
    const item = args.slice(1).join(" ");

    if (action === "add" || action === "a") {
      try {
        const newTodo = new ToDo({ item });
        await newTodo.save();
        message?.reply(`\`TODO ADDED\`\n-# ${item}`);
      }
      catch (err) {
        console.error("Error removing todo:", err);
        message?.reply(
          "\`ERROR\`\n-# An error occurred while trying to add the specified todo."
        );
      }
    } else if (action === "remove" || action === "rmv" || action === "r") {
      try {
        const identifier = args[1];
        const todoType = identifier[0].toLowerCase();
        const index = parseInt(identifier.slice(1)) - 1;

        if (isNaN(index)) {
          return message?.reply(
            `\`WARNING\`\-# Please use the format \`o<number>\` for ongoing todos or \`d<number>\` for done todos.`
          );
        }

        let todos, typeDescription;
        if (todoType === "o") {
          todos = await ToDo.find({ done: false });
          typeDescription = "ongoing";
        } else if (todoType === "d") {
          todos = await ToDo.find({ done: true });
          typeDescription = "completed";
        } else {
          return message?.reply(
            `\`WARNING\`\-# Please use the format \`o<number>\` for ongoing todos or \`d<number>\` for done todos.`
          );
        }

        if (index < 0 || index >= todos.length) {
          return message?.reply(
            `\`WARNING\`\-# The specified index \"${identifier}\" is out of range for **${typeDescription} todos**.`
          );
        }

        const todoToRemove = todos[index];
        await ToDo.deleteOne({ _id: todoToRemove._id });

        message?.reply(
          `\`TODO REMOVED\`\n-# ${todoToRemove.item}`
        );
      } catch (err) {
        console.error("Error removing todo:", err);
        message?.reply(
          "\`ERROR\`\n-# An error occurred while trying to remove the specified todo."
        );
      }
    } else if (action === "done" || action === "d") {
      const index = parseInt(args[1]) - 1;
      if (isNaN(index)) {
        return message?.reply(
          "\`WARNING\`\n-# Please specify a valid to-do number to mark as done."
        );
      }
      const todoToMarkDone = await ToDo.find().skip(index).limit(1);
      if (!todoToMarkDone.length) {
        return message?.reply("\`WARNING\`\n-# No to-do found at that index.");
      }

      todoToMarkDone[0].done = true;
      todoToMarkDone[0].doneTimestamp = new Date();
      await todoToMarkDone[0].save();
      message?.reply(`\`FINISHED TODO\`\n-# ${todoToMarkDone[0].item}`);
    } else if (action === "undo" || action === "u") {
      const index = parseInt(args[1]) - 1;
      if (isNaN(index)) {
        return message?.reply("\`WARNING\`\n-# Please specify a valid to-do number to undo.");
      }
      const todoToUndo = await ToDo.find().skip(index).limit(1);
      if (!todoToUndo.length) {
        return message?.reply("\`WARNING\`\n-# No to-do found at that index.");
      }

      if (!todoToUndo[0].done) {
        return message?.reply(
          `\`WARNING\`\n-# This todo is already an ongoing to-do.`
        );
      }

      todoToUndo[0].done = false;
      todoToUndo[0].doneTimestamp = null;
      await todoToUndo[0].save();
      message?.reply(`\`RESTORED TODO\`\n-# ${todoToUndo[0].item}`);
    } else if (action === "list" || action === "l") {
      const ongoingTodos = await ToDo.find({ done: false });
      const completedTodos = await ToDo.find({ done: true });
  
      let response = "";
  
      if (ongoingTodos.length === 0) {
        response += "**Ongoing To-Dos:** *none*\n";
      } else {
        response += "**Ongoing To-Dos:**\n";
        ongoingTodos.forEach((todo, index) => {
          response += `-# \`${index + 1}.\` *${todo.item}* [added <t:${Math.floor(
            todo.timestamp.getTime() / 1000
          )}:R>]\n`;
        });
      }
  
      if (completedTodos.length === 0) {
        response += "**Completed To-Dos**: *none*\n";
      } else {
        response += "\n**Completed To-Dos:**\n";
        completedTodos.forEach((todo, index) => {
          response += `-# \`${index + 1}.\` *${
            todo.item
          }* [completed <t:${Math.floor(
            todo.doneTimestamp.getTime() / 1000
          )}:R>]\n`;
        });
      }
  
      message?.reply(response);
    } else {
      message?.reply("\`WARNING\`\n-# Invalid action provided! Valid actions: `add`, `rmv`, `done`, `undo` or `list`");
    }
  },
};
