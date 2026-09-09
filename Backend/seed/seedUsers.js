require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const User = require("../models/User");
const Organization = require("../models/Organization");
const OrganizationMember = require("../models/OrganizationMember");

const seedUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected");

    const organization = await Organization.findOne({ slug: "alta" });

    if (!organization) {
      console.log("ALTA organization not found");
      return;
    }

    const users = [
      {
        name: "Faculty User",
        email: "faculty@test.com",
        password: "Test@12345",
        role: "faculty",
      },
      {
        name: "Admin User",
        email: "admin@test.com",
        password: "Test@12345",
        role: "admin",
      },
    ];

    for (const data of users) {
      let user = await User.findOne({ email: data.email });

      if (!user) {
        const hashedPassword = await bcrypt.hash(data.password, 10);

        user = await User.create({
          name: data.name,
          email: data.email,
          password: hashedPassword,
          role: data.role,
        });

        console.log(`${data.role} user created`);
      }

      const membership = await OrganizationMember.findOne({
        user: user._id,
        organization: organization._id,
      });

      if (!membership) {
        await OrganizationMember.create({
          user: user._id,
          organization: organization._id,
          role: data.role,
        });

        console.log(`${data.role} added to ALTA`);
      }
    }
  } catch (error) {
    console.error("Seed error:", error.message);
  } finally {
    await mongoose.connection.close();
  }
};

seedUsers();
