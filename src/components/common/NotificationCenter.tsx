import React, { useEffect, useState } from 'react';
import { Bell, Check, RefreshCw, X } from 'lucide-react';
import { api } from '../../services/api.ts';
import { NotificationItem } from '../../types/index.ts';

interface NotificationCenterProps {
  onNavigate: (tab: string) => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({ onNavigate }) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const refresh = async () => {
    try {
      const data = await api.getNotifications();
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
      setError('');
    } catch (err: any) {
      setError(err.message || 'Unable to load notifications.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
    const interval = window.setInterval(() => void refresh(), 30000);
    return () => window.clearInterval(interval);
  }, []);

  const markRead = async (notification: NotificationItem) => {
    if (!notification.isRead) {
      setNotifications((current) => current.map((item) =>
        item.id === notification.id ? { ...item, isRead: true } : item));
      setUnreadCount((count) => Math.max(0, count - 1));
      try {
        await api.markNotificationRead(notification.id);
      } catch {
        await refresh();
      }
    }
    if (notification.link === 'results' || notification.link === 'courses') {
      onNavigate(notification.link);
      setOpen(false);
    }
  };

  const markAllRead = async () => {
    setNotifications((current) => current.map((item) => ({ ...item, isRead: true })));
    setUnreadCount(0);
    try {
      await api.markAllNotificationsRead();
    } catch (err: any) {
      setError(err.message || 'Unable to update notifications.');
      await refresh();
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => {
          setOpen((current) => !current);
          void refresh();
        }}
        aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ''}`}
        aria-expanded={open}
        className="relative rounded-md border border-slate-700 p-2 text-slate-200 hover:bg-slate-800"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 min-w-4 rounded-full bg-rose-500 px-1 text-center text-[10px] font-bold leading-4 text-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>
      {open && (
        <section className="absolute right-0 top-12 z-50 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-lg border border-slate-200 bg-white text-slate-800 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
            <div>
              <h2 className="text-sm font-semibold">Notifications</h2>
              <p className="text-xs text-slate-500">{unreadCount} unread</p>
            </div>
            <div className="flex items-center gap-1">
              <button type="button" onClick={() => void refresh()} aria-label="Refresh notifications" className="rounded p-1.5 text-slate-500 hover:bg-slate-100">
                <RefreshCw className="h-4 w-4" />
              </button>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close notifications" className="rounded p-1.5 text-slate-500 hover:bg-slate-100">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
          {unreadCount > 0 && (
            <button type="button" onClick={() => void markAllRead()} className="flex w-full items-center gap-2 border-b border-slate-100 px-4 py-2 text-left text-xs font-medium text-blue-700 hover:bg-blue-50">
              <Check className="h-3.5 w-3.5" /> Mark all as read
            </button>
          )}
          {error && <div role="alert" className="m-3 rounded-md bg-rose-50 p-2 text-xs text-rose-700">{error}</div>}
          {loading ? (
            <div className="p-6 text-center text-xs text-slate-500">Loading notifications…</div>
          ) : notifications.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-500">You’re all caught up. New updates will appear here.</div>
          ) : (
            <ul className="max-h-80 divide-y divide-slate-100 overflow-y-auto">
              {notifications.map((notification) => (
                <li key={notification.id}>
                  <button
                    type="button"
                    onClick={() => void markRead(notification)}
                    className={`w-full px-4 py-3 text-left hover:bg-slate-50 ${notification.isRead ? '' : 'bg-blue-50/60'}`}
                  >
                    <span className="flex items-start justify-between gap-3">
                      <span className="min-w-0">
                        <span className="block text-xs font-semibold text-slate-900">{notification.title}</span>
                        <span className="mt-1 block text-xs leading-relaxed text-slate-600">{notification.message}</span>
                        <span className="mt-1.5 block text-[10px] text-slate-400">{new Date(notification.createdAt).toLocaleString()}</span>
                      </span>
                      {!notification.isRead && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-blue-600" />}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
};
