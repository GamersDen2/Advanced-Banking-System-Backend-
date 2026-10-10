const crypto = require("crypto");
const blacklistedTokenModel = require("../models/blacklistedToken.model");

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

async function isTokenBlacklisted(token) {
  return Boolean(
    await blacklistedTokenModel.exists({
      tokenHash: hashToken(token),
      expiresAt: { $gt: new Date() },
    }),
  );
}

async function blacklistToken(token, expiresAt) {
  await blacklistedTokenModel.create({
    tokenHash: hashToken(token),
    expiresAt,
  });
}

module.exports = { isTokenBlacklisted, blacklistToken };
