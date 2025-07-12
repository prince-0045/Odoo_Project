import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import NotificationPanel from '../Notification/NotificationPanel';

const Layout = () => {
  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      <Header onNotificationClick={() => setShowNotifications(!showNotifications)} />
      
      <main className="flex-1">
        <Outlet />
      </main>
      
      <Footer />
      
      {/* Notification Panel */}
      {showNotifications && (
        <NotificationPanel 
          isOpen={showNotifications}
          onClose={() => setShowNotifications(false)}
        />
      )}
    </div>
  );
};

export default Layout; 