const accountModel = require("../models/account.model");

async function createAccount(req, res) {
  const user = req.user;

  const newAccount = await accountModel.create({ user: user._id });

  res
    .status(201)
    .json({ message: "Account created successfully", account: newAccount });
}

async function getUserAccounts(req, res) {
  const accounts = await accountModel.find({
    user: req.user._id,
  });

  res.status(200).json({
    message: "User Accounts fetched",
    accounts: accounts,
  });
}

async function getAccountBalance(req, res) {
    const accountId = req.params.accountId

    const account = await accountModel.findOne({
        _id: accountId,
        user: req.user.id
    });

    if (!account) {
        return res.status(404).json({
            message: "Account not found"
        });
    }

    const accountBalance = await account.getBalance();

    res.status(200).json({
        message: "Got Account Balance",
        account: accountId,
        balance: accountBalance
    })
}

module.exports = { createAccount, getUserAccounts, getAccountBalance };
