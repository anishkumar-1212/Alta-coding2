const mongoose = require("mongoose");

const contestQuestionSchema = new mongoose.Schema({
  question: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Question",
    required: true,
  },
  points: {
    type: Number,
    default: 100,
  },
  order: {
    type: Number,
    default: 1,
  },
});

const contestSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    startTime: {
      type: Date,
      required: true,
    },
    endTime: {
      type: Date,
      required: true,
    },
    registrationStartTime: {
      type: Date,
      default: null,
    },
    registrationEndTime: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: [
        "draft",
        "scheduled",
        "registration_open",
        "live",
        "ended",
        "evaluated",
        "archived",
      ],
      default: "draft",
    },
    scoringRules: {
      penaltyPerWrongSubmissionMinutes: {
        type: Number,
        default: 20,
      },
      pointsPerProblem: {
        type: Number,
        default: 100,
      },
    },
    questions: [contestQuestionSchema],
  },
  {
    timestamps: true,
  }
);

contestSchema.index({ organization: 1, status: 1 });
contestSchema.index({ startTime: 1, endTime: 1 });

module.exports = mongoose.model("Contest", contestSchema);
