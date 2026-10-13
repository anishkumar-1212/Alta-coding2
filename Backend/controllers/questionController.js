const mongoose = require("mongoose");
const Question = require("../models/Question");
const QuestionVersion = require("../models/QuestionVersion");
const PracticeProgress = require("../models/PracticeProgress");
const Submission = require("../models/Submission");
const AuditLog = require("../models/AuditLog");

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

// Get all questions with filters, search, and solved status
const getQuestions = async (req, res) => {
  try {
    const isStudent = req.user.role === "student";
    const { difficulty, topic, search, status } = req.query;

    const filter = isStudent ? { status: "published" } : {};

    if (difficulty && ["easy", "medium", "hard"].includes(difficulty.toLowerCase())) {
      filter.difficulty = difficulty.toLowerCase();
    }

    if (topic && topic.trim()) {
      filter.topics = { $regex: new RegExp(topic.trim(), "i") };
    }

    if (search && search.trim()) {
      filter.$or = [
        { title: { $regex: new RegExp(search.trim(), "i") } },
        { description: { $regex: new RegExp(search.trim(), "i") } },
      ];
    }

    const questions = await Question.find(filter)
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 });

    // Fetch user's practice progress to mark solved questions
    let solvedSet = new Set();
    if (req.user && req.user.userId) {
      const progress = await PracticeProgress.findOne({ user: req.user.userId });
      if (progress && Array.isArray(progress.solvedQuestions)) {
        progress.solvedQuestions.forEach((id) => solvedSet.add(id.toString()));
      }
    }

    // Calculate acceptance rates for the matched questions
    const questionIds = questions.map((q) => q._id);
    const submissionStats = await Submission.aggregate([
      { $match: { question: { $in: questionIds } } },
      {
        $group: {
          _id: "$question",
          total: { $sum: 1 },
          accepted: {
            $sum: { $cond: [{ $eq: ["$status", "accepted"] }, 1, 0] },
          },
        },
      },
    ]);

    const statsMap = {};
    submissionStats.forEach((s) => {
      statsMap[s._id.toString()] = {
        total: s.total,
        accepted: s.accepted,
        acceptanceRate:
          s.total > 0 ? Math.round((s.accepted / s.total) * 100) : 0,
      };
    });

    let resultQuestions = questions.map((q) => {
      const qObj = q.toObject();
      const stats = statsMap[q._id.toString()] || {
        total: 0,
        accepted: 0,
        acceptanceRate: 0,
      };
      const isSolved = solvedSet.has(q._id.toString());
      return {
        ...qObj,
        isSolved,
        totalSubmissions: stats.total,
        acceptedSubmissions: stats.accepted,
        acceptanceRate: stats.acceptanceRate,
      };
    });

    if (status === "solved") {
      resultQuestions = resultQuestions.filter((q) => q.isSolved);
    } else if (status === "unsolved") {
      resultQuestions = resultQuestions.filter((q) => !q.isSolved);
    }

    res.status(200).json({
      success: true,
      count: resultQuestions.length,
      questions: resultQuestions,
    });
  } catch (error) {
    console.error("Get questions error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to fetch questions",
    });
  }
};

// Get one question by ID
const getQuestionById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid question ID",
      });
    }

    const question = await Question.findById(id).populate(
      "createdBy",
      "name email",
    );

    if (!question) {
      return res.status(404).json({
        success: false,
        message: "Question not found",
      });
    }

    // Students can only view published questions
    if (
      req.user.role === "student" &&
      question.status !== "published"
    ) {
      return res.status(404).json({
        success: false,
        message: "Question not found",
      });
    }

    res.status(200).json({
      success: true,
      question,
    });
  } catch (error) {
    console.error("Get question error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to fetch question",
    });
  }
};

// Create a new question
const createQuestion = async (req, res) => {
  try {
    const {
      title,
      description,
      difficulty,
      topics,
      constraints,
      inputFormat,
      outputFormat,
      sampleInput,
      sampleOutput,
      explanation,
      organization,
    } = req.body;

    if (!title || !description) {
      return res.status(400).json({
        success: false,
        message: "Title and description are required",
      });
    }

    const question = await Question.create({
      title,
      description,
      difficulty,
      topics,
      constraints,
      inputFormat,
      outputFormat,
      sampleInput,
      sampleOutput,
      explanation,
      organization: organization || null,
      status: "draft",
      createdBy: req.user.userId,
    });

    res.status(201).json({
      success: true,
      message: "Question created successfully as draft",
      question,
    });
  } catch (error) {
    console.error("Create question error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to create question",
    });
  }
};

// Update a question
const updateQuestion = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid question ID",
      });
    }

    const question = await Question.findById(id);

    if (!question) {
      return res.status(404).json({
        success: false,
        message: "Question not found",
      });
    }

    const isOwner = question.createdBy.toString() === req.user.userId;

    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "You can only update your own questions",
      });
    }

    const allowedFields = [
      "title",
      "description",
      "difficulty",
      "topics",
      "constraints",
      "inputFormat",
      "outputFormat",
      "sampleInput",
      "sampleOutput",
      "explanation",
      "organization",
    ];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        question[field] = req.body[field];
      }
    });

    // Status must be changed only through publish/unpublish routes

    await question.save();

    res.status(200).json({
      success: true,
      message: "Question updated successfully",
      question,
    });
  } catch (error) {
    console.error("Update question error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to update question",
    });
  }
};

// Delete a question
const deleteQuestion = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid question ID",
      });
    }

    const question = await Question.findById(id);

    if (!question) {
      return res.status(404).json({
        success: false,
        message: "Question not found",
      });
    }

    const isOwner = question.createdBy.toString() === req.user.userId;

    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "You can only delete your own questions",
      });
    }

    await question.deleteOne();

    res.status(200).json({
      success: true,
      message: "Question deleted successfully",
    });
  } catch (error) {
    console.error("Delete question error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to delete question",
    });
  }
};

// Publish a question
const publishQuestion = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid question ID",
      });
    }

    const question = await Question.findById(id);

    if (!question) {
      return res.status(404).json({
        success: false,
        message: "Question not found",
      });
    }

    const isOwner =
      question.createdBy.toString() === req.user.userId;

    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to publish this question",
      });
    }

    const latestVersion = await QuestionVersion.findOne({
      question: question._id,
    }).sort({ version: -1 });

    const nextVersion = latestVersion
      ? latestVersion.version + 1
      : 1;

    const questionVersion = await QuestionVersion.create({
      question: question._id,
      version: nextVersion,
      title: question.title,
      description: question.description,
      difficulty: question.difficulty,
      topics: question.topics,
      constraints: question.constraints,
      inputFormat: question.inputFormat,
      outputFormat: question.outputFormat,
      sampleInput: question.sampleInput,
      sampleOutput: question.sampleOutput,
      explanation: question.explanation,
      publishedBy: req.user.userId,
    });

    question.status = "published";

    await question.save();

    await AuditLog.create({
      action: "QUESTION_PUBLISH",
      performedBy: req.user.userId,
      organization: question.organization || null,
      targetType: "Question",
      targetId: question._id,
      details: { version: nextVersion, title: question.title },
    }).catch((err) => console.error("Audit log error:", err.message));

    res.status(200).json({
      success: true,
      message: "Question published successfully",
      question,
      version: questionVersion,
    });
  } catch (error) {
    console.error("Publish question error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to publish question",
    });
  }
};

// Unpublish a question
const unpublishQuestion = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid question ID",
      });
    }

    const question = await Question.findById(id);

    if (!question) {
      return res.status(404).json({
        success: false,
        message: "Question not found",
      });
    }

    const isOwner =
      question.createdBy.toString() === req.user.userId;

    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to unpublish this question",
      });
    }

    if (question.status !== "published") {
      return res.status(400).json({
        success: false,
        message: "Question is already unpublished",
      });
    }

    question.status = "draft";

    await question.save();

    await AuditLog.create({
      action: "QUESTION_UNPUBLISH",
      performedBy: req.user.userId,
      organization: question.organization || null,
      targetType: "Question",
      targetId: question._id,
      details: { title: question.title },
    }).catch((err) => console.error("Audit log error:", err.message));

    res.status(200).json({
      success: true,
      message: "Question unpublished successfully",
      question,
    });
  } catch (error) {
    console.error("Unpublish question error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to unpublish question",
    });
  }
};

module.exports = {
  getQuestions,
  getQuestionById,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  publishQuestion,
  unpublishQuestion,
};
