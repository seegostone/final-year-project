// frontend/src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { TechnicianDashboard } from './pages/TechnicianDashboard';
import { TaskDetail } from './pages/TaskDetail';

// Default-exported dashboards and pages
import AdminDashboard from './components/AdminDashboard';
import ComplaintDashboard from './components/ComplaintDashboard';
import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';
import VerifyEmailPage from './components/VerifyEmailPage';
import ForgotPasswordPage from './components/ForgotPasswordPage';
import ResetPasswordPage from './components/ResetPasswordPage';
import UnauthorizedPage from './components/UnauthorizedPage';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <>
      <BrowserRouter>
        <Routes>
          {/* Public / Auth pages */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />

          {/* Technician routes */}
          <Route path="/technician/dashboard" element={<TechnicianDashboard />} />
          <Route path="/task/:complaintId/:taskId" element={<TaskDetail />} />

          {/* Admin / Estates Officer */}
          <Route path="/admin/dashboard" element={<ProtectedRoute allowedRoles={["admin","estates_officer"]}><AdminDashboard /></ProtectedRoute>} />

          {/* Shared complaint dashboard */}
          <Route path="/dashboard" element={<ComplaintDashboard />} />
          <Route path="/complaints" element={<ComplaintDashboard />} />

          {/* Root: send to technician dashboard by default */}
          <Route path="/" element={<Navigate to="/technician/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" />
    </>
  );
}

export default App;
