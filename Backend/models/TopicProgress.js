const mongoose = require("mongoose");

const topicProgressSchema = new mongoose.Schema(
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
    topic: {
      type: String,
      required: true,
      trim: true,
    },
    solvedCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

topicProgressSchema.index({ user: 1, topic: 1 }, { unique: true });
topicProgressSchema.index({ organization: 1 });

module.exports = mongoose.model("TopicProgress", topicProgressSchema);
