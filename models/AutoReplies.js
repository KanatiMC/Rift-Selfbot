const { Schema, model } = require("mongoose");

const autoReplySchema = new Schema({
  userId: { type: String, required: true },
  content: { type: String, required: false },
});

module.exports = model("AutoReply", autoReplySchema);
