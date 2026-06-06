// frontend/src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';
import VerifyEmailPage from './components/VerifyEmailPage';
import ProtectedRoute from './components/ProtectedRoute';
import authService from './services/api';
import { getRoleRedirectPath } from './hooks/useRoleRedirect'; // ✅ Import the hook
// Dashboard Components
import AdminDashboard from './components/AdminDashboard';
import TechnicianDashboard from './components/TechnicianDashboard';
import ComplaintDashboard from './components/ComplaintDashboard';
import UnauthorizedPage from './components/UnauthorizedPage';
import ForgotPasswordPage from './components/ForgotPasswordPage';
import ResetPasswordPage from './components/ResetPasswordPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />
        
        {/* Root redirect - Role-based */}
        <Route 
          path="/" 
          element={
            authService.isAuthenticated() 
              ? (() => {

                  const role = authService.getUserRole();
                  const redirectPath = getRoleRedirectPath(role); // ✅ Use the hook
                   return <Navigate to={redirectPath} replace />;

                })()
              : <Navigate to="/login" replace />
          } 
        />
        
        {/* Admin only */}
        <Route 
          path="/admin/dashboard" 
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          } 
        />
        
        {/* Technician only */}
        <Route 
          path="/technician/dashboard" 
          element={
            <ProtectedRoute allowedRoles={['technician']}>
              <TechnicianDashboard />
            </ProtectedRoute>
          } 
        />
        
        {/* Shared Dashboard for: Warden, Custodian, Resident Staff */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute allowedRoles={['warden', 'custodian', 'resident_staff']}>
              <ComplaintDashboard />
            </ProtectedRoute>
          } 
        />
        
        {/* Catch all - redirect based on role */}
        <Route 
          path="*" 
          element={
            authService.isAuthenticated() 
              ? (() => {
                  const role = authService.getUserRole();
                  const redirectPath = getRoleRedirectPath(role); // ✅ Use the hook
                  return <Navigate to={redirectPath} replace />;
                })()
              : <Navigate to="/login" replace />
          } 
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;