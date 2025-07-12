import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';
import axios from 'axios';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { currentUser } = useAuth();

  // Fetch notifications from backend on login
  useEffect(() => {
    const fetchNotifications = async () => {
      if (currentUser) {
        const token = localStorage.getItem('token');
        try {
          const res = await axios.get(
            (process.env.REACT_APP_API_URL || 'http://localhost:5000') + '/api/notifications',
            { headers: { Authorization: `Bearer ${token}` } }
          );
          setNotifications(res.data.data.notifications || []);
          setUnreadCount(
            (res.data.data.notifications || []).filter(n => !n.isRead).length
          );
        } catch (err) {
          console.error('Failed to fetch notifications:', err);
        }
      } else {
        setNotifications([]);
        setUnreadCount(0);
      }
    };
    fetchNotifications();
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) {
      // Get JWT token for authentication
      const connectSocket = async () => {
        try {
          const token = localStorage.getItem('token');
          console.log('Connecting socket with token:', token); // Debug log
          
          const newSocket = io(process.env.REACT_APP_API_URL || 'http://localhost:5000', {
            auth: {
              token: token
            },
            transports: ['websocket', 'polling']
          });

          newSocket.on('connect', () => {
            console.log('Socket connected');
            setConnected(true);
          });

          newSocket.on('disconnect', () => {
            console.log('Socket disconnected');
            setConnected(false);
          });

          newSocket.on('connect_error', (error) => {
            console.error('Socket connection error:', error);
            setConnected(false);
          });

          // Listen for notifications
          newSocket.on('notification', (notification) => {
            console.log('New notification received:', notification);
            // Add notification to state (avoid duplicates)
            setNotifications(prev => {
              // If notification has _id, avoid duplicates
              if (notification._id && prev.some(n => n._id === notification._id)) {
                return prev;
              }
              return [notification, ...prev];
            });
            setUnreadCount(prev => prev + 1);
            // Show toast notification
            toast(notification.content, {
              icon: getNotificationIcon(notification.type),
              duration: 5000,
            });
          });

          // Listen for real-time updates
          newSocket.on('question_update', (data) => {
            console.log('Question updated:', data);
            // Handle question updates (e.g., new answers, votes)
          });

          newSocket.on('answer_update', (data) => {
            console.log('Answer updated:', data);
            // Handle answer updates (e.g., new votes, comments)
          });

          setSocket(newSocket);
        } catch (error) {
          console.error('Failed to connect socket:', error);
        }
      };

      connectSocket();

      return () => {
        if (socket) {
          socket.disconnect();
        }
      };
    } else {
      // Disconnect socket when user logs out
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setConnected(false);
        setNotifications([]);
        setUnreadCount(0);
      }
    }
  }, [currentUser]);

  // Get notification icon based on type
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'answer':
        return '💬';
      case 'vote':
        return '👍';
      case 'accept':
        return '✅';
      case 'comment':
        return '💭';
      case 'mention':
        return '📢';
      default:
        return '🔔';
    }
  };

  // Mark notification as read
  const markNotificationAsRead = (notificationId) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification._id === notificationId 
          ? { ...notification, isRead: true }
          : notification
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  // Mark all notifications as read
  const markAllNotificationsAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, isRead: true }))
    );
    setUnreadCount(0);
  };

  // Add notification to state (for testing or manual addition)
  const addNotification = (notification) => {
    setNotifications(prev => [notification, ...prev]);
    if (!notification.isRead) {
      setUnreadCount(prev => prev + 1);
    }
  };

  // Remove notification from state
  const removeNotification = (notificationId) => {
    setNotifications(prev => 
      prev.filter(notification => notification._id !== notificationId)
    );
  };

  // Emit custom events
  const emit = (event, data) => {
    if (socket && connected) {
      socket.emit(event, data);
    }
  };

  const value = {
    socket,
    connected,
    notifications,
    unreadCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    addNotification,
    removeNotification,
    emit,
    setNotifications, // Expose for NotificationPanel
    setUnreadCount,   // Expose for NotificationPanel
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
}; 