const mongoose = require("mongoose");

const solvedProblemSchema = new mongoose.Schema({
  question: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Question",
    required: true,
  },
  solvedAt: {
    type: Date,
    default: Date.now,
  },
  wrongAttemptsCount: {
    type: Number,
    default: 0,
  },
  points: {
    type: Number,
    default: 0,
  },
});

const contestParticipantSchema = new mongoose.Schema(
  {
    contest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Contest",
      required: true,
    },
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
    registeredAt: {
      type: Date,
      default: Date.now,
    },
    score: {
      type: Number,
      default: 0,
    },
    totalPenalty: {
      type: Number,
      default: 0,
    },
    solvedProblems: [solvedProblemSchema],
    status: {
      type: String,
      enum: ["registered", "participating", "completed", "disqualified"],
      default: "registered",
    },
  },
  {
    timestamps: true,
  }
);

contestParticipantSchema.index({ contest: 1, user: 1 }, { unique: true });
contestParticipantSchema.index({ contest: 1, score: -1, totalPenalty: 1 });
contestParticipantSchema.index({ organization: 1 });

module.exports = mongoose.model(
  "ContestParticipant",
  contestParticipantSchema
);
