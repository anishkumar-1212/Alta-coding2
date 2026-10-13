import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./StudentDashboard.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5001";

const StudentDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");

        const response = await fetch(`${API_URL}/api/practice/stats`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        const json = await response.json();
        if (!response.ok) {
          throw new Error(json.message || "Failed to load dashboard data");
        }

        setStats(json.data);
      } catch (err) {
        setError(err.message || "Unable to load dashboard metrics");
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  // Generate 60 days dummy/real heatmap grid
  const renderHeatmap = () => {
    const activityMap = new Map();
    if (stats?.streak?.activityDates) {
      stats.streak.activityDates.forEach((entry) => {
        activityMap.set(entry.date, entry.count);
      });
    }

    const days = [];
    for (let i = 59; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const dateStr = d.toISOString().slice(0, 10);
      const count = activityMap.get(dateStr) || 0;

      let lvlClass = "";
      if (count >= 5) lvlClass = "heatmap-lvl-4";
      else if (count >= 3) lvlClass = "heatmap-lvl-3";
      else if (count >= 2) lvlClass = "heatmap-lvl-2";
      else if (count >= 1) lvlClass = "heatmap-lvl-1";

      days.push(
        <div
          key={dateStr}
          className={`heatmap-day ${lvlClass}`}
          title={`${dateStr}: ${count} submission(s)`}
        />
      );
    }

    return days;
  };

  if (loading) {
    return (
      <div className="student-dashboard">
        <div className="card-title">Loading student analytics & progress...</div>
      </div>
    );
  }

  const progress = stats?.progress || {
    totalSolved: 0,
    easySolved: 0,
    mediumSolved: 0,
    hardSolved: 0,
    totalQuestions: 0,
    easyTotal: 0,
    mediumTotal: 0,
    hardTotal: 0,
  };

  const streak = stats?.streak || {
    currentStreak: 0,
    maxStreak: 0,
    lastActiveDate: null,
  };

  const topicMastery = stats?.topicMastery || [];
  const recentSubmissions = stats?.recentSubmissions || [];

  return (
    <div className="student-dashboard">
      {/* Header */}
      <div className="student-dashboard-header">
        <div>
          <h1>Welcome back, {user?.name || "Student"}!</h1>
          <p>Track your coding streak, practice problems, and join upcoming contests.</p>
        </div>

        <div className="dashboard-cta-group">
          <button
            className="primary-btn"
            onClick={() => navigate("/student/questions")}
          >
            Practice Questions
          </button>
          <button
            className="secondary-btn"
            onClick={() => navigate("/student/contests")}
          >
            Contests Lobby
          </button>
        </div>
      </div>

      {error && <div className="question-error">{error}</div>}

      {/* Streak Hero Banner */}
      <div className="streak-hero-card">
        <div className="streak-left">
          <span className="streak-flame-icon">🔥</span>
          <div className="streak-details">
            <h2>
              {streak.currentStreak} Day Streak
              {streak.currentStreak > 0 && <span>⚡ Active</span>}
            </h2>
            <p>
              {streak.currentStreak > 0
                ? "Keep solving at least one problem daily to maintain your momentum!"
                : "Solve a question today to ignite your daily coding streak!"}
            </p>
          </div>
        </div>

        <div className="streak-stats-pill">
          <div className="streak-stat-item">
            <span className="streak-stat-label">Current</span>
            <span className="streak-stat-val">{streak.currentStreak} d</span>
          </div>
          <div className="streak-stat-item">
            <span className="streak-stat-label">Personal Best</span>
            <span className="streak-stat-val">{streak.maxStreak} d</span>
          </div>
        </div>
      </div>

      {/* Solved Problems Breakdown */}
      <div className="solved-breakdown-grid">
        <div className="metric-card">
          <div className="metric-card-title">Total Solved</div>
          <div className="metric-card-val">
            {progress.totalSolved}
            <span style={{ fontSize: "16px", color: "#64748b", fontWeight: "normal" }}>
              {" "}/ {progress.totalQuestions || "—"}
            </span>
          </div>
          <div className="metric-progress-bg">
            <div
              className="metric-progress-fill metric-fill-total"
              style={{
                width: `${
                  progress.totalQuestions
                    ? Math.min(100, Math.round((progress.totalSolved / progress.totalQuestions) * 100))
                    : 0
                }%`,
              }}
            />
          </div>
          <div className="metric-sub">
            {progress.totalQuestions
              ? `${Math.round((progress.totalSolved / progress.totalQuestions) * 100)}% Completed`
              : "0% Completed"}
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-card-title">Easy Problems</div>
          <div className="metric-card-val" style={{ color: "#16a34a" }}>
            {progress.easySolved}
            <span style={{ fontSize: "16px", color: "#64748b", fontWeight: "normal" }}>
              {" "}/ {progress.easyTotal || "—"}
            </span>
          </div>
          <div className="metric-progress-bg">
            <div
              className="metric-progress-fill metric-fill-easy"
              style={{
                width: `${
                  progress.easyTotal
                    ? Math.min(100, Math.round((progress.easySolved / progress.easyTotal) * 100))
                    : 0
                }%`,
              }}
            />
          </div>
          <div className="metric-sub">Foundation & Basics</div>
        </div>

        <div className="metric-card">
          <div className="metric-card-title">Medium Problems</div>
          <div className="metric-card-val" style={{ color: "#d97706" }}>
            {progress.mediumSolved}
            <span style={{ fontSize: "16px", color: "#64748b", fontWeight: "normal" }}>
              {" "}/ {progress.mediumTotal || "—"}
            </span>
          </div>
          <div className="metric-progress-bg">
            <div
              className="metric-progress-fill metric-fill-medium"
              style={{
                width: `${
                  progress.mediumTotal
                    ? Math.min(100, Math.round((progress.mediumSolved / progress.mediumTotal) * 100))
                    : 0
                }%`,
              }}
            />
          </div>
          <div className="metric-sub">Core Interview Level</div>
        </div>

        <div className="metric-card">
          <div className="metric-card-title">Hard Problems</div>
          <div className="metric-card-val" style={{ color: "#dc2626" }}>
            {progress.hardSolved}
            <span style={{ fontSize: "16px", color: "#64748b", fontWeight: "normal" }}>
              {" "}/ {progress.hardTotal || "—"}
            </span>
          </div>
          <div className="metric-progress-bg">
            <div
              className="metric-progress-fill metric-fill-hard"
              style={{
                width: `${
                  progress.hardTotal
                    ? Math.min(100, Math.round((progress.hardSolved / progress.hardTotal) * 100))
                    : 0
                }%`,
              }}
            />
          </div>
          <div className="metric-sub">Advanced Algorithms</div>
        </div>
      </div>

      {/* 2-column: Heatmap & Topic Mastery */}
      <div className="dashboard-columns">
        <div className="dashboard-card">
          <div className="card-title">Activity Heatmap (Past 60 Days)</div>
          <p style={{ color: "#64748b", fontSize: "13px", marginTop: "-10px", marginBottom: "16px" }}>
            Visual record of your daily practice submissions and consistency.
          </p>
          <div className="heatmap-container">
            <div className="heatmap-grid">{renderHeatmap()}</div>
            <div className="heatmap-legend">
              <span>Less</span>
              <div className="heatmap-day" />
              <div className="heatmap-day heatmap-lvl-1" />
              <div className="heatmap-day heatmap-lvl-2" />
              <div className="heatmap-day heatmap-lvl-3" />
              <div className="heatmap-day heatmap-lvl-4" />
              <span>More</span>
            </div>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="card-title">Top Topic Mastery</div>
          {topicMastery.length === 0 ? (
            <p style={{ color: "#64748b", fontSize: "14px" }}>
              No topics solved yet. Solve questions in the Question Bank to build your topic profile!
            </p>
          ) : (
            <div className="topic-list">
              {topicMastery.map((item, idx) => (
                <div key={idx} className="topic-item">
                  <span className="topic-name">{item.topic}</span>
                  <span className="topic-count">{item.solvedCount} solved</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Submissions Table */}
      <div className="recent-submissions-card">
        <div className="card-title">Recent Submissions</div>
        {recentSubmissions.length === 0 ? (
          <p style={{ color: "#64748b", fontSize: "14px" }}>
            You haven't submitted any solutions yet. Jump into the Question Bank to get started!
          </p>
        ) : (
          <table className="submissions-table">
            <thead>
              <tr>
                <th>Problem</th>
                <th>Difficulty</th>
                <th>Verdict</th>
                <th>Language</th>
                <th>Runtime</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {recentSubmissions.map((sub) => (
                <tr key={sub.id}>
                  <td>
                    {sub.questionId ? (
                      <Link
                        to={`/student/coding/${sub.questionId}`}
                        className="submission-link"
                      >
                        {sub.questionTitle}
                      </Link>
                    ) : (
                      sub.questionTitle
                    )}
                  </td>
                  <td>
                    <span
                      className={`difficulty difficulty-${(sub.difficulty || "medium").toLowerCase()}`}
                    >
                      {sub.difficulty}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`verdict-badge verdict-${sub.status || "other"}`}
                    >
                      {sub.result || sub.status}
                    </span>
                  </td>
                  <td style={{ textTransform: "capitalize" }}>{sub.language}</td>
                  <td>{sub.executionTime ? `${sub.executionTime} ms` : "—"}</td>
                  <td style={{ color: "#94a3b8", fontSize: "13px" }}>
                    {new Date(sub.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default StudentDashboard;
