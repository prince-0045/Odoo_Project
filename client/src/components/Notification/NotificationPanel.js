import React, { useState } from 'react';
import { useSocket } from '../../context/SocketContext';
import { Link } from 'react-router-dom';
import axios from 'axios';

const NotificationPanel = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { notifications, unreadCount, markAllNotificationsAsRead, removeNotification, markNotificationAsRead, setNotifications, setUnreadCount } = useSocket();

  // Refetch notifications from backend
  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get((process.env.REACT_APP_API_URL || 'http://localhost:5000') + '/api/notifications', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(res.data.data.notifications || []);
      setUnreadCount((res.data.data.notifications || []).filter(n => !n.isRead).length);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  };

  // Clear all notifications (backend + UI)
  const clearAllNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.delete((process.env.REACT_APP_API_URL || 'http://localhost:5000') + '/api/notifications/clear', {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Clear all response:', response.data);
      // Refetch notifications to ensure UI is in sync
      await fetchNotifications();
    } catch (err) {
      console.error('Failed to clear notifications:', err);
      alert('Failed to clear notifications. See console for details.');
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) markAllNotificationsAsRead();
        }}
        className="relative p-2 text-gray-600 hover:text-gray-900 focus:outline-none"
      >
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4.83 2.83l4.24 4.24M14.83 2.83l-4.24 4.24M20.83 12.83l-4.24-4.24M4.83 12.83l4.24-4.24M14.83 20.83l-4.24-4.24M20.83 20.83l-4.24-4.24" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-400"></span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50">
          <div className="py-1">
            <div className="px-4 py-2 text-sm text-gray-700 border-b flex items-center justify-between">
              <h3 className="font-medium">Notifications</h3>
              <button
                onClick={clearAllNotifications}
                className="text-xs text-red-500 hover:underline focus:outline-none"
              >
                Clear All
              </button>
            </div>
            <div className="max-h-64 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="px-4 py-2 text-sm text-gray-500">
                  No notifications yet
                </div>
              ) : (
                notifications.map((n, idx) => (
                  <div
                    key={idx}
                    className={`px-4 py-2 text-sm ${n.isRead ? 'text-gray-400' : 'text-gray-900'} border-b`}
                  >
                    {/* If notification has username, make username clickable and message clickable */}
                    {n.username ? (
                      <>
                        <Link to={`/users/${n.username}`} className="font-semibold text-primary-600 hover:underline">
                          {n.username}
                        </Link>{' '}
                        <Link
                          to={
                            n.questionId
                              ? `/questions/${n.questionId}${n.answerId ? `#answer-${n.answerId}` : ''}`
                              : n.answerId
                              ? `/answers/${n.answerId}`
                              : '#'
                          }
                          className="hover:underline"
                        >
                          {/* Remove username and 'someone' from content */}
                          {n.content.replace(n.username, '').replace('someone', '').replace('Someone', '').trim()}
                        </Link>
                      </>
                    ) : (
                      n.content
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationPanel; 