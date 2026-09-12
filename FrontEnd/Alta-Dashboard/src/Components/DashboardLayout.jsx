import { useAuth } from "../context/AuthContext";
import "./StudentDashboard.css";

const StudentDashboard = () => {
  const { user } = useAuth();

  return (
    <div className="student-dashboard">
      <div className="dashboard-header">
        <h1>Welcome, {user?.name}</h1>
        <p>
          Continue your coding journey and improve your problem-solving skills.
        </p>
      </div>

      <div className="dashboard-cards">
        <div className="dashboard-card">
          <h3>Problems Solved</h3>
          <p>0</p>
        </div>

        <div className="dashboard-card">
          <h3>Current Streak</h3>
          <p>0 Days</p>
        </div>

        <div className="dashboard-card">
          <h3>Problems Attempted</h3>
          <p>0</p>
        </div>
      </div>

      <div className="dashboard-section">
        <h2>Start Coding</h2>

        <p>Practice coding problems and build your problem-solving skills.</p>

        <button>Explore Problems</button>
      </div>
    </div>
  );
};

export default StudentDashboard;
