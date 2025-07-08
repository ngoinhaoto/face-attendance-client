import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

// Import components
import AdminDashboard from "../../admin/AdminDashboard";
import UsersList from "../../admin/UsersList";
import ClassesList from "../../admin/ClassesList";
import UserProfile from "../UserProfile";
import StudentDashboard from "../../student/StudentDashboard";
import AttendanceCheckIn from "../../student/AttendanceCheckIn";

import TeacherDashboard from "../../teacher/TeacherDashboard";
import ClassSessionsPage from "../../teacher/ClassSessionsPage";

import SessionAttendancePage from "../../teacher/SessionAttendancePage";
import SessionDetailsPage from "../../teacher/SessionDetailsPage";
import TeacherSessionsList from "../../teacher/TeacherSessionsList";
import ClassAttendanceSummaryPage from "../../teacher/ClassAttendanceSummaryPage";

const DashboardRoutes = ({ user }) => {
  // Redirect to login if user data is missing
  if (!user || !user.role) {
    return <Navigate to="/login" />;
  }

  switch (user.role) {
    case "admin":
      return <AdminRoutes />;
    case "teacher":
      return <TeacherRoutes />;
    case "student":
      return <StudentRoutes />;
    default:
      return <Navigate to="/login" />;
  }
};

const AdminRoutes = () => (
  <Routes>
    <Route path="/profile" element={<UserProfile />} />
    <Route path="/users" element={<UsersList />} />
    <Route path="/classes" element={<ClassesList />} />
    <Route path="/" element={<AdminDashboard />} />
    <Route path="*" element={<Navigate to="/dashboard" />} />
  </Routes>
);

const TeacherRoutes = () => (
  <Routes>
    <Route path="/profile" element={<UserProfile />} />
    <Route path="/classes" element={<ClassesList />} />
    <Route path="/" element={<TeacherDashboard />} />

    {/* Class Management Routes */}
    <Route path="/classes/:classId/sessions" element={<ClassSessionsPage />} />
    <Route
      path="/classes/:classId/attendance"
      element={<ClassAttendanceSummaryPage />}
    />
    <Route
      path="/classes/:classId/sessions/:sessionId"
      element={<SessionDetailsPage />}
    />
    <Route
      path="/classes/:classId/sessions/:sessionId/attendance"
      element={<SessionAttendancePage />}
    />

    {/* Additional Teacher-specific routes */}
    <Route path="/my-classes" element={<TeacherDashboard />} />
    <Route
      path="/upcoming-sessions"
      element={
        <TeacherSessionsList
          sessions={[]}
          upcoming={true}
          emptyMessage="No upcoming sessions"
        />
      }
    />
    <Route
      path="/recent-sessions"
      element={
        <TeacherSessionsList
          sessions={[]}
          upcoming={false}
          emptyMessage="No recent sessions"
        />
      }
    />

    <Route path="*" element={<Navigate to="/dashboard" />} />
  </Routes>
);
const StudentRoutes = () => (
  <Routes>
    <Route path="/profile" element={<UserProfile />} />
    <Route path="/attendance" element={<AttendanceCheckIn />} />
    <Route path="/" element={<StudentDashboard />} />
    <Route path="*" element={<Navigate to="/dashboard" />} />
  </Routes>
);

export default DashboardRoutes;
