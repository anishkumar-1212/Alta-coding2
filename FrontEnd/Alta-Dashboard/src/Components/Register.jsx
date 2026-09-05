import React from "react";
import "./Auth.css";

const Register = () => {
  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <span>&lt;/&gt;</span> CodeForge
        </div>

        <h2>Create Account</h2>

        <p className="auth-subtitle">Start your coding journey today.</p>

        <form>
          <label>Name</label>
          <input type="text" placeholder="Enter your name" />

          <label>Email</label>
          <input type="email" placeholder="Enter your email" />

          <label>Password</label>
          <input type="password" placeholder="Create a password" />

          <label>Confirm Password</label>
          <input type="password" placeholder="Confirm your password" />

          <button type="submit" className="auth-btn">
            Create Account
          </button>
        </form>

        <div className="divider">
          <span>OR</span>
        </div>

        <button className="google-btn">Continue with Google</button>

        <p className="auth-bottom">
          Already have an account?
          <a href="/login"> Login</a>
        </p>
      </div>
    </div>
  );
};

export default Register;
