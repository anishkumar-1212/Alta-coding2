require("dotenv").config();
const mongoose = require("mongoose");
const request = require("supertest");
const jwt = require("jsonwebtoken");
const app = require("../server");
const User = require("../models/User");
const Question = require("../models/Question");
const QuestionVersion = require("../models/QuestionVersion");

let mongoServer;

describe("Question Publishing Snapshot", () => {
  let facultyToken;
  let testQuestion;

  beforeAll(async () => {
    try {
      const { MongoMemoryServer } = require("mongodb-memory-server");
      mongoServer = await MongoMemoryServer.create();
      await mongoose.connect(mongoServer.getUri());
    } catch (err) {
      await mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/alta_dashboard");
    }
    
    let facultyUser = await User.findOne({ role: "faculty" });
    if (!facultyUser) {
      facultyUser = await User.create({
        name: "Faculty Test",
        email: "faculty_test@test.com",
        password: "password",
        role: "faculty",
      });
    }

    facultyToken = jwt.sign(
      { userId: facultyUser._id.toString(), role: facultyUser.role },
      process.env.JWT_SECRET || "supersecretjwtkey"
    );

    // Create a draft question to publish later
    testQuestion = await Question.create({
      title: "Test Publish Question",
      description: "Description",
      difficulty: "easy",
      createdBy: facultyUser._id,
      status: "draft"
    });
  });

  afterAll(async () => {
    // Clean up
    if (testQuestion) {
      await Question.findByIdAndDelete(testQuestion._id);
      await QuestionVersion.deleteMany({ question: testQuestion._id });
    }
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
    if (mongoServer) {
      await mongoServer.stop();
    }
  });

  test("Publishing a question should create a QuestionVersion snapshot", async () => {
    const response = await request(app)
      .post(`/api/questions/${testQuestion._id}/publish`)
      .set("Authorization", `Bearer ${facultyToken}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.question.status).toBe("published");

    // Verify snapshot was created
    const versionCount = await QuestionVersion.countDocuments({ question: testQuestion._id });
    expect(versionCount).toBe(1);

    const snapshot = await QuestionVersion.findOne({ question: testQuestion._id });
    expect(snapshot.title).toBe(testQuestion.title);
    expect(snapshot.version).toBe(1);
  });
});
