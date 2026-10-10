const mongoose = require("mongoose");

const blacklistedTokenSchema = new mongoose.Schema({
  tokenHash: {
    type: String,
    required: true,
    unique: true,
  },
  expiresAt: {
    type: Date,
    required: true,
    expires: 0,
  },
});

module.exports = mongoose.model("BlacklistedToken", blacklistedTokenSchema);
