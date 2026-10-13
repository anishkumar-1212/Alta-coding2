import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import CodeRunner from "./CodeRunner";
import "./Contest.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5001";

const ContestWorkspace = () => {
  const { contestId } = useParams();
  const navigate = useNavigate();

  const [contest, setContest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedProblemIndex, setSelectedProblemIndex] = useState(0);

  // Server-authoritative timer state
  const [secondsRemaining, setSecondsRemaining] = useState(0);
  const [isLive, setIsLive] = useState(false);

  // Leaderboard modal
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [leaderboard, setLeaderboard] = useState([]);

  // Submission state
  const [submitting, setSubmitting] = useState(false);
  const [submissionVerdict, setSubmissionVerdict] = useState(null);

  // Fetch contest details
  const fetchContest = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/api/contests/${contestId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to load contest");
      }
      setContest(data.contest);
    } catch (err) {
      setError(err.message || "Unable to fetch contest");
    } finally {
      setLoading(false);
    }
  };

  // Sync server timer
  const syncServerTimer = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/api/contests/${contestId}/time`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.time) {
        setSecondsRemaining(data.time.timeRemainingSeconds);
        setIsLive(data.time.isLive);
      }
    } catch (err) {
      console.error("Timer sync error:", err);
    }
  };

  useEffect(() => {
    fetchContest();
    syncServerTimer();

    // Re-sync with server clock every 30 seconds to prevent client drift
    const syncInterval = setInterval(syncServerTimer, 30000);
    return () => clearInterval(syncInterval);
  }, [contestId]);

  // Local second-by-second countdown
  useEffect(() => {
    if (secondsRemaining <= 0) return;

    const interval = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          setIsLive(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [secondsRemaining]);

  const fetchLeaderboard = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/api/contests/${contestId}/leaderboard`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setLeaderboard(data.leaderboard || []);
      }
    } catch (err) {
      console.error("Leaderboard error:", err);
    }
  };

  const openLeaderboard = () => {
    fetchLeaderboard();
    setShowLeaderboard(true);
  };

  // Format seconds to HH:MM:SS
  const formatTimer = (secs) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // Submit contest code
  const handleContestSubmit = async ({ code, language }) => {
    const activeQ = contest?.questions?.[selectedProblemIndex]?.question;
    const questionId = activeQ?._id || activeQ?.id;

    if (!questionId) {
      alert("No question selected");
      return;
    }

    if (!isLive && secondsRemaining === 0) {
      alert("Contest has ended! Submissions are no longer accepted.");
      return;
    }

    setSubmitting(true);
    setSubmissionVerdict({ status: "Queued", result: "Queued for grading..." });

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${API_URL}/api/contests/${contestId}/questions/${questionId}/submit`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            "x-idempotency-key": window.crypto.randomUUID(),
          },
          body: JSON.stringify({ code, language }),
        }
      );

      const data = await res.json();
      if (!res.ok) {
        setSubmissionVerdict({
          status: "failed",
          result: data.message || "Submission failed",
        });
        setSubmitting(false);
        return;
      }

      const subId = data.submission?._id;

      // Poll verdict
      const pollInterval = setInterval(async () => {
        try {
          const pollRes = await fetch(`${API_URL}/api/submissions/${subId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const pollData = await pollRes.json();
          if (pollRes.ok) {
            setSubmissionVerdict(pollData);
            if (pollData.status !== "pending" && pollData.status !== "running") {
              clearInterval(pollInterval);
              setSubmitting(false);
              fetchContest();
            }
          }
        } catch (pollErr) {
          console.error("Poll error:", pollErr);
        }
      }, 2000);
    } catch (err) {
      setSubmissionVerdict({
        status: "failed",
        result: err.message || "Failed to submit code",
      });
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="contest-page">
        <h2>Loading contest workspace...</h2>
      </div>
    );
  }

  if (error || !contest) {
    return (
      <div className="contest-page">
        <div className="question-error">{error || "Contest not found."}</div>
        <button
          className="primary-btn"
          style={{ marginTop: "16px" }}
          onClick={() => navigate("/student/contests")}
        >
          Back to Lobby
        </button>
      </div>
    );
  }

  const currentContestQ = contest.questions?.[selectedProblemIndex];
  const currentProblem = currentContestQ?.question;

  return (
    <div className="contest-workspace">
      {/* Top Bar */}
      <div className="contest-workspace-bar">
        <div className="workspace-contest-title">
          <button
            className="secondary-btn"
            style={{ padding: "6px 12px", fontSize: "12px", background: "#1e293b", color: "#f8fafc" }}
            onClick={() => navigate("/student/contests")}
          >
            ← Lobby
          </button>
          <span>{contest.title}</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div
            className={`workspace-timer-box ${
              secondsRemaining < 300 ? "workspace-timer-urgent" : ""
            }`}
          >
            <span>⏱️</span>
            <span>
              {isLive
                ? `Ends in: ${formatTimer(secondsRemaining)}`
                : secondsRemaining > 0
                ? `Starts in: ${formatTimer(secondsRemaining)}`
                : "CONTEST ENDED"}
            </span>
          </div>

          <button
            className="primary-btn"
            style={{ padding: "8px 16px", background: "#3b82f6" }}
            onClick={openLeaderboard}
          >
            🏆 Live Standings
          </button>
        </div>
      </div>

      {/* Main Split Layout */}
      <div className="contest-workspace-main">
        {/* Left: Problem Navigator & Problem Statement */}
        <div className="contest-problem-nav">
          <div className="problem-nav-header">Contest Problems</div>

          <div className="problem-tabs-list">
            {contest.questions?.map((item, idx) => {
              const qObj = item.question;
              const isSolved = contest.participant?.solvedProblems?.some(
                (sp) => sp.question.toString() === (qObj?._id || "").toString()
              );

              return (
                <div
                  key={idx}
                  className={`problem-tab-item ${
                    selectedProblemIndex === idx ? "active" : ""
                  }`}
                  onClick={() => {
                    setSelectedProblemIndex(idx);
                    setSubmissionVerdict(null);
                  }}
                >
                  <div>
                    <span style={{ fontWeight: "700", marginRight: "6px" }}>
                      {String.fromCharCode(65 + idx)}.
                    </span>
                    <span className="problem-tab-title">
                      {qObj?.title || `Problem ${idx + 1}`}
                    </span>
                    {isSolved && (
                      <span style={{ color: "#16a34a", marginLeft: "6px" }}>
                        ✓
                      </span>
                    )}
                  </div>
                  <span className="problem-tab-points">{item.points} pts</span>
                </div>
              );
            })}
          </div>

          {/* Selected Problem Description Pane */}
          {currentProblem ? (
            <div className="problem-detail-pane">
              <h3>{currentProblem.title}</h3>
              <p>{currentProblem.description}</p>

              {currentProblem.constraints && (
                <>
                  <h4 style={{ margin: "14px 0 6px", fontSize: "14px" }}>
                    Constraints
                  </h4>
                  <p style={{ background: "#f8fafc", padding: "8px", borderRadius: "6px", fontFamily: "monospace" }}>
                    {currentProblem.constraints}
                  </p>
                </>
              )}

              {currentProblem.sampleInput && (
                <>
                  <h4 style={{ margin: "14px 0 6px", fontSize: "14px" }}>
                    Sample Input
                  </h4>
                  <pre style={{ background: "#f1f5f9", padding: "8px", borderRadius: "6px" }}>
                    {currentProblem.sampleInput}
                  </pre>
                </>
              )}

              {currentProblem.sampleOutput && (
                <>
                  <h4 style={{ margin: "14px 0 6px", fontSize: "14px" }}>
                    Sample Output
                  </h4>
                  <pre style={{ background: "#f1f5f9", padding: "8px", borderRadius: "6px" }}>
                    {currentProblem.sampleOutput}
                  </pre>
                </>
              )}
            </div>
          ) : (
            <div className="problem-detail-pane">
              <p>Problem statement will be displayed once contest is Live.</p>
            </div>
          )}
        </div>

        {/* Right: Code Editor & Submission */}
        <div className="workspace-editor-pane">
          {submissionVerdict && (
            <div
              style={{
                padding: "12px 16px",
                borderRadius: "8px",
                marginBottom: "12px",
                background:
                  submissionVerdict.status === "accepted"
                    ? "#dcfce7"
                    : submissionVerdict.status === "wrong_answer"
                    ? "#fee2e2"
                    : "#eff6ff",
                color:
                  submissionVerdict.status === "accepted"
                    ? "#15803d"
                    : submissionVerdict.status === "wrong_answer"
                    ? "#b91c1c"
                    : "#1e40af",
                fontWeight: "600",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span>Verdict: {submissionVerdict.result || submissionVerdict.status}</span>
              {submissionVerdict.executionTime > 0 && (
                <span style={{ fontSize: "12px", fontWeight: "normal" }}>
                  Time: {submissionVerdict.executionTime} ms | Memory: {submissionVerdict.memoryUsed} KB
                </span>
              )}
            </div>
          )}

          {currentProblem ? (
            <CodeRunner
              question={currentProblem}
              onSubmit={handleContestSubmit}
            />
          ) : (
            <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>
              Select a problem on the left to begin coding.
            </div>
          )}
        </div>
      </div>

      {/* Leaderboard Modal */}
      {showLeaderboard && (
        <div className="modal-overlay" onClick={() => setShowLeaderboard(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>🏆 Contest Standings</h2>
              <button
                className="modal-close-btn"
                onClick={() => setShowLeaderboard(false)}
              >
                ✕
              </button>
            </div>

            {leaderboard.length === 0 ? (
              <p style={{ color: "#64748b" }}>
                No submissions recorded yet for this contest.
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

export default ContestWorkspace;
