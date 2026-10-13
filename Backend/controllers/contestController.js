const mongoose = require("mongoose");
const Contest = require("../models/Contest");
const ContestParticipant = require("../models/ContestParticipant");
const ContestSession = require("../models/ContestSession");
const Question = require("../models/Question");
const TestCase = require("../models/TestCase");
const Submission = require("../models/Submission");
const AuditLog = require("../models/AuditLog");
const { computeContestState, getContestTimeInfo } = require("../services/contestService");
const { submissionQueue } = require("../services/queueService");

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

// 1. Create Contest (Faculty / Admin)
const createContest = async (req, res) => {
  try {
    const {
      title,
      description,
      startTime,
      endTime,
      registrationStartTime,
      registrationEndTime,
      questions,
      scoringRules,
      status,
    } = req.body;

    if (!title || !description || !startTime || !endTime) {
      return res.status(400).json({
        success: false,
        message: "Title, description, startTime, and endTime are required",
      });
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid start or end time format",
      });
    }

    if (start >= end) {
      return res.status(400).json({
        success: false,
        message: "startTime must be before endTime",
      });
    }

    // Format questions array
    const formattedQuestions = [];
    if (Array.isArray(questions)) {
      for (let i = 0; i < questions.length; i++) {
        const qItem = questions[i];
        const qId = qItem.question || qItem.questionId || qItem._id;
        if (isValidId(qId)) {
          formattedQuestions.push({
            question: qId,
            points: qItem.points || 100,
            order: qItem.order || i + 1,
          });
        }
      }
    }

    // Generate unique slug
    const baseSlug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    const slug = `${baseSlug}-${Date.now().toString().slice(-4)}`;

    const contest = await Contest.create({
      title,
      description,
      slug,
      organization: req.user.organization || null,
      createdBy: req.user.userId,
      startTime: start,
      endTime: end,
      registrationStartTime: registrationStartTime ? new Date(registrationStartTime) : null,
      registrationEndTime: registrationEndTime ? new Date(registrationEndTime) : null,
      status: status || "draft",
      scoringRules: scoringRules || {
        penaltyPerWrongSubmissionMinutes: 20,
        pointsPerProblem: 100,
      },
      questions: formattedQuestions,
    });

    // Cross-phase audit log
    await AuditLog.create({
      action: "CONTEST_CREATE",
      performedBy: req.user.userId,
      organization: contest.organization,
      targetType: "Contest",
      targetId: contest._id,
      details: { title: contest.title, slug: contest.slug },
    }).catch((err) => console.error("Audit log error:", err.message));

    return res.status(201).json({
      success: true,
      message: "Contest created successfully",
      contest,
    });
  } catch (error) {
    console.error("Create contest error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create contest",
      error: error.message,
    });
  }
};

// 2. Get All Contests
const getContests = async (req, res) => {
  try {
    const isStudent = req.user.role === "student";
    const filter = {};

    if (isStudent) {
      filter.status = { $ne: "draft" };
    }

    const contests = await Contest.find(filter)
      .populate("createdBy", "name email")
      .populate("questions.question", "title difficulty")
      .sort({ startTime: -1 });

    // Fetch user registrations
    let registeredContestIds = new Set();
    if (req.user && req.user.userId) {
      const registrations = await ContestParticipant.find({
        user: req.user.userId,
      });
      registrations.forEach((r) => registeredContestIds.add(r.contest.toString()));
    }

    const enrichedContests = contests.map((c) => {
      const cObj = c.toObject();
      const currentServerStatus = computeContestState(c);
      const isRegistered = registeredContestIds.has(c._id.toString());
      return {
        ...cObj,
        serverStatus: currentServerStatus,
        isRegistered,
        questionCount: c.questions.length,
      };
    });

    return res.status(200).json({
      success: true,
      count: enrichedContests.length,
      contests: enrichedContests,
    });
  } catch (error) {
    console.error("Get contests error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch contests",
    });
  }
};

// 3. Get Contest by ID
const getContestById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) {
      return res.status(400).json({ success: false, message: "Invalid contest ID" });
    }

    const contest = await Contest.findById(id)
      .populate("createdBy", "name email")
      .populate("questions.question", "title description difficulty constraints sampleInput sampleOutput");

    if (!contest) {
      return res.status(404).json({ success: false, message: "Contest not found" });
    }

    const isStudent = req.user.role === "student";
    const serverStatus = computeContestState(contest);

    if (isStudent && contest.status === "draft") {
      return res.status(404).json({ success: false, message: "Contest not found" });
    }

    let isRegistered = false;
    let participantData = null;
    if (req.user && req.user.userId) {
      const participant = await ContestParticipant.findOne({
        contest: contest._id,
        user: req.user.userId,
      });
      if (participant) {
        isRegistered = true;
        participantData = participant;
      }
    }

    const contestObj = contest.toObject();

    // If student and contest not yet live, hide questions to prevent early leakage
    if (isStudent && serverStatus !== "live" && serverStatus !== "ended") {
      contestObj.questions = contestObj.questions.map((q) => ({
        order: q.order,
        points: q.points,
      }));
    }

    return res.status(200).json({
      success: true,
      contest: {
        ...contestObj,
        serverStatus,
        isRegistered,
        participant: participantData,
      },
    });
  } catch (error) {
    console.error("Get contest by ID error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch contest",
    });
  }
};

// 4. Register for Contest (Student)
const registerForContest = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) {
      return res.status(400).json({ success: false, message: "Invalid contest ID" });
    }

    const contest = await Contest.findById(id);
    if (!contest) {
      return res.status(404).json({ success: false, message: "Contest not found" });
    }

    const now = Date.now();
    const startTime = new Date(contest.startTime).getTime();
    const endTime = new Date(contest.endTime).getTime();

    // Check registration time window
    if (contest.registrationEndTime) {
      const regEnd = new Date(contest.registrationEndTime).getTime();
      if (now > regEnd) {
        return res.status(400).json({
          success: false,
          message: "Registration for this contest has closed",
        });
      }
    } else if (now > endTime) {
      return res.status(400).json({
        success: false,
        message: "Cannot register: contest has already ended",
      });
    }

    if (contest.registrationStartTime) {
      const regStart = new Date(contest.registrationStartTime).getTime();
      if (now < regStart) {
        return res.status(400).json({
          success: false,
          message: "Registration has not opened yet",
        });
      }
    }

    let participant = await ContestParticipant.findOne({
      contest: contest._id,
      user: req.user.userId,
    });

    if (participant) {
      return res.status(200).json({
        success: true,
        message: "Already registered for this contest",
        participant,
      });
    }

    participant = await ContestParticipant.create({
      contest: contest._id,
      user: req.user.userId,
      organization: contest.organization || null,
      registeredAt: new Date(),
      status: "registered",
    });

    return res.status(201).json({
      success: true,
      message: "Successfully registered for contest",
      participant,
    });
  } catch (error) {
    console.error("Register contest error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to register for contest",
    });
  }
};

// 5. Server-Authoritative Timer API
const getContestTime = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) {
      return res.status(400).json({ success: false, message: "Invalid contest ID" });
    }

    const contest = await Contest.findById(id);
    if (!contest) {
      return res.status(404).json({ success: false, message: "Contest not found" });
    }

    const timeInfo = getContestTimeInfo(contest);
    return res.status(200).json({
      success: true,
      time: timeInfo,
    });
  } catch (error) {
    console.error("Get contest time error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to get contest time",
    });
  }
};

// 6. Submit Code in Contest (Strict Server Clock & Eligibility Check)
const submitContestCode = async (req, res) => {
  try {
    const { id, questionId } = req.params;
    const { code, language } = req.body;
    const idempotencyKey = req.headers["x-idempotency-key"];

    if (!isValidId(id) || !isValidId(questionId)) {
      return res.status(400).json({ success: false, message: "Invalid contest or question ID" });
    }

    const contest = await Contest.findById(id);
    if (!contest) {
      return res.status(404).json({ success: false, message: "Contest not found" });
    }

    // SERVER-AUTHORITATIVE CHECK: Check server time strictly!
    const now = Date.now();
    const startTime = new Date(contest.startTime).getTime();
    const endTime = new Date(contest.endTime).getTime();

    if (now < startTime) {
      return res.status(403).json({
        success: false,
        message: "Contest is not live yet: submissions are not allowed before start time",
      });
    }

    if (now > endTime) {
      return res.status(403).json({
        success: false,
        message: "Contest has ended: submissions are no longer accepted",
      });
    }

    // ELIGIBILITY CHECK: User must be registered
    const participant = await ContestParticipant.findOne({
      contest: contest._id,
      user: req.user.userId,
    });

    if (!participant) {
      return res.status(403).json({
        success: false,
        message: "You must be registered for this contest to submit solutions",
      });
    }

    // Check question is part of contest
    const isContestQuestion = contest.questions.some(
      (q) => q.question.toString() === questionId.toString()
    );
    if (!isContestQuestion) {
      return res.status(400).json({
        success: false,
        message: "Question is not part of this contest",
      });
    }

    const question = await Question.findById(questionId);
    if (!question) {
      return res.status(404).json({ success: false, message: "Question not found" });
    }

    const allowedLanguages = ["javascript", "python", "java", "cpp"];
    if (!allowedLanguages.includes(language)) {
      return res.status(400).json({
        success: false,
        message: "Language must be javascript, python, java, or cpp",
      });
    }

    const testCasesCount = await TestCase.countDocuments({ question: questionId });
    if (testCasesCount === 0) {
      return res.status(400).json({
        success: false,
        message: "No test cases configured for this question",
      });
    }

    const submission = await Submission.create({
      question: questionId,
      user: req.user.userId,
      contest: contest._id,
      code,
      language,
      status: "pending",
      totalTestCases: testCasesCount,
    });

    const jobOptions = {};
    if (idempotencyKey) {
      jobOptions.jobId = idempotencyKey;
    }

    await submissionQueue.add(
      "execute-submission",
      {
        submissionId: submission._id,
        questionId,
        code,
        language,
        contestId: contest._id,
      },
      jobOptions
    );

    return res.status(201).json({
      success: true,
      message: "Contest submission queued successfully",
      submission: {
        ...submission.toObject(),
        code: undefined,
      },
    });
  } catch (error) {
    console.error("Submit contest code error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to submit contest code",
      error: error.message,
    });
  }
};

// 7. Update Contest State (Faculty / Admin)
const updateContestState = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const allowedStates = [
      "draft",
      "scheduled",
      "registration_open",
      "live",
      "ended",
      "evaluated",
      "archived",
    ];

    if (!allowedStates.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Status must be one of: ${allowedStates.join(", ")}`,
      });
    }

    const contest = await Contest.findById(id);
    if (!contest) {
      return res.status(404).json({ success: false, message: "Contest not found" });
    }

    const prevStatus = contest.status;
    contest.status = status;
    await contest.save();

    // Audit log
    await AuditLog.create({
      action: "CONTEST_STATE_TRANSITION",
      performedBy: req.user.userId,
      organization: contest.organization,
      targetType: "Contest",
      targetId: contest._id,
      details: { from: prevStatus, to: status },
    }).catch((err) => console.error("Audit log error:", err.message));

    return res.status(200).json({
      success: true,
      message: `Contest state updated to ${status}`,
      contest,
    });
  } catch (error) {
    console.error("Update contest state error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update contest state",
    });
  }
};

// 8. Contest Leaderboard
const getContestLeaderboard = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) {
      return res.status(400).json({ success: false, message: "Invalid contest ID" });
    }

    const participants = await ContestParticipant.find({ contest: id })
      .populate("user", "name email")
      .sort({ score: -1, totalPenalty: 1 });

    const leaderboard = participants.map((p, index) => ({
      rank: index + 1,
      userId: p.user?._id,
      name: p.user?.name || "Anonymous",
      score: p.score,
      totalPenalty: p.totalPenalty,
      solvedCount: p.solvedProblems.length,
      solvedProblems: p.solvedProblems,
    }));

    return res.status(200).json({
      success: true,
      leaderboard,
    });
  } catch (error) {
    console.error("Get leaderboard error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch leaderboard",
    });
  }
};

module.exports = {
  createContest,
  getContests,
  getContestById,
  registerForContest,
  getContestTime,
  submitContestCode,
  updateContestState,
  getContestLeaderboard,
};
