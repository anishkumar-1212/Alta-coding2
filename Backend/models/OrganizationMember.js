const mongoose = require("mongoose");

const organizationMemberSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
    },

    role: {
      type: String,
      enum: ["student", "faculty", "admin"],
      required: true,
      default: "student",
    },
  },
  {
    timestamps: true,
  },
);

organizationMemberSchema.index({ user: 1, organization: 1 }, { unique: true });

const OrganizationMember = mongoose.model(
  "OrganizationMember",
  organizationMemberSchema,
);

module.exports = OrganizationMember;
