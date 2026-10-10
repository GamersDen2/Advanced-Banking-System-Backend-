const userModel = require("../models/user.model");
const jwt = require("jsonwebtoken");
const tokenBlacklistService = require("../services/tokenBlacklist.service");

async function authUserMiddleware(req, res, next) {
  const token = req.cookies.token || req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Unauthorized: No token provided" });
  }

  try {
    const decoded = await jwt.verify(token, process.env.JWT_SECRET);
    if (await tokenBlacklistService.isTokenBlacklisted(token)) {
      return res.status(401).json({ message: "Unauthorized: Token has been revoked" });
    }

    const user = await userModel.findById(decoded.userId);

    req.user = user;
    req.token = token;
    req.tokenExpiresAt = new Date(decoded.exp * 1000);
    next();
  } catch (error) {
    return res.status(401).json({ message: "Unauthorized: Invalid token" });
  }
}

async function authSystemUserMiddleware(req, res, next) {
  const token = req.cookies.token || req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Unauthorized: No token provided" });
  }

  try {
    const decoded = await jwt.verify(token, process.env.JWT_SECRET);
    if (await tokenBlacklistService.isTokenBlacklisted(token)) {
      return res.status(401).json({ message: "Unauthorized: Token has been revoked" });
    }

    const user = await userModel.findById(decoded.userId).select("+systemUser");

    if (!user.systemUser) {
      return res.status(403).json({ message: "Forbidden: Access is denied" });
    }
    req.user = user;
    req.token = token;
    req.tokenExpiresAt = new Date(decoded.exp * 1000);
    next();
  } catch (error) {
    return res.status(401).json({ message: "Unauthorized: Invalid token" });
  }
}

module.exports = { authUserMiddleware, authSystemUserMiddleware };
