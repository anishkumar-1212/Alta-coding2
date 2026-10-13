import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Contest.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5001";

const ContestLobby = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [contests, setContests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [registeringId, setRegisteringId] = useState(null);

  const fetchContests = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      const response = await fetch(`${API_URL}/api/contests`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to load contests");
      }

      setContests(data.contests || []);
    } catch (err) {
      setError(err.message || "Unable to retrieve contests list");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContests();
  }, []);

  const handleRegister = async (contestId) => {
    try {
      setRegisteringId(contestId);
      const token = localStorage.getItem("token");

      const response = await fetch(`${API_URL}/api/contests/${contestId}/register`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();
      if (!response.ok) {
        alert(data.message || "Registration failed");
        return;
      }

      alert("Successfully registered for contest!");
      fetchContests();
    } catch (err) {
      alert("Error registering for contest: " + err.message);
    } finally {
      setRegisteringId(null);
    }
  };

  const filteredContests = contests.filter((c) => {
    const status = c.serverStatus || c.status;
    if (activeTab === "live") return status === "live";
    if (activeTab === "upcoming")
      return status === "scheduled" || status === "registration_open";
    if (activeTab === "past") return status === "ended" || status === "evaluated";
    return true;
  });

  return (
    <div className="contest-page">
      <div className="contest-header">
        <div>
          <h1>Contests Lobby</h1>
          <p>Compete with peers in real-time time-boxed coding challenges.</p>
        </div>

        {user?.role === "faculty" && (
          <button
            className="primary-btn"
            onClick={() => navigate("/faculty/contests")}
          >
            + Create / Manage Contests
          </button>
        )}
      </div>

      <div className="contest-tabs">
        <button
          className={`contest-tab ${activeTab === "all" ? "active" : ""}`}
          onClick={() => setActiveTab("all")}
        >
          All Contests ({contests.length})
        </button>
        <button
          className={`contest-tab ${activeTab === "live" ? "active" : ""}`}
          onClick={() => setActiveTab("live")}
        >
          🔴 Live Now (
          {contests.filter((c) => (c.serverStatus || c.status) === "live").length}
          )
        </button>
        <button
          className={`contest-tab ${activeTab === "upcoming" ? "active" : ""}`}
          onClick={() => setActiveTab("upcoming")}
        >
          Upcoming (
          {
            contests.filter((c) =>
              ["scheduled", "registration_open"].includes(c.serverStatus || c.status)
            ).length
          }
          )
        </button>
        <button
          className={`contest-tab ${activeTab === "past" ? "active" : ""}`}
          onClick={() => setActiveTab("past")}
        >
          Past / Concluded (
          {
            contests.filter((c) =>
              ["ended", "evaluated"].includes(c.serverStatus || c.status)
            ).length
          }
          )
        </button>
      </div>

      {error && <div className="question-error">{error}</div>}

      {loading ? (
        <div className="empty-questions">
          <h2>Loading contests...</h2>
        </div>
      ) : filteredContests.length === 0 ? (
        <div className="empty-questions">
          <h2>No contests found in this category</h2>
          <p>Check back later or view other contest tabs.</p>
        </div>
      ) : (
        <div className="contest-list">
          {filteredContests.map((c) => {
            const status = c.serverStatus || c.status;
            const isLive = status === "live";

            return (
              <div key={c._id} className="contest-card">
                <div className="contest-card-info">
                  <div className="contest-card-title-row">
                    <h2>{c.title}</h2>
                    <span className={`contest-status-pill status-${status}`}>
                      {isLive ? "● LIVE NOW" : status.replace("_", " ")}
                    </span>
                  </div>

                  <p className="contest-desc">{c.description}</p>

                  <div className="contest-meta">
                    <div className="contest-meta-item">
                      📅 <strong>Starts:</strong>{" "}
                      {new Date(c.startTime).toLocaleString()}
                    </div>
                    <div className="contest-meta-item">
                      ⏳ <strong>Ends:</strong>{" "}
                      {new Date(c.endTime).toLocaleString()}
                    </div>
                    <div className="contest-meta-item">
                      🧩 <strong>Problems:</strong> {c.questionCount || 0}
                    </div>
                  </div>
                </div>

                <div className="contest-actions">
                  {isLive ? (
                    <button
                      className="btn-enter-contest"
                      onClick={() => navigate(`/student/contest/${c._id}`)}
                    >
                      Enter Contest Workspace 🚀
                    </button>
                  ) : c.isRegistered ? (
                    <button className="btn-registered" disabled>
                      ✓ Registered
                    </button>
                  ) : status === "ended" || status === "evaluated" ? (
                    <button
                      className="secondary-btn"
                      onClick={() => navigate(`/student/contest/${c._id}`)}
                    >
                      View Problems & Standings
                    </button>
                  ) : user?.role === "student" ? (
                    <button
                      className="btn-register-contest"
                      onClick={() => handleRegister(c._id)}
                      disabled={registeringId === c._id}
                    >
                      {registeringId === c._id ? "Registering..." : "Register Now"}
                    </button>
                  ) : (
                    <button
                      className="secondary-btn"
                      onClick={() => navigate(`/faculty/contests`)}
                    >
                      Manage Contest
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ContestLobby;
