const express = require("express");

const protect = require("../middleware/authMiddleware");
const allowRoles = require("../middleware/roleMiddleware");

const {
  getQuestions,
  getQuestionById,
  createQuestion,
  updateQuestion,
  deleteQuestion,
} = require("../controllers/questionController");

const router = express.Router();

// Anyone logged in can view all questions
router.get("/", protect, getQuestions);

// Anyone logged in can view one question
router.get("/:id", protect, getQuestionById);

// Faculty and admin can create questions
router.post("/", protect, allowRoles("faculty", "admin"), createQuestion);

// Faculty and admin can update questions
// The controller checks ownership or admin access
router.put("/:id", protect, allowRoles("faculty", "admin"), updateQuestion);

// Faculty and admin can delete questions
// The controller checks ownership or admin access
router.delete("/:id", protect, allowRoles("faculty", "admin"), deleteQuestion);

module.exports = router;
