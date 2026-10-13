const express = require("express");
const protect = require("../middleware/authMiddleware");
const role = require("../middleware/roleMiddleware");
const rateLimit = require("express-rate-limit");
const {
  createContest,
  getContests,
  getContestById,
  registerForContest,
  getContestTime,
  submitContestCode,
  updateContestState,
  getContestLeaderboard,
} = require("../controllers/contestController");

const submitLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { success: false, message: "Too many submissions, please wait a minute." },
});

const router = express.Router();

// Faculty/Admin: Create contest
router.post("/", protect, role("faculty", "admin"), createContest);

// All authenticated: List contests
router.get("/", protect, getContests);

// All authenticated: Get contest details
router.get("/:id", protect, getContestById);

// Student: Register for contest
router.post("/:id/register", protect, role("student"), registerForContest);

// Server-authoritative timer
router.get("/:id/time", protect, getContestTime);

// Student: Submit code for contest question
router.post(
  "/:id/questions/:questionId/submit",
  protect,
  role("student"),
  submitLimiter,
  submitContestCode
);

// Faculty/Admin: Update state
router.patch("/:id/state", protect, role("faculty", "admin"), updateContestState);

// Contest leaderboard
router.get("/:id/leaderboard", protect, getContestLeaderboard);

module.exports = router;
