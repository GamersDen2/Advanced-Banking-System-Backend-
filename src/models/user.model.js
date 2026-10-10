const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, "Email is required for creating a user."],
      unique: true,
      trim: true,
      lowercase: true,
      match: [
        /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
        "Please fill a valid email address",
      ],
    },
    username: {
      type: String,
      required: [true, "Username is required for creating a user."],
      unique: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required for creating a user."],
      required: true,
      minlength: 6,
      select: false, // Exclude password from query results by default
    },
    systemUser: {
      type: Boolean,
      default: false,
      immutable: true, // Prevent updates to this field after creation
      select: false, // Exclude systemUser from query results by default
    }
  },
  {
    timestamps: true, // Automatically add createdAt and updatedAt fields
  },
);

userSchema.pre("save", async function () {
  if (!this.isModified("password")) {
    return;
  }
  this.password = await bcrypt.hash(this.password, 10);
  return;
});

userSchema.methods.comparePassword = async function (password) {
  return await bcrypt.compare(password, this.password);
}

const userModel = mongoose.model("User", userSchema);

module.exports = userModel;