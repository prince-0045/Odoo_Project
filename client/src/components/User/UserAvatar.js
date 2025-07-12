import React from 'react';
import { Link } from 'react-router-dom';
import { FiUser } from 'react-icons/fi';

const UserAvatar = ({ user, size = "md" }) => {
  const sizeClasses = {
    sm: "w-6 h-6",
    md: "w-8 h-8",
    lg: "w-12 h-12",
    xl: "w-16 h-16"
  };

  const textSizes = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
    xl: "text-lg"
  };

  return (
    <div className="relative">
      {user ? (
        <Link to="/profile" className="flex items-center space-x-2">
          {user.avatar ? (
            <img
              src={user.avatar}
              alt={user.username}
              className={`${sizeClasses[size]} rounded-full object-cover`}
            />
          ) : (
            <div className={`${sizeClasses[size]} bg-gray-300 rounded-full flex items-center justify-center`}>
              <FiUser className={`${textSizes[size]} text-gray-600`} />
            </div>
          )}
          <span className={`${textSizes[size]} text-gray-700 dark:text-gray-300`}>
            {user.username}
          </span>
        </Link>
      ) : (
        <div className="flex items-center space-x-2">
          <div className={`${sizeClasses[size]} bg-gray-300 rounded-full flex items-center justify-center`}>
            <FiUser className={`${textSizes[size]} text-gray-600`} />
          </div>
          <span className={`${textSizes[size]} text-gray-700 dark:text-gray-300`}>
            Guest
          </span>
        </div>
      )}
    </div>
  );
};

export default UserAvatar; 