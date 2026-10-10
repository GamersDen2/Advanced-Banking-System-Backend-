const express = require('express');
const transactionController = require('../controllers/transaction.controller');
const authMiddlewares = require('../middleware/auth.middleware');

const router = express.Router();

/**
 * - POST /api/transactions/
 * - Create new Transaction
 * - Protected Route
  */
 router.post("/", authMiddlewares.authUserMiddleware, transactionController.createTransaction);
 /**
  * - POST /api/transactions/system/initial-fund
  * - Add initial fund to user account from system account.
  * - Protected Route
   */
 router.post("/system/initial-fund", authMiddlewares.authSystemUserMiddleware, transactionController.createInitialFundTransaction);

module.exports = router;