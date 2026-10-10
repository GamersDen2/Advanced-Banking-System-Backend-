const userModel = require("../models/user.model");
const jwt = require("jsonwebtoken");
const emailService = require("../services/email.service");
const tokenBlacklistService = require("../services/tokenBlacklist.service");

/**
 * - Register User Controller
 * - POST /api/auth/register
 */
async function registerUserController(req, res) {
  const { username, email, password } = req.body;

  const isEmailExist = await userModel.findOne({ email });
  if (isEmailExist) {
    return res
      .status(422)
      .json({ message: "Email already exists", status: "Failed" });
  }

  const newUser = await userModel.create({ username, email, password });
  const token = jwt.sign({ userId: newUser._id }, process.env.JWT_SECRET, {
    expiresIn: "3d",
  });

  res.cookie("token", token);

  
  res.status(201).json({
    message: "User registered successfully",
    user: {
      id: newUser._id,
      username: newUser.username,
      email: newUser.email,
    },
  });
  
  // Send registration email
  try {
    await emailService.sendRegisterEmail(newUser.email, newUser.username);
  } catch (error) {
    console.log("Error sending registration email:", error);
  }
}

/**
 * - User Login Controller
 * - POST /api/auth/login 
 */
async function loginUserController (req, res) {
  const {email, password} = req.body;

  const user = await userModel.findOne({
    email
  }).select("+password");

  if(!user){
    return res.status(401).json({
      message: "User does not exist, or Email is incorrect."
    })
  }

  const isPasswordValid = await user.comparePassword(password);

  if (!isPasswordValid) {
    return res.status(401).json({
      message: "Password is incorrect."
    })
  }
  
  const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
    expiresIn: "3d",
  });

  res.cookie("token", token);

  res.status(200).json({
    message: "User login successful",
    user: {
      id: user._id,
      username: user.username,
      email: user.email,
    },
  });
}

async function logoutUserController(req, res) {
  try {
    await tokenBlacklistService.blacklistToken(req.token, req.tokenExpiresAt);
  } catch (error) {
    console.error("Logout failed:", error);
    return res.status(500).json({ message: "Logout failed" });
  }

  res.clearCookie("token");
  return res.status(200).json({ message: "User logged out successfully" });
}

module.exports = {
  registerUserController,
  loginUserController,
  logoutUserController
};