// frontend/src/hooks/useRoleRedirect.js
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/api';

export const useRoleRedirect = () => {
  const navigate = useNavigate();
  
  useEffect(() => {
    const user = authService.getCurrentUserFromStorage();
    
    if (user) {
      // Redirect submitter-type users to the shared complaint submission dashboard.
      // Other roles have dedicated dashboards based on their responsibilities.
      const roleRoutes = {
        'Admin': '/admin/dashboard',
        'Technician': '/technician/dashboard',
        'Custodian': '/dashboard',
        'Resident Staff': '/dashboard',
        'Warden': '/dashboard',
      };
      
      const redirectPath = roleRoutes[user.role] || '/dashboard';
      navigate(redirectPath);
    }
  }, [navigate]);
};

export const getRoleRedirectPath = (role) => {
  const roleRoutes = {
    'Admin': '/admin/dashboard',
    'Technician': '/technician/dashboard',
    'Custodian': '/dashboard',
    'Resident Staff': '/dashboard',
    'Warden': '/dashboard',
  };
  return roleRoutes[role] || '/dashboard';
};