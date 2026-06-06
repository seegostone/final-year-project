// frontend/src/hooks/useRoleRedirect.js
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/api';

// Normalize role to match backend storage (e.g., 'Resident Staff' -> 'resident_staff')
const normalizeRole = (role) =>
  String(role || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_');

export const useRoleRedirect = () => {
  const navigate = useNavigate();
  
  useEffect(() => {
    const user = authService.getCurrentUserFromStorage();
    
    if (user) {
      // Redirect based on normalized role (backend stores roles normalized)
      const roleRoutes = {
        'admin': '/admin/dashboard',
        'technician': '/technician/dashboard',
        'custodian': '/dashboard',
        'resident_staff': '/dashboard',
        'warden': '/dashboard',
      };
      
      const normalizedRole = normalizeRole(user.role);
      const redirectPath = roleRoutes[normalizedRole] || '/dashboard';
      navigate(redirectPath);
    }
  }, [navigate]);
};

export const getRoleRedirectPath = (role) => {
  const roleRoutes = {
    'admin': '/admin/dashboard',
    'technician': '/technician/dashboard',
    'custodian': '/dashboard',
    'resident_staff': '/dashboard',
    'warden': '/dashboard',
  };
  
  const normalizedRole = normalizeRole(role);
  return roleRoutes[normalizedRole] || '/dashboard';
};