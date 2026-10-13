const mongoose = require("mongoose");
const PracticeProgress = require("../models/PracticeProgress");
const TopicProgress = require("../models/TopicProgress");
const Streak = require("../models/Streak");
const Submission = require("../models/Submission");
const Question = require("../models/Question");

// Get full student practice dashboard stats
const getStudentStats = async (req, res) => {
  try {
    const userId = req.user.userId;

    // 1. Streak
    let streak = await Streak.findOne({ user: userId });
    if (!streak) {
      streak = {
        currentStreak: 0,
        maxStreak: 0,
        lastActiveDate: null,
        activityDates: [],
      };
    }

    // 2. Solved progress
    let progress = await PracticeProgress.findOne({ user: userId });
    if (!progress) {
      progress = {
        totalSolved: 0,
        easySolved: 0,
        mediumSolved: 0,
        hardSolved: 0,
        solvedQuestions: [],
      };
    }

    // Total published questions count
    const totalQuestions = await Question.countDocuments({ status: "published" });
    const easyTotal = await Question.countDocuments({
      status: "published",
      difficulty: "easy",
    });
    const mediumTotal = await Question.countDocuments({
      status: "published",
      difficulty: "medium",
    });
    const hardTotal = await Question.countDocuments({
      status: "published",
      difficulty: "hard",
    });

    // 3. Topic progress
    const topics = await TopicProgress.find({ user: userId })
      .sort({ solvedCount: -1 })
      .limit(10);

    // 4. Recent submissions
    const recentSubmissions = await Submission.find({ user: userId })
      .populate("question", "title difficulty")
      .sort({ createdAt: -1 })
      .limit(10)
      .select("-code");

    return res.status(200).json({
      success: true,
      data: {
        streak: {
          currentStreak: streak.currentStreak || 0,
          maxStreak: streak.maxStreak || 0,
          lastActiveDate: streak.lastActiveDate,
          activityDates: streak.activityDates || [],
        },
        progress: {
          totalSolved: progress.totalSolved || 0,
          easySolved: progress.easySolved || 0,
          mediumSolved: progress.mediumSolved || 0,
          hardSolved: progress.hardSolved || 0,
          totalQuestions,
          easyTotal,
          mediumTotal,
          hardTotal,
        },
        topicMastery: topics.map((t) => ({
          topic: t.topic,
          solvedCount: t.solvedCount,
        })),
        recentSubmissions: recentSubmissions.map((s) => ({
          id: s._id,
          questionId: s.question?._id,
          questionTitle: s.question?.title || "Deleted Question",
          difficulty: s.question?.difficulty || "medium",
          status: s.status,
          result: s.result,
          language: s.language,
          passedTestCases: s.passedTestCases,
          totalTestCases: s.totalTestCases,
          executionTime: s.executionTime,
          memoryUsed: s.memoryUsed,
          createdAt: s.createdAt,
        })),
      },
    });
  } catch (error) {
    console.error("Get student stats error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve student dashboard stats",
      error: error.message,
    });
  }
};

module.exports = {
  getStudentStats,
};
