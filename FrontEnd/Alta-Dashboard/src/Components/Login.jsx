import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Auth.css";

const Login = () => {
  const navigate = useNavigate();
  const { setUser } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch("http://localhost:5001/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Login failed");
        return;
      }

      // Store JWT
      localStorage.setItem("token", data.token);

      // Update AuthContext immediately
      setUser(data.user);

      // Redirect based on role
      if (data.user.role === "student") {
        navigate("/student");
      } else if (data.user.role === "faculty") {
        navigate("/faculty");
      } else if (data.user.role === "admin") {
        navigate("/admin");
      }
    } catch (error) {
      console.error("Login error:", error);
      alert("Something went wrong. Please try again.");
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <span>&lt;/&gt;</span> CodeForge
        </div>

        <h2>Welcome Back</h2>
        <p className="auth-subtitle">Login to continue solving problems.</p>

        <form onSubmit={handleLogin}>
          <label>Email</label>

          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <label>Password</label>

          <input
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <div className="forgot">
            <a href="/forgot-password">Forgot Password?</a>
          </div>

          <button type="submit" className="auth-btn">
            Login
          </button>
        </form>

        <div className="divider">
          <span>OR</span>
        </div>

        <button
          className="google-btn"
          onClick={() => {
            window.location.href = "http://localhost:5001/api/auth/google";
          }}
        >
          Continue with Google
        </button>

        <p className="auth-bottom">
          Don't have an account?
          <a href="/register"> Register</a>
        </p>
      </div>
    </div>
  );
};

export default Login;
