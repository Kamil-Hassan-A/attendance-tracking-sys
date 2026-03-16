import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";

import AppLayout from "@/components/AppLayout";

import Login from "@/pages/Login";
import Register from "@/pages/Register";

import Dashboard from "@/pages/Dashboard";
import Students from "@/pages/Students";
import StudentDetail from "@/pages/StudentDetail";
import MarkAttendance from "@/pages/MarkAttendance";
import Reports from "@/pages/Reports";

import StudentLogin from "@/pages/StudentLogin";
import StudentDashboard from "@/pages/StudentDashboard";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>

          {/* ---------- PUBLIC ---------- */}

          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route path="/student-login" element={<StudentLogin />} />
          <Route path="/student-dashboard" element={<StudentDashboard />} />

          {/* ---------- PROTECTED ---------- */}

          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>

              <Route path="/" element={<Dashboard />} />
              <Route path="/students" element={<Students />} />
              <Route path="/students/:id" element={<StudentDetail />} />
              <Route path="/attendance" element={<MarkAttendance />} />
              <Route path="/reports" element={<Reports />} />

            </Route>
          </Route>

          {/* ---------- FALLBACK ---------- */}

          <Route path="*" element={<Navigate to="/login" replace />} />

        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
