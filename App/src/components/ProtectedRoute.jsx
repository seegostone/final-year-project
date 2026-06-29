// frontend/src/components/ProtectedRoute.jsx
import { Navigate, useLocation } from 'react-router-dom';
import authService from '../services/api';

// Normalize role to match backend storage (e.g., 'Resident Staff' -> 'resident_staff')
const normalizeRole = (role) =>
  String(role || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_');

export default function ProtectedRoute({ children, allowedRoles = [] }) {
  const location = useLocation();
  const isAuthenticated = authService.isAuthenticated();
  const userRole = authService.getUserRole();
  
  // Check if user is authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  // Check role-based access if roles are specified
  if (allowedRoles.length > 0) {
    const normalizedUserRole = normalizeRole(userRole);
    const normalizedAllowedRoles = allowedRoles.map(normalizeRole);
    
    if (!normalizedAllowedRoles.includes(normalizedUserRole)) {
      return <Navigate to="/unauthorized" replace />;
    }
  }
  
  return children;
}