// AutoReactions model update
const mongoose = require("mongoose");

const autoReactionsSchema = new mongoose.Schema({
  users: [
    {
      user: String,
      channels: [String],
      reactions: [String],
      multiReact: {
        type: Boolean,
        default: false,
      },
    },
  ],
  channels: [String],
});

module.exports = mongoose.model("AutoReactions", autoReactionsSchema);
