// frontend/src/components/Header.jsx
import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ChevronDown, LogOut, Building2, Menu, Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import authService from '../services/api';
import notificationsApi from '../services/notificationsApi';

export default function Header({ onHamburgerClick = () => {}, showAuth = false }) {
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [user] = useState(() => authService.getCurrentUserFromStorage());
  const ref = useRef();
  const location = useLocation();
  const navigate = useNavigate();

  const normalizeRole = (role = '') => String(role).trim().toLowerCase().replace(/\s+/g, '_');
  const userRole = normalizeRole(user?.role || authService.getUserRole());
  const isOfficer = ['admin', 'estates_officer', 'technician'].includes(userRole);

  // Determine which page we're on
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';
  const shouldShowAuthLinks = isAuthPage || showAuth;
  const isDashboard = location.pathname.startsWith('/dashboard') || 
                      location.pathname.startsWith('/admin') || 
                      location.pathname.startsWith('/technician');

  useEffect(() => {
    function onDoc(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setNotificationOpen(false);
        setProfileOpen(false);
      }
    }
    document.addEventListener('mousedown', onDoc, true);
    return () => document.removeEventListener('mousedown', onDoc, true);
  }, []);

  const loadNotifications = useCallback(async () => {
    if (!user) return;

    setLoadingNotifications(true);
    try {
      const response = await notificationsApi.getNotifications({ limit: 10 });
      const notificationData = response?.data || [];
      setNotifications(notificationData);
      setUnreadCount(response?.unreadCount ?? notificationData.filter((item) => !item.isRead).length);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setLoadingNotifications(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const fetchNotifications = async () => {
      await loadNotifications();
    };

    void fetchNotifications();
  }, [loadNotifications, user]);

  useEffect(() => {
    const handleNotificationsUpdated = () => {
      void loadNotifications();
    };

    window.addEventListener('notificationsUpdated', handleNotificationsUpdated);
    return () => window.removeEventListener('notificationsUpdated', handleNotificationsUpdated);
  }, [loadNotifications]);

  const handleLogout = () => {
    authService.logoutAndRedirect();
  };

  const handleToggleNotifications = async () => {
    setProfileOpen(false);
    setNotificationOpen((prev) => !prev);

    if (!notificationOpen && user) {
      await loadNotifications();
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationsApi.markAllNotificationsRead();
      setUnreadCount(0);
      setNotifications((current) => current.map((item) => ({ ...item, isRead: true })));
    } catch (error) {
      console.error('Failed to mark notifications read:', error);
    }
  };

  const handleNotificationClick = async (notification) => {
    if (!notification?._id) return;

    try {
      await notificationsApi.markNotificationRead(notification._id);
      setNotifications((current) =>
        current.map((item) =>
          item._id === notification._id ? { ...item, isRead: true } : item
        )
      );
      setUnreadCount((current) => Math.max(0, current - 1));

      if (isOfficer && notification.route) {
        navigate(notification.route);
      }
    } catch (error) {
      console.error('Failed to mark notification read:', error);
    }
  };

  const handleToggleProfile = () => {
    setNotificationOpen(false);
    setProfileOpen((prev) => !prev);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[rgba(0,0,0,0.1)] bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 px-4 md:px-8 py-4 md:py-6">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 md:gap-0">
        {/* Logo Section */}
        <div className="flex items-center gap-3">
          {/* Mobile hamburger - Only show on dashboard */}
          {isDashboard && (
            <button onClick={onHamburgerClick} className="md:hidden p-2 rounded-md mr-1">
              <Menu className="h-5 w-5 text-slate-700" />
            </button>
          )}

          <Link to="/" aria-label="Go to dashboard" className="flex items-center gap-3 no-underline">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50">
              <Building2 className="h-5 w-5 text-green-700" />
            </div>
            <div className="text-center md:text-left">
              <h1 className="text-lg md:text-xl m-0" style={{ fontFamily: 'Merriweather, serif', fontWeight: 700, color: '#1F2937' }}>
                EstatesComplaint
              </h1>
              <p className="text-xs text-[#6B7280] mt-1 m-0">
                Makerere University Estates Department
              </p>
            </div>
          </Link>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-2 md:gap-3" ref={ref}>
          {/* Authentication Pages (Login/Register) - show when NOT logged in */}
          {shouldShowAuthLinks && !user && (
            <>
              <span className="text-xs md:text-sm text-[#1F2937]">
                {location.pathname === '/login' ? 'New user?' : 'Already have an account?'}
              </span>
              <Link 
                to={location.pathname === '/login' ? '/register' : '/login'} 
                className="text-xs md:text-sm text-green-700 no-underline hover:text-green-800 transition-colors font-medium"
              >
                {location.pathname === '/login' ? 'Create Account' : 'Sign In'}
              </Link>
            </>
          )}

          {/* Notification bell and user dropdown when user is logged in */}
          {user && (
            <>
              <div className="relative">
                <button
                  type="button"
                  aria-label={`Notifications${unreadCount > 0 ? `: ${unreadCount} unread` : ''}`}
                  onClick={handleToggleNotifications}
                  className="relative flex h-11 w-11 items-center justify-center rounded-full border border-transparent bg-white/90 text-slate-700 shadow-sm transition hover:border-slate-200 hover:bg-white"
                >
                  <Bell size={18} />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-h-[18px] min-w-[18px] rounded-full bg-rose-500 px-1.5 text-[10px] font-semibold leading-none text-white flex items-center justify-center shadow-lg">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                <AnimatePresence>
                  {notificationOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.96 }}
                      transition={{ duration: 0.2, ease: 'easeOut' }}
                      className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 shadow-2xl rounded-none z-50"
                    >
                      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">Notifications</p>
                          <p className="text-xs text-slate-500 mt-1">
                            {unreadCount > 0
                              ? `You have ${unreadCount} unread notification${unreadCount === 1 ? '' : 's'}`
                              : 'You’re all caught up.'}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={handleMarkAllRead}
                          disabled={unreadCount === 0}
                          className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Mark all read
                        </button>
                      </div>
                      <div className="max-h-72 overflow-y-auto">
                        {loadingNotifications ? (
                          <div className="p-4 text-sm text-slate-500">Loading notifications...</div>
                        ) : notifications.length === 0 ? (
                          <div className="p-4 text-sm text-slate-500">No notifications yet</div>
                        ) : (
                          notifications.map((notification) => (
                            <button
                              key={notification._id}
                              type="button"
                              onClick={() => handleNotificationClick(notification)}
                              className={`w-full text-left p-4 transition ${
                                notification.isRead
                                  ? 'border-b border-slate-100 bg-white hover:bg-slate-50'
                                  : 'border-b border-slate-100 bg-emerald-50/70 hover:bg-emerald-50'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex-1">
                                  <p className="text-sm font-semibold text-slate-900">
                                    {notification.title}
                                  </p>
                                  <p className="mt-1 text-xs text-slate-600 leading-5">
                                    {notification.message}
                                  </p>
                                </div>
                                {!notification.isRead && (
                                  <span className="mt-1 h-2.5 w-2.5 rounded-full bg-emerald-700" />
                                )}
                              </div>
                              <p className="mt-3 text-[11px] text-slate-400">
                                {new Date(notification.createdAt).toLocaleString()}
                              </p>
                            </button>
                          ))
                        )}
                      </div>
                      {notifications.length > 0 && (
                        <div className="px-4 py-3 bg-slate-50 text-center text-xs text-slate-500 rounded-b-3xl space-y-2">
                          <p>Tap a notification to mark it read and open it.</p>
                          <Link
                            to="/notifications"
                            onClick={() => setNotificationOpen(false)}
                            className="font-semibold text-slate-700 hover:text-slate-900"
                          >
                            View all notifications
                          </Link>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="relative">
                <button
                  type="button"
                  onClick={handleToggleProfile}
                  className="flex items-center gap-2 rounded-full px-3 py-1 border border-transparent hover:border-green-200 transition-all hover:bg-green-50"
                >
                  <div className="h-8 w-8 rounded-full bg-green-700 text-white flex items-center justify-center font-semibold text-sm">
                    {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <span className="hidden sm:block text-sm text-[#1F2937] font-medium">
                    {user?.name || user?.email || 'User'}
                  </span>
                  <ChevronDown size={16} className="text-green-700" />
                </button>

                {profileOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white border border-green-100 shadow-lg rounded-md z-50">
                    <div className="p-3 border-b border-green-100">
                      <p className="text-sm font-semibold text-[#1F2937] m-0">
                        {user?.name || 'User'}
                      </p>
                      <p className="text-xs text-[#6B7280] m-0 truncate">
                        {user?.email}
                      </p>
                    </div>
                    <div className="p-2">
                      <button 
                        onClick={handleLogout} 
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[#1F2937] hover:bg-green-50 rounded-md transition-colors"
                      >
                        <LogOut size={16} className="text-green-700" />
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}