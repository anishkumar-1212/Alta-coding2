const express = require("express");
const cors = require("cors"); //This module safely allow or restrict web browsers from accessing resource on diff domains
const dotenv = require("dotenv"); // safely loads the .env credintials
const facultyRoutes = require("./routes/facultyRoutes");
const adminRoutes = require("./routes/adminRoutes");
dotenv.config();

const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use("/api/faculty", facultyRoutes);
app.use("/api/admin", adminRoutes);

// Database
connectDB();

// Routes
app.get("/", (req, res) => {
  res.send("CodeForge AI Backend is running");
});

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Server and API are working",
  });
});

// Authentication routes
app.use("/api/auth", authRoutes);

// Server
const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
