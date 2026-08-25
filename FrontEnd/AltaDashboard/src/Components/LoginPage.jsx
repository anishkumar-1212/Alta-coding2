import React, { useState } from "react";
import "./LoginPage.css";

function Auth() {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div className="auth-page">
      <div className="auth-card">
        {/* Logo / Brand */}
        <div className="auth-brand">
          <div className="logo-box">&lt;/&gt;</div>
          <h1>
            Code<span>Forge</span> AI
          </h1>
        </div>

        {/* Heading */}
        <h2>{isLogin ? "Welcome back 👋" : "Create your account 🚀"}</h2>

        <p className="auth-subtitle">
          {isLogin
            ? "Continue your coding journey and start solving."
            : "Join CodeForge AI and start your coding journey."}
        </p>

        {/* Google Button */}
        <button className="google-btn">
          <span className="google-icon">G</span>
          Continue with Google
        </button>

        {/* Divider */}
        <div className="divider">
          <span></span>
          <p>or continue with email</p>
          <span></span>
        </div>

        {/* Register Name */}
        {!isLogin && (
          <div className="input-group">
            <label>Full Name</label>
            <input type="text" placeholder="Enter your name" />
          </div>
        )}

        {/* Email */}
        <div className="input-group">
          <label>Email</label>
          <input type="email" placeholder="Enter your email" />
        </div>

        {/* Password */}
        <div className="input-group">
          <label>Password</label>
          <input type="password" placeholder="Enter your password" />
        </div>

        {/* Register Confirm Password */}
        {!isLogin && (
          <div className="input-group">
            <label>Confirm Password</label>
            <input type="password" placeholder="Confirm your password" />
          </div>
        )}

        {/* Forgot Password */}
        {isLogin && (
          <div className="forgot-password">
            <span>Forgot password?</span>
          </div>
        )}

        {/* Submit */}
        <button className="submit-btn">
          {isLogin ? "Login" : "Create Account"}
        </button>

        {/* Switch Login/Register */}
        <p className="switch-auth">
          {isLogin ? "Don't have an account?" : "Already have an account?"}

          <button onClick={() => setIsLogin(!isLogin)}>
            {isLogin ? " Register" : " Login"}
          </button>
        </p>

        {/* Security */}
        <div className="security">
          🔒
          <span>Your information is securely protected.</span>
        </div>
      </div>
    </div>
  );
}

export default Auth;
