const mongoose = require("mongoose");
const Question = require("../models/Question");
const User = require("../models/User");
const PracticeProgress = require("../models/PracticeProgress");
const TopicProgress = require("../models/TopicProgress");
const Streak = require("../models/Streak");
const Contest = require("../models/Contest");
const ContestParticipant = require("../models/ContestParticipant");

/**
 * Deterministically records progress upon an ACCEPTED submission.
 * Strictly called only by backend worker/service on real Accepted verdicts.
 */
const recordAcceptedSubmission = async ({ userId, questionId, contestId = null }) => {
  try {
    if (!userId || !questionId) return;

    const question = await Question.findById(questionId);
    if (!question) return;

    const user = await User.findById(userId);
    const orgId = question.organization || null;

    // 1. Update PracticeProgress
    let progress = await PracticeProgress.findOne({ user: userId });
    if (!progress) {
      progress = new PracticeProgress({
        user: userId,
        organization: orgId,
        solvedQuestions: [],
        totalSolved: 0,
        easySolved: 0,
        mediumSolved: 0,
        hardSolved: 0,
      });
    }

    const alreadySolved = progress.solvedQuestions.some(
      (qId) => qId.toString() === questionId.toString()
    );

    if (!alreadySolved) {
      progress.solvedQuestions.push(questionId);
      progress.totalSolved += 1;

      const diff = (question.difficulty || "medium").toLowerCase();
      if (diff === "easy") progress.easySolved += 1;
      else if (diff === "hard") progress.hardSolved += 1;
      else progress.mediumSolved += 1;

      await progress.save();

      // 2. Update TopicProgress (only increment for newly solved problems)
      if (Array.isArray(question.topics) && question.topics.length > 0) {
        for (const topic of question.topics) {
          const trimmedTopic = topic.trim();
          if (!trimmedTopic) continue;

          await TopicProgress.findOneAndUpdate(
            { user: userId, topic: trimmedTopic },
            {
              $inc: { solvedCount: 1 },
              $setOnInsert: { organization: orgId },
            },
            { upsert: true, new: true }
          );
        }
      }
    }

    // 3. Update Streak & Activity Heatmap
    let streak = await Streak.findOne({ user: userId });
    if (!streak) {
      streak = new Streak({
        user: userId,
        organization: orgId,
        currentStreak: 0,
        maxStreak: 0,
        lastActiveDate: null,
        activityDates: [],
      });
    }

    const todayStr = new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
    const yesterdayDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const yesterdayStr = yesterdayDate.toISOString().slice(0, 10);

    if (streak.lastActiveDate !== todayStr) {
      if (streak.lastActiveDate === yesterdayStr) {
        streak.currentStreak += 1;
      } else {
        streak.currentStreak = 1;
      }

      streak.maxStreak = Math.max(streak.maxStreak, streak.currentStreak);
      streak.lastActiveDate = todayStr;

      // Update activity dates array
      const existingDateEntry = streak.activityDates.find(
        (entry) => entry.date === todayStr
      );
      if (existingDateEntry) {
        existingDateEntry.count += 1;
      } else {
        streak.activityDates.push({ date: todayStr, count: 1 });
      }
    } else {
      // Already active today, just record extra activity count
      const existingDateEntry = streak.activityDates.find(
        (entry) => entry.date === todayStr
      );
      if (existingDateEntry) {
        existingDateEntry.count += 1;
      } else {
        streak.activityDates.push({ date: todayStr, count: 1 });
      }
    }

    await streak.save();

    // 4. Update Contest Scoring if submitted within a contest
    if (contestId) {
      const contest = await Contest.findById(contestId);
      if (contest) {
        const participant = await ContestParticipant.findOne({
          contest: contestId,
          user: userId,
        });

        if (participant) {
          const contestQ = contest.questions.find(
            (q) => q.question.toString() === questionId.toString()
          );
          const points = contestQ ? contestQ.points : 100;
          const penaltyPerWrong = contest.scoringRules?.penaltyPerWrongSubmissionMinutes || 20;

          const alreadySolvedInContest = participant.solvedProblems.some(
            (sp) => sp.question.toString() === questionId.toString()
          );

          if (!alreadySolvedInContest) {
            // Count prior failed submissions for this question in this contest
            const Submission = mongoose.model("Submission");
            const wrongAttempts = await Submission.countDocuments({
              contest: contestId,
              user: userId,
              question: questionId,
              status: { $ne: "accepted" },
            });

            const elapsedMinutes = Math.max(
              0,
              Math.floor((Date.now() - new Date(contest.startTime).getTime()) / (60 * 1000))
            );
            const penalty = elapsedMinutes + wrongAttempts * penaltyPerWrong;

            participant.solvedProblems.push({
              question: questionId,
              solvedAt: new Date(),
              wrongAttemptsCount: wrongAttempts,
              points,
            });

            participant.score += points;
            participant.totalPenalty += penalty;
            participant.status = "participating";
            await participant.save();
          }
        }
      }
    }

    return { success: true };
  } catch (error) {
    console.error("Error updating progress on accepted submission:", error);
  }
};

module.exports = {
  recordAcceptedSubmission,
};
