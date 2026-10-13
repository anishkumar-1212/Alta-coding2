const mongoose = require("mongoose");

const practiceProgressSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      default: null,
    },
    solvedQuestions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Question",
      },
    ],
    totalSolved: {
      type: Number,
      default: 0,
    },
    easySolved: {
      type: Number,
      default: 0,
    },
    mediumSolved: {
      type: Number,
      default: 0,
    },
    hardSolved: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

practiceProgressSchema.index({ user: 1, organization: 1 }, { unique: true });
practiceProgressSchema.index({ organization: 1 });

module.exports = mongoose.model("PracticeProgress", practiceProgressSchema);
