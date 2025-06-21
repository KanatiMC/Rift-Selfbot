const { Schema, model } = require("mongoose");

const configSchema = new Schema({
  customPrefix: { type: String, default: ";" },
  rpc: { type: String, default: "basic" },
  rpcType: { type: String, default: "STREAMING" },
  defaultStatus: { type: String, default: null },
  imageUrl: { type: String, default: null },
  defaultLink: { type: String, default: null },
  afkStatus: { type: String, default: null },
  afkStartTime: { type: Date, default: null },
  quotes: { type: [String], default: [] },
  buttonOne: {
    name: { type: String, default: null },
    link: { type: String, default: null },
  },
  buttonTwo: {
    name: { type: String, default: null },
    link: { type: String, default: null },
  }
});

module.exports = model("Config", configSchema);
