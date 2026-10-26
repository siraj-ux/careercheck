'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Bell, Clock, X } from 'lucide-react';

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  body: string;
  readAt: string | null;
  createdAt: string;
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let isCancelled = false;
    async function loadNotifications() {
      try {
        const res = await fetch('/api/notifications');
        if (res.ok && !isCancelled) {
          const data = await res.json();
          if (data.success) {
            setNotifications(data.notifications || []);
            setUnreadCount(data.unreadCount || 0);
          }
        }
      } catch {
        // Ignore background fetch error
      }
    }

    void loadNotifications();
    const interval = setInterval(() => {
      void loadNotifications();
    }, 30000);
    return () => {
      isCancelled = true;
      clearInterval(interval);
    };
  }, []);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const markAllAsRead = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/notifications', { method: 'PATCH' });
      if (res.ok) {
        setUnreadCount(0);
        setNotifications((prev) =>
          prev.map((n) => ({ ...n, readAt: n.readAt || new Date().toISOString() }))
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-label={`Notifications (${unreadCount} unread)`}
        className="relative flex h-9 w-9 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 hover:text-zinc-950 transition-colors"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-indigo-600 px-1 text-[10px] font-bold text-white shadow-xs">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-zinc-200 bg-white p-4 shadow-xl z-50 animate-in fade-in zoom-in-95 duration-100">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-zinc-950">Notifications</h3>
              {unreadCount > 0 && (
                <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-semibold text-indigo-700">
                  {unreadCount} new
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  type="button"
                  disabled={loading}
                  onClick={markAllAsRead}
                  className="text-[11px] font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
                >
                  Mark all read
                </button>
              )}
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-zinc-400 hover:text-zinc-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-zinc-50 pt-2">
            {notifications.length === 0 ? (
              <div className="py-8 text-center text-xs text-zinc-500">
                No notifications right now.
              </div>
            ) : (
              notifications.map((n) => {
                const isUnread = !n.readAt;
                const dateIST = new Date(n.createdAt).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                  timeZone: 'Asia/Kolkata',
                });

                return (
                  <div
                    key={n.id}
                    className={`py-2.5 px-2 rounded-xl transition-colors ${
                      isUnread ? 'bg-indigo-50/50' : 'hover:bg-zinc-50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-xs font-bold text-zinc-900">{n.title}</h4>
                      {isUnread && (
                        <span className="h-2 w-2 rounded-full bg-indigo-600 shrink-0 mt-1" />
                      )}
                    </div>
                    <p className="text-xs text-zinc-600 mt-0.5 leading-relaxed">{n.body}</p>
                    <div className="flex items-center gap-1 text-[10px] text-zinc-400 mt-1.5 font-mono">
                      <Clock className="h-3 w-3" />
                      <span>{dateIST} IST</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
