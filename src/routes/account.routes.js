const express = require("express");
const authMiddleware = require("../middleware/auth.middleware");
const accountController = require("../controllers/account.controller");

const router = express.Router();

/**
 * - POST /api/accounts/
 * - Create new Account
 * - Protected Route
 */
router.post("/", authMiddleware.authUserMiddleware, accountController.createAccount);
/**
 * - GET /api/accounts/
 * - Get all Accounts
 * - Protected Route
 */
router.get("/", authMiddleware.authUserMiddleware, accountController.getUserAccounts);
/**
 * - GET /api/accounts/balance/accountId
 * - Get Account Balance
 * - Protected Route
 */
router.get("/balance/:accountId", authMiddleware.authUserMiddleware, accountController.getAccountBalance);

module.exports = router;
