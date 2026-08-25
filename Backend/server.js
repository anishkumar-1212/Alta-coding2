const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
dotenv.config();

const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

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
