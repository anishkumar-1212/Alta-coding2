require("dotenv").config();

const mongoose = require("mongoose");
const User = require("../models/User");
const Organization = require("../models/Organization");
const OrganizationMember = require("../models/OrganizationMember");

const seedOrganization = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log("MongoDB connected");

    // Find existing test user
    const user = await User.findOne({
      email: "test@example.com",
    });

    if (!user) {
      console.log("Test user not found. Register the user first.");
      return;
    }

    // Find or create ALTA organization
    let organization = await Organization.findOne({
      slug: "alta",
    });

    if (!organization) {
      organization = await Organization.create({
        name: "ALTA",
        slug: "alta",
        createdBy: user._id,
      });

      console.log("ALTA organization created");
    }

    // Create membership
    const existingMembership = await OrganizationMember.findOne({
      user: user._id,
      organization: organization._id,
    });

    if (!existingMembership) {
      await OrganizationMember.create({
        user: user._id,
        organization: organization._id,
        role: "student",
      });

      console.log("User added to ALTA as student");
    } else {
      console.log("Membership already exists");
    }
  } catch (error) {
    console.error("Seed error:", error.message);
  } finally {
    await mongoose.connection.close();
  }
};

seedOrganization();
