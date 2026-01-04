// NotificationBell component
// Displays a notification bell icon with unread count badge

import { useState, useEffect } from 'react';
import { getUnreadCount } from '../services/notificationService';
import NotificationList from './NotificationList';

function NotificationBell({ onZoneClick }) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    loadUnreadCount();
    
    // Poll for new notifications every 30 seconds
    const interval = setInterval(loadUnreadCount, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const loadUnreadCount = async () => {
    try {
      const count = await getUnreadCount();
      setUnreadCount(count);
    } catch (err) {
      console.error('Error loading unread count:', err);
    }
  };

  const handleNotificationClick = (zoneId) => {
    setShowNotifications(false);
    loadUnreadCount(); // Refresh count after viewing
    if (onZoneClick) {
      onZoneClick(zoneId);
    }
  };

  const handleClose = () => {
    setShowNotifications(false);
    loadUnreadCount(); // Refresh count when closing
  };

  return (
    <>
      <button
        onClick={() => setShowNotifications(true)}
        className="relative p-2 hover:bg-gray-100 rounded-full transition-colors"
        title="Notifications"
      >
        <svg
          className="w-6 h-6 text-gray-700"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 bg-red-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {showNotifications && (
        <NotificationList
          onNotificationClick={handleNotificationClick}
          onClose={handleClose}
        />
      )}
    </>
  );
}

export default NotificationBell;
