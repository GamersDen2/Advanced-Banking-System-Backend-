const mongoose = require("mongoose");

const ledgerSchema = new mongoose.Schema({
    account:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Account",
        required: [true, "Ledger must be associated with an account"],
        index: true,
        immutable: true
    },
    amount:{
        type: Number,
        required: [true, "Amount is required"],
        min: [0, "Amount cannot be negative"]
    },
    transaction:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Transaction",
        required: [true, "Ledger must be associated with a transaction"],
        index: true,
        immutable: true
    },
    type: {
        type: String,
        enum: {
            values: ["CREDIT", "DEBIT"],
            message: "Type must be either CREDIT or DEBIT",
        },
        required: [true, "Type is required"],
        immutable: true
    }
});

function preventLedgerModification(next) {
    throw new Error("Ledger entries cannot be modified or deleted");
}

// Prevent any modifications or deletions to ledger entries
ledgerSchema.pre("findOneAndUpdate", preventLedgerModification);
ledgerSchema.pre("findOneAndReplace", preventLedgerModification);
ledgerSchema.pre("findOneAndDelete", preventLedgerModification);
ledgerSchema.pre("updateOne", preventLedgerModification);
ledgerSchema.pre("deleteOne", preventLedgerModification);
ledgerSchema.pre("updateMany", preventLedgerModification);
ledgerSchema.pre("deleteMany", preventLedgerModification);
ledgerSchema.pre("remove", preventLedgerModification);

const ledgerModel = mongoose.model("Ledger", ledgerSchema);

module.exports = ledgerModel;