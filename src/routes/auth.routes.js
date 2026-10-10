const express = require("express");
const authController = require("../controllers/auth.controller");
const { authUserMiddleware } = require("../middleware/auth.middleware");

const router = express.Router();

router.post("/register", authController.registerUserController);
router.post("/login", authController.loginUserController);
router.post("/logout", authUserMiddleware, authController.logoutUserController);

module.exports = router;