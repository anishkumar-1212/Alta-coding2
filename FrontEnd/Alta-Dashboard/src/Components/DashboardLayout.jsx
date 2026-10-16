import { useState } from "react";
import { Link, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./DashboardLayout.css";

const DashboardLayout = () => {
  const { user, logout } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div
      className={`dashboard-container ${
        sidebarCollapsed ? "sidebar-collapsed" : ""
      }`}
    >
      <nav className="dashboard-navbar">
        <div className="navbar-left">
          <button
            className="navbar-menu-toggle"
            onClick={() => setSidebarCollapsed((value) => !value)}
            aria-label={
              sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"
            }
            title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            ☰
          </button>

          <Link to="/" className="dashboard-logo">
            CodeForge <span>AI</span>
          </Link>
        </div>

        <div className="dashboard-user">
          <div className="dashboard-user-info">
            <span className="dashboard-user-name">{user?.name || "User"}</span>
            <span className="dashboard-user-role">
              {user?.role || "student"}
            </span>
          </div>

          <button className="logout-btn" onClick={logout}>
            Logout
          </button>
        </div>
      </nav>

      <div className="dashboard-body">
        <aside className="dashboard-sidebar">
          <p className="sidebar-title">Dashboard</p>

          {user?.role === "student" && (
            <>
              <Link to="/student" className="sidebar-link" title="Overview">
                <span className="sidebar-icon">⌂</span>
                <span className="sidebar-link-label">Overview</span>
              </Link>

              <Link
                to="/student/questions"
                className="sidebar-link"
                title="Question Bank"
              >
                <span className="sidebar-icon">▤</span>
                <span className="sidebar-link-label">Question Bank</span>
              </Link>
            </>
          )}

          {user?.role === "faculty" && (
            <>
              <Link to="/faculty" className="sidebar-link" title="Overview">
                <span className="sidebar-icon">⌂</span>
                <span className="sidebar-link-label">Overview</span>
              </Link>

              <Link
                to="/faculty/questions"
                className="sidebar-link"
                title="Manage Questions"
              >
                <span className="sidebar-icon">▤</span>
                <span className="sidebar-link-label">Manage Questions</span>
              </Link>
            </>
          )}

          {user?.role === "admin" && (
            <>
              <Link to="/admin" className="sidebar-link" title="Overview">
                <span className="sidebar-icon">⌂</span>
                <span className="sidebar-link-label">Overview</span>
              </Link>

              <Link
                to="/admin/questions"
                className="sidebar-link"
                title="Manage Questions"
              >
                <span className="sidebar-icon">▤</span>
                <span className="sidebar-link-label">Manage Questions</span>
              </Link>
            </>
          )}

          <Link to="/account" className="sidebar-link" title="Account">
            <span className="sidebar-icon">◎</span>
            <span className="sidebar-link-label">Account</span>
          </Link>
        </aside>

        <main className="dashboard-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
