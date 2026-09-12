import { useAuth } from "../context/AuthContext";

const StudentDashboard = () => {
  const { user } = useAuth();

  return (
    <div>
      <h1>Welcome, {user?.name}</h1>

      <p>
        Continue your coding journey and improve your problem-solving skills.
      </p>

      <div>
        <h3>Student Dashboard</h3>

        <p>Email: {user?.email}</p>
        <p>Role: {user?.role}</p>
      </div>
    </div>
  );
};

export default StudentDashboard;
