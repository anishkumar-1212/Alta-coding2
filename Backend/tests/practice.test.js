require("dotenv").config();
const mongoose = require("mongoose");
const request = require("supertest");
const jwt = require("jsonwebtoken");

jest.mock("bullmq", () => ({
  Queue: jest.fn().mockImplementation(() => ({
    add: jest.fn().mockResolvedValue({ id: "mock-job-id" }),
    on: jest.fn(),
  })),
  Worker: jest.fn().mockImplementation(() => ({
    on: jest.fn(),
  })),
}));

jest.mock("ioredis", () => {
  return jest.fn().mockImplementation(() => ({
    on: jest.fn(),
  }));
});

const app = require("../server");
const User = require("../models/User");
const Question = require("../models/Question");
const Submission = require("../models/Submission");
const PracticeProgress = require("../models/PracticeProgress");
const TopicProgress = require("../models/TopicProgress");
const Streak = require("../models/Streak");
const { recordAcceptedSubmission } = require("../services/progressService");

let mongoServer;

describe("Phase 5 - Practice Module", () => {
  let studentToken;
  let studentUser;
  let easyQuestion;
  let hardQuestion;

  beforeAll(async () => {
    const { MongoMemoryServer } = require("mongodb-memory-server");
    mongoServer = await MongoMemoryServer.create();
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    await mongoose.connect(mongoServer.getUri());

    studentUser = await User.create({
      name: "Practice Student",
      email: "practice.student@example.com",
      password: "password123",
      role: "student",
    });

    studentToken = jwt.sign(
      { userId: studentUser._id.toString(), role: "student" },
      process.env.JWT_SECRET || "testsecret"
    );

    easyQuestion = await Question.create({
      title: "Two Sum",
      description: "Find two indices that sum up to target",
      difficulty: "easy",
      topics: ["Arrays", "Hash Table"],
      status: "published",
      createdBy: studentUser._id,
    });

    hardQuestion = await Question.create({
      title: "Trapping Rain Water",
      description: "Compute how much water it can trap after raining",
      difficulty: "hard",
      topics: ["Arrays", "Two Pointers"],
      status: "published",
      createdBy: studentUser._id,
    });
  });

  afterAll(async () => {
    await mongoose.disconnect();
    if (mongoServer) await mongoServer.stop();
  });

  test("Deterministic progress & streak updates on Accepted submission", async () => {
    // Initial check: no progress yet
    let progress = await PracticeProgress.findOne({ user: studentUser._id });
    expect(progress).toBeNull();

    // Trigger accepted submission
    await recordAcceptedSubmission({
      userId: studentUser._id,
      questionId: easyQuestion._id,
    });

    progress = await PracticeProgress.findOne({ user: studentUser._id });
    expect(progress).not.toBeNull();
    expect(progress.totalSolved).toBe(1);
    expect(progress.easySolved).toBe(1);
    expect(progress.hardSolved).toBe(0);
    expect(progress.solvedQuestions).toHaveLength(1);

    // TopicProgress should be updated for "Arrays" and "Hash Table"
    const arrayTopic = await TopicProgress.findOne({
      user: studentUser._id,
      topic: "Arrays",
    });
    expect(arrayTopic).not.toBeNull();
    expect(arrayTopic.solvedCount).toBe(1);

    // Streak should be recorded
    const streak = await Streak.findOne({ user: studentUser._id });
    expect(streak).not.toBeNull();
    expect(streak.currentStreak).toBe(1);
    expect(streak.maxStreak).toBe(1);
    expect(streak.activityDates).toHaveLength(1);
  });

  test("Duplicate Accepted submission does not double count solved problems", async () => {
    // Record same accepted question again
    await recordAcceptedSubmission({
      userId: studentUser._id,
      questionId: easyQuestion._id,
    });

    const progress = await PracticeProgress.findOne({ user: studentUser._id });
    expect(progress.totalSolved).toBe(1);
    expect(progress.easySolved).toBe(1);

    const arrayTopic = await TopicProgress.findOne({
      user: studentUser._id,
      topic: "Arrays",
    });
    expect(arrayTopic.solvedCount).toBe(1);
  });

  test("Solving a Hard problem increments totalSolved and hardSolved deterministically", async () => {
    await recordAcceptedSubmission({
      userId: studentUser._id,
      questionId: hardQuestion._id,
    });

    const progress = await PracticeProgress.findOne({ user: studentUser._id });
    expect(progress.totalSolved).toBe(2);
    expect(progress.easySolved).toBe(1);
    expect(progress.hardSolved).toBe(1);
  });

  test("Question Search/Filter API correctly filters by difficulty, topic, search query, and solved status", async () => {
    // 1. Filter by difficulty: easy
    const easyRes = await request(app)
      .get("/api/questions?difficulty=easy")
      .set("Authorization", `Bearer ${studentToken}`);
    expect(easyRes.statusCode).toBe(200);
    expect(easyRes.body.questions.every((q) => q.difficulty === "easy")).toBe(true);

    // 2. Filter by topic: Two Pointers
    const topicRes = await request(app)
      .get("/api/questions?topic=Two%20Pointers")
      .set("Authorization", `Bearer ${studentToken}`);
    expect(topicRes.statusCode).toBe(200);
    expect(topicRes.body.questions.some((q) => q.title === "Trapping Rain Water")).toBe(true);

    // 3. Search query: "Two Sum"
    const searchRes = await request(app)
      .get("/api/questions?search=Two%20Sum")
      .set("Authorization", `Bearer ${studentToken}`);
    expect(searchRes.statusCode).toBe(200);
    expect(searchRes.body.questions).toHaveLength(1);
    expect(searchRes.body.questions[0].title).toBe("Two Sum");

    // 4. Status filter: solved
    const solvedRes = await request(app)
      .get("/api/questions?status=solved")
      .set("Authorization", `Bearer ${studentToken}`);
    expect(solvedRes.statusCode).toBe(200);
    expect(solvedRes.body.questions.every((q) => q.isSolved === true)).toBe(true);
  });

  test("Student Practice Dashboard stats endpoint returns complete progress metrics", async () => {
    const statsRes = await request(app)
      .get("/api/practice/stats")
      .set("Authorization", `Bearer ${studentToken}`);

    expect(statsRes.statusCode).toBe(200);
    expect(statsRes.body.success).toBe(true);
    expect(statsRes.body.data.progress.totalSolved).toBe(2);
    expect(statsRes.body.data.progress.easySolved).toBe(1);
    expect(statsRes.body.data.progress.hardSolved).toBe(1);
    expect(statsRes.body.data.streak.currentStreak).toBe(1);
    expect(Array.isArray(statsRes.body.data.topicMastery)).toBe(true);
  });
});
