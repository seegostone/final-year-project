// frontend/src/components/ProtectedRoute.jsx
import { Navigate } from 'react-router-dom';
import authService from '../services/api';

export default function ProtectedRoute({ children, allowedRoles = [] }) {
  const isAuthenticated = authService.isAuthenticated();
  const userRole = authService.getUserRole();
  
  // Check if user is authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  // Check role-based access if roles are specified
  if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
    return <Navigate to="/unauthorized" replace />;
  }
  
  return children;
}