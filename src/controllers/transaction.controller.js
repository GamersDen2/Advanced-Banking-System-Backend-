const mongoose = require("mongoose");
const accountModel = require("../models/account.model");
const transactionModel = require("../models/transaction.model");
const ledgerModel = require("../models/ledger.model");
const emailService = require("../services/email.service");

/**
 * * - Create a new transaction
 * - THE 10-STEP TRANSFER FLOW:
 * 1. Validate request
 * 2. Validate idempotency key
 * 3. Check account status
 * 4. Derive sender balance from ledger
 * 5. Create transaction (PENDING)
 * 6. Create DEBIT ledger entry
 * 7. Create CREDIT ledger entry
 * 8. Mark transaction COMPLETED
 * 9. Commit MongoDB session
 * 10. Send email notification
 */
async function createTransaction(req, res) {
  const { fromAccount, toAccount, idempotencyKey } = req.body;
  const amount = Number(req.body.amount);

  if (
    !fromAccount ||
    !toAccount ||
    !idempotencyKey ||
    !Number.isFinite(amount) ||
    amount <= 0
  ) {
    return res.status(400).json({ message: "Invalid or missing fields" });
  }

  if (fromAccount === toAccount) {
    return res.status(400).json({ message: "Accounts must be different" });
  }

  const existingTransaction = await transactionModel.findOne({ idempotencyKey });
  if (existingTransaction) {
    return res.status(409).json({
      message: `Transaction is ${existingTransaction.status.toLowerCase()}`,
      transaction: existingTransaction,
    });
  }

  // Ensure the authenticated user owns the sending account.
  const fromUserAccount = await accountModel.findOne({
    _id: fromAccount,
    user: req.user._id,
  });
  const toUserAccount = await accountModel.findById(toAccount);

  if (!fromUserAccount || !toUserAccount) {
    return res.status(400).json({ message: "One or both accounts are invalid" });
  }

  if (
    fromUserAccount.status !== "ACTIVE" ||
    toUserAccount.status !== "ACTIVE"
  ) {
    return res.status(400).json({ message: "One or both accounts are not active" });
  }

  const senderBalance = await fromUserAccount.getBalance();
  if (senderBalance < amount) {
    return res.status(400).json({
      message: `Insufficient balance, current balance: ${senderBalance}`,
    });
  }

  const session = await mongoose.startSession();
  let transaction;

  try {
    session.startTransaction();

    // create() requires an array when passing options such as { session }.
    [transaction] = await transactionModel.create(
      [{
        fromAccount,
        toAccount,
        amount,
        idempotencyKey,
        status: "PENDING",
      }],
      { session },
    );

    await ledgerModel.create(
      [{
        account: fromAccount,
        type: "DEBIT",
        amount,
        transaction: transaction._id,
      }],
      { session },
    );

    await ledgerModel.create(
      [{
        account: toAccount,
        type: "CREDIT",
        amount,
        transaction: transaction._id,
      }],
      { session },
    );

    transaction.status = "COMPLETED";
    await transaction.save({ session });

    await session.commitTransaction();
  } catch (error) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }

    if (error.code === 11000) {
      return res.status(409).json({
        message: "This idempotency key has already been used",
      });
    }

    console.error("Transaction failed:", error);
    return res.status(500).json({ message: "Transaction failed" });
  } finally {
    await session.endSession();
  }

  return res.status(201).json({
    message: "Transaction completed",
    transaction,
  });

  // Email failure must not make a committed transfer appear to have failed.
  try {
    await emailService.sendTransactionEmail(
      req.user.email,
      req.user.username,
      amount,
      toAccount,
    );
  } catch (error) {
    console.error("Transaction email failed:", error);
  }

}

async function createInitialFundTransaction(req, res) {
  const { toAccount, amount, idempotencyKey } = req.body;

  if (!(toAccount && amount && idempotencyKey)) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  const toUserAccount = await accountModel.findOne({ _id: toAccount });

  if (!toUserAccount) {
    return res.status(400).json({ message: "Invalid account" });
  }

  const fromAccount = await accountModel.findOne({
    user: req.user._id,
  });

  if (!fromAccount) {
    return res.status(400).json({ message: "System user account not found" });
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  const transaction = new transactionModel({
    fromAccount: fromAccount.id,
    toAccount,
    amount,
    idempotencyKey,
    status: "PENDING",
  });

  /* Create DEBIT ledger entry */
  const debitLedgerEntry = await ledgerModel.create(
    [
      {
        account: fromAccount,
        type: "DEBIT",
        amount,
        transaction: transaction._id,
      },
    ],
    { session },
  );

  /* Create CREDIT ledger entry */
  const creditLedgerEntry = await ledgerModel.create(
    [
      {
        account: toAccount,
        type: "CREDIT",
        amount,
        transaction: transaction._id,
      },
    ],
    { session },
  );

  transaction.status = "COMPLETED";
  await transaction.save({ session });

  await session.commitTransaction();
  await session.endSession();

  return res.status(201).json({
    message: "",
    transaction,
  });
}

module.exports = {
  createTransaction,
  createInitialFundTransaction,
};
