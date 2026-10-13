require("dotenv").config();
const mongoose = require("mongoose");
const request = require("supertest");
const jwt = require("jsonwebtoken");

jest.mock("bullmq", () => ({
  Queue: jest.fn().mockImplementation(() => ({
    add: jest.fn().mockResolvedValue({ id: "mock-contest-job-id" }),
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
const TestCase = require("../models/TestCase");
const Contest = require("../models/Contest");
const ContestParticipant = require("../models/ContestParticipant");
const { computeContestState, getContestTimeInfo } = require("../services/contestService");

let mongoServer;

describe("Phase 6 - Contest Engine", () => {
  let facultyUser;
  let facultyToken;
  let studentUser;
  let studentToken;
  let unregisteredStudent;
  let unregisteredStudentToken;
  let testQuestion;
  let liveContest;
  let pastContest;
  let futureContest;

  beforeAll(async () => {
    const { MongoMemoryServer } = require("mongodb-memory-server");
    mongoServer = await MongoMemoryServer.create();
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    await mongoose.connect(mongoServer.getUri());

    facultyUser = await User.create({
      name: "Faculty Member",
      email: "faculty_contest@test.com",
      password: "password123",
      role: "faculty",
    });

    facultyToken = jwt.sign(
      { userId: facultyUser._id.toString(), role: "faculty" },
      process.env.JWT_SECRET || "testsecret"
    );

    studentUser = await User.create({
      name: "Contest Student",
      email: "student_contest@test.com",
      password: "password123",
      role: "student",
    });

    studentToken = jwt.sign(
      { userId: studentUser._id.toString(), role: "student" },
      process.env.JWT_SECRET || "testsecret"
    );

    unregisteredStudent = await User.create({
      name: "Unregistered Student",
      email: "unregistered@test.com",
      password: "password123",
      role: "student",
    });

    unregisteredStudentToken = jwt.sign(
      { userId: unregisteredStudent._id.toString(), role: "student" },
      process.env.JWT_SECRET || "testsecret"
    );

    testQuestion = await Question.create({
      title: "Contest Problem 1",
      description: "Solve problem 1",
      difficulty: "medium",
      status: "published",
      createdBy: facultyUser._id,
    });

    await TestCase.create({
      question: testQuestion._id,
      input: "5",
      expectedOutput: "25",
      visibility: "sample",
      order: 1,
    });

    // 1. Live contest: started 10 minutes ago, ends in 50 minutes
    const now = Date.now();
    liveContest = await Contest.create({
      title: "CodeForge Weekly 1",
      description: "Weekly live contest",
      slug: "cf-weekly-1",
      createdBy: facultyUser._id,
      organization: null,
      startTime: new Date(now - 10 * 60 * 1000),
      endTime: new Date(now + 50 * 60 * 1000),
      status: "live",
      questions: [{ question: testQuestion._id, points: 100, order: 1 }],
    });

    // 2. Past contest: ended 2 hours ago
    pastContest = await Contest.create({
      title: "CodeForge Archive 1",
      description: "Past contest",
      slug: "cf-archive-1",
      createdBy: facultyUser._id,
      organization: null,
      startTime: new Date(now - 3 * 60 * 60 * 1000),
      endTime: new Date(now - 1 * 60 * 60 * 1000),
      status: "ended",
      questions: [{ question: testQuestion._id, points: 100, order: 1 }],
    });

    // 3. Future contest: starts in 2 hours
    futureContest = await Contest.create({
      title: "CodeForge Future 1",
      description: "Upcoming contest",
      slug: "cf-future-1",
      createdBy: facultyUser._id,
      organization: null,
      startTime: new Date(now + 2 * 60 * 60 * 1000),
      endTime: new Date(now + 4 * 60 * 60 * 1000),
      registrationStartTime: new Date(now - 1 * 60 * 60 * 1000),
      registrationEndTime: new Date(now + 1 * 60 * 60 * 1000),
      status: "scheduled",
      questions: [{ question: testQuestion._id, points: 100, order: 1 }],
    });

    // Register studentUser for liveContest
    await ContestParticipant.create({
      contest: liveContest._id,
      user: studentUser._id,
      status: "registered",
    });
  });

  afterAll(async () => {
    await mongoose.disconnect();
    if (mongoServer) await mongoServer.stop();
  });

  test("Faculty can create a contest and state transitions work", async () => {
    const res = await request(app)
      .post("/api/contests")
      .set("Authorization", `Bearer ${facultyToken}`)
      .send({
        title: "Sprint Contest",
        description: "Speed coding contest",
        startTime: new Date(Date.now() + 60 * 60 * 1000),
        endTime: new Date(Date.now() + 120 * 60 * 1000),
        questions: [{ question: testQuestion._id, points: 150, order: 1 }],
        status: "scheduled",
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.contest.title).toBe("Sprint Contest");

    // State transition test
    const updateRes = await request(app)
      .patch(`/api/contests/${res.body.contest._id}/state`)
      .set("Authorization", `Bearer ${facultyToken}`)
      .send({ status: "archived" });

    expect(updateRes.statusCode).toBe(200);
    expect(updateRes.body.contest.status).toBe("archived");
  });

  test("Server-authoritative timer calculates timeRemainingSeconds and live status strictly from server clock", async () => {
    const timeRes = await request(app)
      .get(`/api/contests/${liveContest._id}/time`)
      .set("Authorization", `Bearer ${studentToken}`);

    expect(timeRes.statusCode).toBe(200);
    expect(timeRes.body.time.isLive).toBe(true);
    expect(timeRes.body.time.status).toBe("live");
    expect(timeRes.body.time.timeRemainingSeconds).toBeGreaterThan(0);
    expect(new Date(timeRes.body.time.serverTime).getTime()).toBeLessThanOrEqual(Date.now());
  });

  test("Server-authoritative check rejects submissions when contest has ENDED", async () => {
    const res = await request(app)
      .post(`/api/contests/${pastContest._id}/questions/${testQuestion._id}/submit`)
      .set("Authorization", `Bearer ${studentToken}`)
      .send({
        code: "print('hello')",
        language: "python",
      });

    expect(res.statusCode).toBe(403);
    expect(res.body.message).toContain("Contest has ended");
  });

  test("Server-authoritative check rejects submissions when contest has NOT STARTED yet", async () => {
    // Register student for future contest
    await ContestParticipant.create({
      contest: futureContest._id,
      user: studentUser._id,
    });

    const res = await request(app)
      .post(`/api/contests/${futureContest._id}/questions/${testQuestion._id}/submit`)
      .set("Authorization", `Bearer ${studentToken}`)
      .send({
        code: "print('hello')",
        language: "python",
      });

    expect(res.statusCode).toBe(403);
    expect(res.body.message).toContain("Contest is not live yet");
  });

  test("Contest submission eligibility rejects unregistered students", async () => {
    const res = await request(app)
      .post(`/api/contests/${liveContest._id}/questions/${testQuestion._id}/submit`)
      .set("Authorization", `Bearer ${unregisteredStudentToken}`)
      .send({
        code: "print('hello')",
        language: "python",
      });

    expect(res.statusCode).toBe(403);
    expect(res.body.message).toContain("You must be registered for this contest");
  });

  test("Registered student can submit during LIVE contest and submission is queued", async () => {
    const res = await request(app)
      .post(`/api/contests/${liveContest._id}/questions/${testQuestion._id}/submit`)
      .set("Authorization", `Bearer ${studentToken}`)
      .send({
        code: "print(25)",
        language: "python",
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.submission.status).toBe("pending");
    expect(res.body.submission.contest).toBe(liveContest._id.toString());
  });

  test("Student registration enforces registration window", async () => {
    // Past contest has registration closed
    const res = await request(app)
      .post(`/api/contests/${pastContest._id}/register`)
      .set("Authorization", `Bearer ${unregisteredStudentToken}`);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toContain("ended");
  });

  test("Contest Leaderboard returns ranked participant standings", async () => {
    const res = await request(app)
      .get(`/api/contests/${liveContest._id}/leaderboard`)
      .set("Authorization", `Bearer ${studentToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.leaderboard)).toBe(true);
    expect(res.body.leaderboard[0].userId.toString()).toBe(studentUser._id.toString());
  });
});
