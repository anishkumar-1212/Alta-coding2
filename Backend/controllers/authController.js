const { google } = require("googleapis");
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// =========================
// GOOGLE OAUTH CLIENT
// =========================
console.log(process.env.GOOGLE_CLIENT_ID);
const googleClient = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI,
);

// =========================
// REGISTER USER
// =========================

const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide name, email and password",
      });
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "User already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
    });

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Registration error:", error.message);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// =========================
// LOGIN USER
// =========================

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide email and password",
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);

    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const token = jwt.sign(
      {
        userId: user._id,
        role: user.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      },
    );

    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login error:", error.message);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// =========================
// GET CURRENT USER
// =========================

const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("Get current user error:", error.message);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// =========================
// GOOGLE LOGIN
// =========================

const googleLogin = (req, res) => {
  const authUrl = googleClient.generateAuthUrl({
    access_type: "offline",
    scope: ["openid", "email", "profile"],
  });

  res.redirect(authUrl);
};

// =========================
// GOOGLE CALLBACK
// =========================

const googleCallback = async (req, res) => {
  try {
    const { code } = req.query;

    if (!code) {
      return res.status(400).json({
        success: false,
        message: "Google authorization code missing",
      });
    }

    // Exchange authorization code for Google tokens
    const { tokens } = await googleClient.getToken(code);

    googleClient.setCredentials(tokens);

    // Get Google user information
    const oauth2 = google.oauth2({
      auth: googleClient,
      version: "v2",
    });

    const { data } = await oauth2.userinfo.get();

    const { id: googleId, name, email, picture } = data;

    // Find user by email
    let user = await User.findOne({ email });

    // Create new user
    if (!user) {
      user = await User.create({
        name,
        email,
        googleId,
        profileImage: picture || "",
      });
    } else {
      // Existing user
      // Connect Google account
      if (!user.googleId) {
        user.googleId = googleId;
        user.profileImage = picture || user.profileImage;

        await user.save();
      }
    }

    // Generate our application's JWT
    const token = jwt.sign(
      {
        userId: user._id,
        role: user.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      },
    );

    // Redirect to React
    res.redirect(`${process.env.FRONTEND_URL}/auth/success?token=${token}`);
  } catch (error) {
    console.error("Google authentication error:", error.message);

    res.status(500).json({
      success: false,
      message: "Google authentication failed",
    });
  }
};

// =========================
// EXPORTS
// =========================

module.exports = {
  registerUser,
  loginUser,
  getCurrentUser,
  googleLogin,
  googleCallback,
};
