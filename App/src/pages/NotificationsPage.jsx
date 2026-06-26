import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCircle, AlertCircle, Mail, ShieldCheck, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import notificationsApi from '../services/notificationsApi';
import authService from '../services/api';

const isToday = (date) => {
  const now = new Date();
  return (
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear()
  );
};

const isYesterday = (date) => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return (
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear()
  );
};

const formatSectionLabel = (dateString) => {
  if (dateString === 'today') return 'Today';
  if (dateString === 'yesterday') return 'Yesterday';
  return dateString;
};

const getNotificationIcon = (type) => {
  switch (type) {
    case 'complaint_submitted':
      return { icon: Mail, label: 'Complaint' };
    case 'complaint_resolved':
      return { icon: CheckCircle, label: 'Resolved' };
    case 'task_assigned':
      return { icon: Bell, label: 'Task' };
    case 'complaint_closed':
      return { icon: ShieldCheck, label: 'Closed' };
    case 'complaint_escalated':
      return { icon: AlertCircle, label: 'Escalated' };
    default:
      return { icon: Sparkles, label: 'Update' };
  }
};

const groupNotificationsByDate = (notifications) => {
  return notifications.reduce((groups, notification) => {
    const date = new Date(notification.createdAt);
    const formattedDate = isToday(date)
      ? 'today'
      : isYesterday(date)
      ? 'yesterday'
      : date.toLocaleDateString(undefined, {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
        });

    if (!groups[formattedDate]) groups[formattedDate] = [];
    groups[formattedDate].push(notification);
    return groups;
  }, {});
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [activeNotification, setActiveNotification] = useState(null);
  const [settings, setSettings] = useState({
    emailAlerts: true,
    pushAlerts: false,
    digestSummary: false,
  });
  const navigate = useNavigate();

  const normalizeRole = (role = '') => String(role).trim().toLowerCase().replace(/\s+/g, '_');
  const currentUserRole = normalizeRole(authService.getUserRole());
  const isOfficer = ['admin', 'estates_officer', 'technician'].includes(currentUserRole);

  const limit = 50;

  const fetchNotifications = useCallback(async (pageToFetch = 1, unreadOnly = showUnreadOnly) => {
    setLoading(true);
    try {
      const response = await notificationsApi.getNotifications({ unread: unreadOnly, page: pageToFetch, limit });
      const data = response?.data ?? [];
      setNotifications((current) => (pageToFetch === 1 ? data : [...current, ...data]));
      setUnreadCount(response?.unreadCount ?? 0);
      setHasMore(data.length === limit);
      setPage(pageToFetch);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [showUnreadOnly]);

  useEffect(() => {
    const loadNotifications = async () => {
      await fetchNotifications(1, showUnreadOnly);
    };
    loadNotifications();
  }, [fetchNotifications, showUnreadOnly]);

  const sections = useMemo(() => groupNotificationsByDate(notifications), [notifications]);

  const sortedSectionKeys = useMemo(
    () => Object.keys(sections).sort((a, b) => {
      const labels = ['today', 'yesterday'];
      const aIndex = labels.indexOf(a);
      const bIndex = labels.indexOf(b);

      if (aIndex !== -1 || bIndex !== -1) {
        return aIndex === -1 ? 1 : bIndex === -1 ? -1 : aIndex - bIndex;
      }

      return new Date(b).getTime() - new Date(a).getTime();
    }),
    [sections]
  );

  const handleMarkAllRead = async () => {
    setSaving(true);
    try {
      await notificationsApi.markAllNotificationsRead();
      setNotifications((current) => current.map((item) => ({ ...item, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all notifications read:', error);
    } finally {
      setSaving(false);
    }
  };
  const handleSettingsChange = (key) => {
    setSettings((current) => ({ ...current, [key]: !current[key] }));
  };
  
  const toggleSelect = (id) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      setSelectAll(false);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedIds(new Set());
      setSelectAll(false);
      return;
    }
    const allIds = new Set(notifications.map((n) => n._id));
    setSelectedIds(allIds);
    setSelectAll(true);
  };

  const bulkMarkRead = async () => {
    if (selectedIds.size === 0) return;
    setSaving(true);
    try {
      await Promise.all(Array.from(selectedIds).map((id) => notificationsApi.markNotificationRead(id)));
      setNotifications((current) => current.map((n) => (selectedIds.has(n._id) ? { ...n, isRead: true } : n)));
      setUnreadCount((c) => Math.max(0, c - selectedIds.size));
      setSelectedIds(new Set());
      setSelectAll(false);
    } catch (err) {
      console.error('Bulk mark read failed', err);
    } finally {
      setSaving(false);
    }
  };

  const bulkMarkUnread = () => {
    if (selectedIds.size === 0) return;
    setNotifications((current) => current.map((n) => (selectedIds.has(n._id) ? { ...n, isRead: false } : n)));
    setUnreadCount((c) => c + selectedIds.size);
    setSelectedIds(new Set());
    setSelectAll(false);
  };

  const bulkDelete = () => {
    if (selectedIds.size === 0) return;
    setNotifications((current) => current.filter((n) => !selectedIds.has(n._id)));
    setSelectedIds(new Set());
    setSelectAll(false);
  };

  const openNotificationDetail = async (notification) => {
    // mark read on open
    if (!notification.isRead) {
      try {
        await notificationsApi.markNotificationRead(notification._id);
      } catch (err) {
        console.error('Failed to mark read on open', err);
      }
    }
    setNotifications((current) => current.map((item) => (item._id === notification._id ? { ...item, isRead: true } : item)));
    setUnreadCount((c) => Math.max(0, c - (notification.isRead ? 0 : 1)));
    setActiveNotification(notification);
  };

  const toggleRead = async (notification) => {
    if (!notification) return;
    if (notification.isRead) {
      // mark unread locally
      setNotifications((cur) => cur.map((n) => (n._id === notification._id ? { ...n, isRead: false } : n)));
      setUnreadCount((c) => c + 1);
    } else {
      // mark read via API
      try {
        await notificationsApi.markNotificationRead(notification._id);
      } catch (err) {
        console.error('Failed to mark read', err);
      }
      setNotifications((cur) => cur.map((n) => (n._id === notification._id ? { ...n, isRead: true } : n)));
      setUnreadCount((c) => Math.max(0, c - 1));
    }
  };

  const openNotificationRoute = (route) => {
    if (!route || typeof route !== 'string' || !route.startsWith('/')) {
      console.warn('Notification route is not internal or unavailable:', route);
      return;
    }
    navigate(route);
  };

  const handleReply = (notification) => {
    if (!notification?.fromEmail) {
      console.warn('Reply unavailable: no sender email provided.');
      return;
    }
    const to = notification.fromEmail;
    const subject = `Re: ${notification.title || 'Notification'}`;
    const body = `\n\n---\nOriginal message:\n${notification.message || ''}`;
    window.location.href = `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8 rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="px-6 py-7 sm:px-8 sm:py-9">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-4">
              <button
                type="button"
                onClick={() => {
                  if (window.history.length > 1) {
                    navigate(-1);
                  } else {
                    navigate('/dashboard');
                  }
                }}
                className="inline-flex items-center gap-2 rounded-md px-2.5 py-1 text-sm font-medium text-slate-600 transition hover:text-slate-900 hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
              >
                <span className="text-lg">←</span>
                <span>Back</span>
              </button>

              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Notifications</p>
                <h1 className="mt-3 text-3xl font-semibold text-slate-900">Notification history</h1>
                <p className="mt-2 text-sm leading-6 text-slate-600 max-w-2xl">
                  Review your latest notification activity, grouped by date, and mark updates as read.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="rounded-3xl bg-slate-50 px-4 py-3 text-sm text-slate-700 shadow-sm">
                <span className="block text-xs uppercase tracking-[0.16em] text-slate-500">Unread</span>
                <span className="mt-1 block text-2xl font-semibold text-slate-900">{unreadCount}</span>
              </div>
              <button
                type="button"
                onClick={handleMarkAllRead}
                disabled={unreadCount === 0 || saving}
                className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {saving ? 'Saving...' : 'Mark all read'}
              </button>
            </div>
          </div>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="inline-flex overflow-hidden rounded-full border border-slate-200 bg-slate-50 p-1">
              <button
                type="button"
                onClick={() => setShowUnreadOnly(false)}
                className={`px-4 py-2 text-sm font-semibold transition ${showUnreadOnly ? 'text-slate-500' : 'bg-white text-slate-900 shadow-sm'}`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setShowUnreadOnly(true)}
                className={`px-4 py-2 text-sm font-semibold transition ${showUnreadOnly ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
              >
                Unread
              </button>
            </div>
            <button
              type="button"
              onClick={() => setShowSettings((current) => !current)}
              className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              {showSettings ? 'Hide settings' : 'Quick settings'}
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <motion.div layout className="space-y-6">
          <div className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <label className="flex items-center gap-2 text-sm">
                <input id="selectAll" name="selectAll" type="checkbox" checked={selectAll} onChange={toggleSelectAll} className="h-4 w-4" />
                <span className="text-slate-700">Select all</span>
              </label>
              <div className="flex flex-wrap items-center gap-2">
                <button type="button" onClick={bulkMarkRead} disabled={selectedIds.size===0} className="text-sm rounded-full bg-emerald-600 px-3 py-2 text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300">Mark read</button>
                <button type="button" onClick={bulkMarkUnread} disabled={selectedIds.size===0} className="text-sm rounded-full bg-slate-200 px-3 py-2 text-slate-700 transition hover:bg-slate-300 disabled:cursor-not-allowed">Mark unread</button>
                <button type="button" onClick={bulkDelete} disabled={selectedIds.size===0} className="text-sm rounded-full bg-rose-500 px-3 py-2 text-white transition hover:bg-rose-600 disabled:cursor-not-allowed">Delete</button>
              </div>
            </div>
            <div className="text-sm text-slate-500">Showing {notifications.length} notifications</div>
          </div>

          {loading ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-6 text-slate-500 shadow-sm">
              Loading notificationsâ€¦
            </div>
          ) : notifications.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-8 text-center text-slate-600 shadow-sm">
              <p className="text-lg font-semibold text-slate-900">No notifications yet</p>
              <p className="mt-2 text-sm leading-6">
                Notifications will appear here when actions happen in the system, like complaint updates or task assignments.
              </p>
            </div>
          ) : (
            sortedSectionKeys.map((sectionKey) => (
              <section key={sectionKey} className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-200 bg-slate-50 px-5 py-3">
                  <p className="text-sm font-semibold text-slate-700">{formatSectionLabel(sectionKey)}</p>
                </div>
                <div className="divide-y divide-slate-200">
                  {sections[sectionKey].map((notification) => {
                    const { icon: NotificationIcon, label: iconLabel } = getNotificationIcon(notification.type);
                    const checked = selectedIds.has(notification._id);
                    return (
                      <div key={notification._id} className={`w-full text-left px-5 py-4 transition ${notification.isRead ? 'bg-white hover:bg-slate-50' : 'border-l-4 border-emerald-500 bg-emerald-50/80 shadow-sm hover:bg-emerald-100'}`}>
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                            <div className="flex items-start gap-3 min-w-0">
                              <input id={`select_${notification._id}`} name="selectedNotifications" type="checkbox" checked={checked} onChange={() => toggleSelect(notification._id)} className="h-4 w-4 shrink-0" />
                              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
                                <NotificationIcon className="h-5 w-5" />
                              </div>
                              <div className="min-w-0">
                                <button type="button" onClick={() => openNotificationDetail(notification)} className="text-left min-w-0">
                                  <p className={`text-sm font-semibold ${notification.isRead ? 'text-slate-900' : 'text-emerald-900'}`}>{notification.title}</p>
                                  <p className="mt-2 text-sm leading-6 text-slate-600">{notification.message}</p>
                                </button>
                              </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                              <button type="button" onClick={() => toggleRead(notification)} aria-label="Toggle read" className="text-xs rounded-full bg-slate-100 px-2 py-1">{notification.isRead ? 'Mark unread' : 'Mark read'}</button>
                              <button type="button" onClick={() => openNotificationDetail(notification)} aria-label="More actions" className="text-xs rounded-full bg-slate-100 px-2 py-1">â‹¯</button>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${notification.isRead ? 'bg-slate-100 text-slate-600' : 'bg-emerald-600 text-white'}`}>
                              {notification.isRead ? 'Read' : 'Unread'}
                            </span>
                            {!notification.isRead && (
                              <span className="mt-1 h-2.5 w-2.5 rounded-full bg-emerald-700" />
                            )}
                          </div>
                        </div>
                        <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                          <span className="min-w-full sm:min-w-0">{new Date(notification.createdAt).toLocaleString()}</span>
                          <span className="rounded-full border border-slate-200 bg-slate-100 px-2 py-1 uppercase tracking-[0.1em] text-[10px] text-slate-500">
                            {iconLabel}
                          </span>
                          {notification.route && notification.route.startsWith('/') && (
                            <button
                              type="button"
                              onClick={() => openNotificationRoute(notification.route)}
                              className="rounded-full border border-slate-200 bg-slate-100 px-2 py-1 text-[11px] text-slate-500 transition hover:bg-slate-200"
                            >
                              Tap to open
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            ))
          )}

          {hasMore && (
            <button
              type="button"
              onClick={() => fetchNotifications(page + 1)}
              className="w-full rounded-3xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-900 shadow-sm transition hover:bg-slate-50"
            >
              Load more notifications
            </button>
          )}
        </motion.div>

        <aside className="space-y-6">
          {activeNotification && (
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sticky top-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{activeNotification.title}</p>
                  <p className="mt-1 text-xs text-slate-500">{new Date(activeNotification.createdAt).toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => setActiveNotification(null)} className="text-sm px-3 py-1 rounded bg-slate-100">Close</button>
                </div>
              </div>

              <div className="mt-4 text-sm text-slate-700">
                <p>{activeNotification.message}</p>
              </div>

              <div className="mt-6 flex items-center gap-2">
                <button type="button" onClick={() => handleReply(activeNotification)} disabled={!activeNotification?.fromEmail} className="px-3 py-2 rounded bg-white border border-slate-200 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400">Reply</button>
                <button type="button" onClick={() => { setNotifications((cur)=>cur.map(n=>n._id===activeNotification._id?{...n,isRead:false}:n)); setUnreadCount(c=>c+1); }} className="px-3 py-2 rounded bg-slate-50 border border-slate-200">Mark unread</button>
                <button type="button" onClick={() => { setNotifications((cur)=>cur.filter(n=>n._id!==activeNotification._id)); setActiveNotification(null); }} className="px-3 py-2 rounded bg-rose-50 border border-rose-200">Delete</button>
                {isOfficer && activeNotification?.route && (
                  <button type="button" onClick={() => { setActiveNotification(null); openNotificationRoute(activeNotification.route); }} className="ml-auto text-sm font-semibold text-slate-700">Open</button>
                )}
              </div>
            </div>
          )}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold text-slate-900">Notification summary</p>
            <div className="mt-4 grid gap-3">
              <div className="rounded-3xl bg-slate-50 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Total</p>
                <p className="mt-1 text-2xl font-semibold text-slate-900">{notifications.length}</p>
              </div>
              <div className="rounded-3xl bg-slate-50 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Unread</p>
                <p className="mt-1 text-2xl font-semibold text-slate-900">{unreadCount}</p>
              </div>
            </div>
          </div>

          {showSettings ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-slate-900">Notification settings</p>
                  <p className="mt-1 text-sm text-slate-500">Quick controls for how you want to receive updates.</p>
                </div>
                <Bell className="h-5 w-5 text-slate-400" />
              </div>

              <div className="mt-6 space-y-4">
                <label className="flex items-center justify-between rounded-3xl border border-slate-200 bg-slate-50 px-4 py-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Email alerts</p>
                    <p className="mt-1 text-sm text-slate-500">Send a copy of notifications to your inbox.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSettingsChange('emailAlerts')}
                    className={`rounded-full px-3 py-1 text-sm font-semibold transition ${settings.emailAlerts ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'}`}
                  >
                    {settings.emailAlerts ? 'Enabled' : 'Disabled'}
                  </button>
                </label>

                <label className="flex items-center justify-between rounded-3xl border border-slate-200 bg-slate-50 px-4 py-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Push alerts</p>
                    <p className="mt-1 text-sm text-slate-500">Receive quick updates inside the app.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSettingsChange('pushAlerts')}
                    className={`rounded-full px-3 py-1 text-sm font-semibold transition ${settings.pushAlerts ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'}`}
                  >
                    {settings.pushAlerts ? 'Enabled' : 'Disabled'}
                  </button>
                </label>

                <label className="flex items-center justify-between rounded-3xl border border-slate-200 bg-slate-50 px-4 py-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Digest summary</p>
                    <p className="mt-1 text-sm text-slate-500">Receive a daily summary of important updates.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSettingsChange('digestSummary')}
                    className={`rounded-full px-3 py-1 text-sm font-semibold transition ${settings.digestSummary ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'}`}
                  >
                    {settings.digestSummary ? 'Enabled' : 'Disabled'}
                  </button>
                </label>
              </div>
            </div>
          ) : (
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold text-slate-900">Best practices</p>
              <ul className="mt-4 space-y-3 text-sm text-slate-600">
                <li>Mark notifications read after reviewing them.</li>
                <li>Open notifications with routes to jump directly to the work item.</li>
                <li>Use the unread badge to stay on top of important updates.</li>
              </ul>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}


