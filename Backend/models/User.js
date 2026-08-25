const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: false,
    },

    googleId: {
      type: String,
      unique: true,
      sparse: true,
    },

    profileImage: {
      type: String,
      default: "",
    },

    role: {
      type: String,
      enum: ["student", "faculty", "admin"],
      default: "student",
    },
  },
  {
    timestamps: true,
  },
);

const User = mongoose.model("User", userSchema);

module.exports = User;
