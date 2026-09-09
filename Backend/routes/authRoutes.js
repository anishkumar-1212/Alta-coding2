const express = require("express");

const {
  registerUser,
  loginUser,
  getCurrentUser,
  googleLogin,
  googleCallback,
} = require("../controllers/authController");

const protect = require("../middleware/authMiddleware");
const organizationAccess = require("../middleware/organizationMiddleware");

const router = express.Router();

router.post("/register", registerUser);

router.post("/login", loginUser);

router.get("/me", protect, getCurrentUser);

router.get("/google", googleLogin);

router.get("/google/callback", googleCallback);

// Temporary organization test route
router.get("/org-test", protect, organizationAccess, (req, res) => {
  res.status(200).json({
    success: true,
    message: "Organization access granted",
    organization: req.organization.name,
    role: req.userRole,
  });
});
router.get("/organizations", protect, async (req, res) => {
  const Organization = require("../models/Organization");

  const organizations = await Organization.find().select("name slug");

  res.json({
    success: true,
    organizations,
  });
});

module.exports = router;
