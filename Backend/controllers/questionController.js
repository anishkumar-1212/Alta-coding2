const Question = require("../models/Question");

// Get all questions
const getQuestions = async (req, res) => {
  try {
    const questions = await Question.find()
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: questions.length,
      questions,
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
    const question = await Question.findById(req.params.id).populate(
      "createdBy",
      "name email",
    );

    if (!question) {
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
      status,
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
      status,
      createdBy: req.user.userId,
    });

    res.status(201).json({
      success: true,
      message: "Question created successfully",
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
    const question = await Question.findById(req.params.id);

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
      "status",
    ];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        question[field] = req.body[field];
      }
    });

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
    const question = await Question.findById(req.params.id);

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

module.exports = {
  getQuestions,
  getQuestionById,
  createQuestion,
  updateQuestion,
  deleteQuestion,
};
