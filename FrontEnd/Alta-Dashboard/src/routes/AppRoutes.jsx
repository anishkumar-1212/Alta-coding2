import CodeRunner from "../Components/CodeRunner";
import { Routes, Route } from "react-router-dom";
import Home from "../Components/Home";
import Login from "../Components/Login";
import Register from "../Components/Register";
import AuthSuccess from "../Components/AuthSuccess";
import Account from "../Components/Account";
import QuestionPage from "../Pages/QuestionPage";

import StudentDashboard from "../Components/StudentDashboard";
import FacultyDashboard from "../Components/FacultyDashboard";
import AdminDashboard from "../Components/AdminDashboard";

import ProtectedRoute from "./ProtectedRoute";
import RoleRoute from "./RoleRoute";
import DashboardLayout from "../Components/DashboardLayout";

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />

      <Route path="/login" element={<Login />} />

      <Route path="/register" element={<Register />} />

      <Route path="/auth/success" element={<AuthSuccess />} />

      <Route path="/code-runner" element={<CodeRunner />} />

      <Route path="/question/:id" element={<QuestionPage />} />

      <Route element={<DashboardLayout />}>
        {/* Student */}
        <Route
          path="/student"
          element={
            <RoleRoute allowedRole="student">
              <StudentDashboard />
            </RoleRoute>
          }
        />

        {/* Faculty */}
        <Route
          path="/faculty"
          element={
            <RoleRoute allowedRole="faculty">
              <FacultyDashboard />
            </RoleRoute>
          }
        />

        {/* Admin */}
        <Route
          path="/admin"
          element={
            <RoleRoute allowedRole="admin">
              <AdminDashboard />
            </RoleRoute>
          }
        />
      </Route>

      {/* Account */}
      <Route
        path="/account"
        element={
          <ProtectedRoute>
            <Account />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
};

export default AppRoutes;
