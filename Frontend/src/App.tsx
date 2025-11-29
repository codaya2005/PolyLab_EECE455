// src/App.tsx
import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LandingPage from "@/pages/LandingPage";
import SignUp from "@/pages/SignUp";
import Login from "@/pages/Login";
import CalculatorPage from "@/pages/Calculator";
import StudentDashboard from "./pages/StudentDashboard";
import RequestInstructor from "./pages/RequestInstructor";
import InstructorDashboard from "./pages/instructor/InstructorDashboard";
import ClassroomsList from "./pages/instructor/ClassroomsList";
import ClassroomDetail from "./pages/instructor/ClassroomDetail";
import AssignmentDetail from "./pages/instructor/AssignmentDetail";
import StudentClassroom from "./pages/StudentClassroom";
import VerifyEmail from "@/pages/VerifyEmail";
import ForgotPassword from "@/pages/ForgotPassword";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminRequestDetail from "./pages/admin/AdminRequestDetail";
import PageGallery from "./pages/PageGallery";
import ResetConfirm from "./pages/ResetConfirm";
import { DocsPage, ExamplesPage, SecurityPage, TutorialsPage } from "./pages/InfoPages";
import { AuthProvider, useAuth } from "./contexts/AuthContext";

function RoleRoute({
  allow,
  children,
}: {
  allow: Array<"student" | "instructor" | "admin">;
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (!allow.includes(user.role)) return <Navigate to="/student" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/login" element={<Login />} />
          <Route path="/verify" element={<VerifyEmail />} />
          <Route path="/forgot" element={<ForgotPassword />} />
          <Route path="/reset/confirm" element={<ResetConfirm />} />
          <Route path="/pages" element={<PageGallery />} />
          <Route path="/docs" element={<DocsPage />} />
          <Route path="/tutorials" element={<TutorialsPage />} />
          <Route path="/examples" element={<ExamplesPage />} />
          <Route path="/security" element={<SecurityPage />} />
          <Route
            path="/calculator"
            element={
              <RoleRoute allow={["student","instructor","admin"]}>
                <CalculatorPage />
              </RoleRoute>
            }
          />
          <Route
            path="/student"
            element={
              <RoleRoute allow={["student"]}>
                <StudentDashboard />
              </RoleRoute>
            }
          />
          <Route
            path="/student/classrooms/:classId"
            element={
              <RoleRoute allow={["student"]}>
                <StudentClassroom />
              </RoleRoute>
            }
          />
          <Route
            path="/instructor/request"
            element={
              <RoleRoute allow={["student"]}>
                <RequestInstructor />
              </RoleRoute>
            }
          />

      {/* Instructor area */}
          <Route
            path="/instructor"
            element={
              <RoleRoute allow={["instructor", "admin"]}>
                <InstructorDashboard />
              </RoleRoute>
            }
          />
          <Route
            path="/instructor/classrooms"
            element={
              <RoleRoute allow={["instructor", "admin"]}>
                <ClassroomsList />
              </RoleRoute>
            }
          />
          <Route
            path="/instructor/classrooms/:classId"
            element={
              <RoleRoute allow={["instructor", "admin"]}>
                <ClassroomDetail />
              </RoleRoute>
            }
          />
          <Route
            path="/instructor/assignments/:assignmentId"
            element={
              <RoleRoute allow={["instructor", "admin"]}>
                <AssignmentDetail />
              </RoleRoute>
            }
          />


          <Route
            path="/admin"
            element={
              <RoleRoute allow={["admin"]}>
                <AdminDashboard />
              </RoleRoute>
            }
          />
          <Route
            path="/admin/requests/:requestId"
            element={
              <RoleRoute allow={["admin"]}>
                <AdminRequestDetail />
              </RoleRoute>
            }
          />

        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
