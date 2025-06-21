const { Schema, model } = require("mongoose");

const todoSchema = new Schema({
  item: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  done: { type: Boolean, default: false },
  doneTimestamp: { type: Date },
});

module.exports = model("ToDo", todoSchema);
