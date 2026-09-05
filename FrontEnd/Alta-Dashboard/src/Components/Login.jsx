import React from "react";
import "./Auth.css";

const Login = () => {
  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <span>&lt;/&gt;</span> CodeForge
        </div>

        <h2>Welcome Back</h2>
        <p className="auth-subtitle">Login to continue solving problems.</p>

        <form>
          <label>Email</label>
          <input type="email" placeholder="Enter your email" />

          <label>Password</label>
          <input type="password" placeholder="Enter your password" />

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
