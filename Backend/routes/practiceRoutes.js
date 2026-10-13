const express = require("express");
const protect = require("../middleware/authMiddleware");
const { getStudentStats } = require("../controllers/practiceController");

const router = express.Router();

// Get student practice stats (streak, solved counts, topics, recent activity)
router.get("/stats", protect, getStudentStats);

module.exports = router;
