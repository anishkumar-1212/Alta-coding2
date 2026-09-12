const express = require("express");

const {
  registerUser,
  loginUser,
  getCurrentUser,
  googleLogin,
  googleCallback,
} = require("../controllers/authController");

const protect = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/register", registerUser);

router.post("/login", loginUser);

router.get("/me", protect, getCurrentUser);

router.get("/google", googleLogin);

router.get("/google/callback", googleCallback);

module.exports = router;
