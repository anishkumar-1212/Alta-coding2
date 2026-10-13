import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Contest.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5001";

const FacultyContests = () => {
  const navigate = useNavigate();

  const [contests, setContests] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Create contest form state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [creating, setCreating] = useState(false);

  // Leaderboard modal
  const [selectedContestId, setSelectedContestId] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  const fetchContestsAndQuestions = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      // 1. Fetch contests
      const cRes = await fetch(`${API_URL}/api/contests`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const cData = await cRes.json();
      if (cRes.ok) setContests(cData.contests || []);

      // 2. Fetch questions for selection
      const qRes = await fetch(`${API_URL}/api/questions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const qData = await qRes.json();
      if (qRes.ok) setQuestions(qData.questions || []);
    } catch (err) {
      setError(err.message || "Failed to load contests data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContestsAndQuestions();
  }, []);

  const handleCreateContest = async (e) => {
    e.preventDefault();
    if (!title || !description || !startTime || !endTime) {
      alert("Please fill in title, description, start time, and end time.");
      return;
    }

    try {
      setCreating(true);
      const token = localStorage.getItem("token");

      const questionsPayload = selectedQuestions.map((qId, index) => ({
        question: qId,
        points: 100,
        order: index + 1,
      }));

      const res = await fetch(`${API_URL}/api/contests`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          description,
          startTime,
          endTime,
          questions: questionsPayload,
          status: "scheduled",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.message || "Failed to create contest");
        return;
      }

      alert("Contest created and scheduled successfully!");
      setTitle("");
      setDescription("");
      setStartTime("");
      setEndTime("");
      setSelectedQuestions([]);
      setShowCreateForm(false);
      fetchContestsAndQuestions();
    } catch (err) {
      alert("Error creating contest: " + err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleUpdateState = async (contestId, newStatus) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/api/contests/${contestId}/state`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.message || "State update failed");
        return;
      }

      fetchContestsAndQuestions();
    } catch (err) {
      alert("Error updating contest state: " + err.message);
    }
  };

  const handleViewLeaderboard = async (contestId) => {
    try {
      setSelectedContestId(contestId);
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/api/contests/${contestId}/leaderboard`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setLeaderboard(data.leaderboard || []);
        setShowLeaderboard(true);
      }
    } catch (err) {
      alert("Failed to load leaderboard: " + err.message);
    }
  };

  const toggleQuestionSelection = (qId) => {
    if (selectedQuestions.includes(qId)) {
      setSelectedQuestions(selectedQuestions.filter((id) => id !== qId));
    } else {
      setSelectedQuestions([...selectedQuestions, qId]);
    }
  };

  return (
    <div className="contest-page">
      <div className="contest-header">
        <div>
          <h1>Faculty Contest Management</h1>
          <p>Create, schedule, and evaluate time-boxed coding contests.</p>
        </div>

        <div style={{ display: "flex", gap: "12px" }}>
          <button
            className="primary-btn"
            onClick={() => setShowCreateForm(!showCreateForm)}
          >
            {showCreateForm ? "Cancel" : "+ Build New Contest"}
          </button>
          <button
            className="secondary-btn"
            onClick={() => navigate("/student/contests")}
          >
            Preview Lobby
          </button>
        </div>
      </div>

      {error && <div className="question-error">{error}</div>}

      {/* Contest Builder Form */}
      {showCreateForm && (
        <div className="faculty-form-card">
          <h2>Create Time-Boxed Contest</h2>
          <form onSubmit={handleCreateContest}>
            <div className="form-grid">
              <div className="form-group">
                <label>Contest Title</label>
                <input
                  type="text"
                  placeholder="e.g. CodeForge Biweekly Challenge #1"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <input
                  type="text"
                  placeholder="Rules, target cohort, and instructions..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Start Date & Time (Server Checked)</label>
                <input
                  type="datetime-local"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>End Date & Time (Server Checked)</label>
                <input
                  type="datetime-local"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: "16px" }}>
              <label>Select Questions to Include ({selectedQuestions.length} selected):</label>
              <div
                style={{
                  maxHeight: "180px",
                  overflowY: "auto",
                  border: "1px solid #cbd5e1",
                  borderRadius: "8px",
                  padding: "10px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "6px",
                }}
              >
                {questions.map((q) => (
                  <label
                    key={q._id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      cursor: "pointer",
                      fontSize: "14px",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedQuestions.includes(q._id)}
                      onChange={() => toggleQuestionSelection(q._id)}
                    />
                    <span><strong>{q.title}</strong> ({q.difficulty})</span>
                  </label>
                ))}
              </div>
            </div>

            <button type="submit" className="primary-btn" disabled={creating}>
              {creating ? "Scheduling Contest..." : "Save & Schedule Contest"}
            </button>
          </form>
        </div>
      )}

      {/* Contests List */}
      <h2>Your Contests ({contests.length})</h2>
      {loading ? (
        <div className="empty-questions">Loading contests...</div>
      ) : contests.length === 0 ? (
        <div className="empty-questions">
          <h3>No contests created yet</h3>
          <p>Click "+ Build New Contest" above to schedule your first contest.</p>
        </div>
      ) : (
        <div className="contest-list">
          {contests.map((c) => {
            const status = c.serverStatus || c.status;
            return (
              <div key={c._id} className="contest-card">
                <div className="contest-card-info">
                  <div className="contest-card-title-row">
                    <h2>{c.title}</h2>
                    <span className={`contest-status-pill status-${status}`}>
                      {status.replace("_", " ")}
                    </span>
                  </div>

                  <p className="contest-desc">{c.description}</p>

                  <div className="contest-meta">
                    <div className="contest-meta-item">
                      📅 <strong>Window:</strong>{" "}
                      {new Date(c.startTime).toLocaleString()} -{" "}
                      {new Date(c.endTime).toLocaleTimeString()}
                    </div>
                    <div className="contest-meta-item">
                      🧩 <strong>Problems:</strong> {c.questions?.length || 0}
                    </div>
                  </div>
                </div>

                <div className="contest-actions">
                  <button
                    className="primary-btn"
                    style={{ padding: "8px 14px", fontSize: "13px" }}
                    onClick={() => handleViewLeaderboard(c._id)}
                  >
                    🏆 View Standings
                  </button>

                  {status !== "archived" ? (
                    <button
                      className="secondary-btn"
                      style={{ padding: "8px 14px", fontSize: "13px" }}
                      onClick={() => handleUpdateState(c._id, "archived")}
                    >
                      Archive Contest
                    </button>
                  ) : (
                    <button
                      className="secondary-btn"
                      style={{ padding: "8px 14px", fontSize: "13px" }}
                      onClick={() => handleUpdateState(c._id, "scheduled")}
                    >
                      Unarchive
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Leaderboard Modal */}
      {showLeaderboard && (
        <div className="modal-overlay" onClick={() => setShowLeaderboard(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>🏆 Contest Leaderboard</h2>
              <button
                className="modal-close-btn"
                onClick={() => setShowLeaderboard(false)}
              >
                ✕
              </button>
            </div>

            {leaderboard.length === 0 ? (
              <p style={{ color: "#64748b" }}>
                No submissions or participant scores recorded yet.
              </p>
            ) : (
              <table className="submissions-table">
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Participant</th>
                    <th>Score</th>
                    <th>Penalty</th>
                    <th>Problems Solved</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((item) => (
                    <tr key={item.userId}>
                      <td><strong>#{item.rank}</strong></td>
                      <td>{item.name}</td>
                      <td style={{ color: "#2563eb", fontWeight: "700" }}>
                        {item.score}
                      </td>
                      <td>{item.totalPenalty} min</td>
                      <td>{item.solvedCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default FacultyContests;
