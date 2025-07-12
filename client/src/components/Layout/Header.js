import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { FiSearch, FiBell, FiMenu, FiX, FiUser, FiLogOut, FiSettings } from 'react-icons/fi';
import SearchBar from '../Search/SearchBar';
import UserAvatar from '../User/UserAvatar';
import NotificationPanel from '../Notification/NotificationPanel';

const Header = ({ onNotificationClick }) => {
  const { currentUser, userProfile, logout } = useAuth();
  const { unreadCount } = useSocket();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/');
    setIsUserMenuOpen(false);
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
      <div className="container-responsive">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">S</span>
            </div>
            <span className="text-xl font-bold text-gray-900 dark:text-white">StackIt</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link
              to="/"
              className={`text-sm font-medium transition-colors ${
                isActive('/') 
                  ? 'text-primary-600 dark:text-primary-400' 
                  : 'text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white'
              }`}
            >
              Home
            </Link>
            <Link
              to="/questions"
              className={`text-sm font-medium transition-colors ${
                isActive('/questions') 
                  ? 'text-primary-600 dark:text-primary-400' 
                  : 'text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white'
              }`}
            >
              Questions
            </Link>
            <Link
              to="/tags"
              className={`text-sm font-medium transition-colors ${
                isActive('/tags') 
                  ? 'text-primary-600 dark:text-primary-400' 
                  : 'text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white'
              }`}
            >
              Tags
            </Link>
            <Link
              to="/users"
              className={`text-sm font-medium transition-colors ${
                isActive('/users') 
                  ? 'text-primary-600 dark:text-primary-400' 
                  : 'text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white'
              }`}
            >
              Users
            </Link>
          </nav>

          {/* Search Bar */}
          <div className="hidden md:block flex-1 max-w-md mx-8">
            <SearchBar />
          </div>

          {/* Right side */}
          <div className="flex items-center space-x-4">
            {/* Ask Question Button */}
            {currentUser && (
              <Link
                to="/ask"
                className="hidden sm:inline-flex items-center px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors"
              >
                Ask Question
              </Link>
            )}

            {/* Notifications */}
            {currentUser && (
              <NotificationPanel />
            )}

            {/* User Menu */}
            {currentUser ? (
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center space-x-2 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <UserAvatar user={userProfile} size="sm" />
                  <span className="hidden sm:block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {userProfile?.username}
                  </span>
                </button>

                {/* User Dropdown */}
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-strong border border-gray-200 dark:border-gray-700 z-50">
                    <div className="py-1">
                      <Link
                        to="/profile"
                        className="dropdown-item flex items-center"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        <FiUser className="w-4 h-4 mr-3" />
                        Profile
                      </Link>
                      <Link
                        to="/dashboard"
                        className="dropdown-item flex items-center"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        <FiSettings className="w-4 h-4 mr-3" />
                        Dashboard
                      </Link>
                      <hr className="my-1 border-gray-200 dark:border-gray-700" />
                      <button
                        onClick={handleLogout}
                        className="dropdown-item flex items-center w-full text-left"
                      >
                        <FiLogOut className="w-4 h-4 mr-3" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  to="/login"
                  className="text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="inline-flex items-center px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors"
                >
                  Sign Up
                </Link>
              </div>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition-colors"
            >
              {isMenuOpen ? <FiX className="w-5 h-5" /> : <FiMenu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-gray-200 dark:border-gray-700">
            <div className="px-2 pt-2 pb-3 space-y-1">
              <Link
                to="/"
                className={`block px-3 py-2 rounded-md text-base font-medium ${
                  isActive('/') 
                    ? 'text-primary-600 bg-primary-50 dark:bg-primary-900/20' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-700'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                Home
              </Link>
              <Link
                to="/questions"
                className={`block px-3 py-2 rounded-md text-base font-medium ${
                  isActive('/questions') 
                    ? 'text-primary-600 bg-primary-50 dark:bg-primary-900/20' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-700'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                Questions
              </Link>
              <Link
                to="/tags"
                className={`block px-3 py-2 rounded-md text-base font-medium ${
                  isActive('/tags') 
                    ? 'text-primary-600 bg-primary-50 dark:bg-primary-900/20' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-700'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                Tags
              </Link>
              <Link
                to="/users"
                className={`block px-3 py-2 rounded-md text-base font-medium ${
                  isActive('/users') 
                    ? 'text-primary-600 bg-primary-50 dark:bg-primary-900/20' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-700'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                Users
              </Link>
              {currentUser && (
                <Link
                  to="/ask"
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-700"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Ask Question
                </Link>
              )}
            </div>
            
            {/* Mobile Search */}
            <div className="px-2 pb-3">
              <SearchBar />
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header; 