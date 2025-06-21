const { Schema, model } = require("mongoose");

const mimicSchema = new Schema({
  userId: { type: String, required: true, unique: true },
  mimic: { type: Boolean, required: true },
});

module.exports = model("Mimic", mimicSchema);
