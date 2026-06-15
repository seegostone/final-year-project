// Auth service for user authentication
interface User {
  id: string;
  name: string;
  email: string;
}

const authService = {
  getCurrentUserFromStorage: (): User | null => {
    try {
      const userStr = localStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : null;
    } catch {
      return null;
    }
  },

  logoutAndRedirect: (): void => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    window.location.href = '/login';
  },

  login: async (email: string, password: string): Promise<{ success: boolean; user: User }> => {
    // Mock login - replace with actual API call
    const mockUser: User = {
      id: '1',
      name: 'John Doe',
      email: email,
    };
    localStorage.setItem('user', JSON.stringify(mockUser));
    localStorage.setItem('token', 'mock-token');
    return { success: true, user: mockUser };
  },

  register: async (name: string, email: string, password: string): Promise<{ success: boolean; user: User }> => {
    // Mock registration - replace with actual API call
    const mockUser: User = {
      id: '1',
      name: name,
      email: email,
    };
    localStorage.setItem('user', JSON.stringify(mockUser));
    localStorage.setItem('token', 'mock-token');
    return { success: true, user: mockUser };
  },
};

export default authService;
