require("dotenv").config();
const mongoose = require("mongoose");

const User = require("../models/User");
const Organization = require("../models/Organization");
const OrganizationMember = require("../models/OrganizationMember");

const seedSecondOrganization = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const user = await User.findOne({
      email: "faculty@test.com",
    });

    if (!user) {
      console.log("Faculty user not found");
      return;
    }

    let organization = await Organization.findOne({
      slug: "test-org",
    });

    if (!organization) {
      organization = await Organization.create({
        name: "Test Organization",
        slug: "test-org",
        createdBy: user._id,
      });

      console.log("Test organization created");
    }

    console.log("Second organization ready");
  } catch (error) {
    console.error("Seed error:", error.message);
  } finally {
    await mongoose.connection.close();
  }
};

seedSecondOrganization();
