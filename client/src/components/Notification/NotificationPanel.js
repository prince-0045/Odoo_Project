import React, { useState } from 'react';
import { useSocket } from '../../context/SocketContext';
import { Link } from 'react-router-dom';
import axios from 'axios';
// Bell icon from Heroicons
// https://heroicons.com/

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
        {/* Minimal bold outline bell icon */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-6 w-6"
        >
          <path d="M12 22a2 2 0 0 0 2-2H10a2 2 0 0 0 2 2z" />
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
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
                        {/* If notification is a mention/comment and has answerId and commentId, link directly to the comment */}
                        {n.answerId && n.commentId && n.questionId ? (
                          <Link
                            to={`/questions/${n.questionId}#answer-${n.answerId}-comment-${n.commentId}`}
                            className="hover:underline"
                          >
                            {n.content.replace(n.username, '').replace('someone', '').replace('Someone', '').trim()}
                          </Link>
                        ) : n.questionId ? (
                          <Link
                            to={`/questions/${n.questionId}${n.answerId ? `#answer-${n.answerId}` : ''}`}
                            className="hover:underline"
                          >
                            {n.content.replace(n.username, '').replace('someone', '').replace('Someone', '').trim()}
                          </Link>
                        ) : n.answerId ? (
                          <Link to={`/answers/${n.answerId}`} className="hover:underline">
                            {n.content.replace(n.username, '').replace('someone', '').replace('Someone', '').trim()}
                          </Link>
                        ) : (
                          n.content
                        )}
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