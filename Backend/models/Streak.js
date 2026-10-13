const mongoose = require("mongoose");

const streakSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      default: null,
    },
    currentStreak: {
      type: Number,
      default: 0,
    },
    maxStreak: {
      type: Number,
      default: 0,
    },
    lastActiveDate: {
      type: String,
      default: null, // "YYYY-MM-DD"
    },
    activityDates: [
      {
        date: {
          type: String,
          required: true, // "YYYY-MM-DD"
        },
        count: {
          type: Number,
          default: 1,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

streakSchema.index({ organization: 1 });

module.exports = mongoose.model("Streak", streakSchema);
