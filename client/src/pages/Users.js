import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiUser, FiAward, FiTrendingUp, FiSearch } from 'react-icons/fi';
import { apiService } from '../services/api';
import toast from 'react-hot-toast';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    fetchTopUsers();
  }, []);

  useEffect(() => {
    if (searchTerm.trim()) {
      searchUsers();
    } else {
      setSearchResults([]);
    }
  }, [searchTerm]);

  const fetchTopUsers = async () => {
    try {
      setLoading(true);
      const response = await apiService.get('/users/top?limit=50');
      const usersData = response.data?.users || response.users || [];
      setUsers(Array.isArray(usersData) ? usersData : []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const searchUsers = async () => {
    if (!searchTerm.trim()) return;
    
    try {
      setIsSearching(true);
      const response = await apiService.get(`/users/search?q=${encodeURIComponent(searchTerm)}&limit=20`);
      const results = response.data?.users || response.users || [];
      setSearchResults(Array.isArray(results) ? results : []);
    } catch (error) {
      console.error('Error searching users:', error);
      toast.error('Failed to search users');
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const displayUsers = searchTerm.trim() ? searchResults : users;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="spinner w-8 h-8 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading users...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Users</h1>
          <p className="text-gray-600">
            {searchTerm.trim() ? 'Search results' : 'Top contributors and community members'}
          </p>
        </div>

        {/* Search */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search users by username or bio..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {isSearching && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <div className="spinner w-4 h-4"></div>
              </div>
            )}
          </div>
        </div>

        {/* Users List */}
        <div className="space-y-4">
          {displayUsers.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-8 text-center">
              <FiUser className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
              <p className="text-gray-600">
                {searchTerm ? 'Try adjusting your search criteria.' : 'No users available yet.'}
              </p>
            </div>
          ) : (
            displayUsers.map((user, index) => (
              <div key={user._id || index} className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center space-x-4">
                  {/* Avatar */}
                  <div className="flex-shrink-0">
                    {user.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user.username}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                        <FiUser className="w-6 h-6 text-gray-600" />
                      </div>
                    )}
                  </div>

                  {/* User Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <Link
                        to={`/users/${user.username}`}
                        className="text-lg font-medium text-primary-600 hover:text-primary-700 truncate"
                      >
                        {user.username}
                      </Link>
                      {user.badges && user.badges.length > 0 && (
                        <div className="flex space-x-1">
                          {user.badges.slice(0, 3).map((badge, badgeIndex) => (
                            <span
                              key={badgeIndex}
                              className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800"
                            >
                              <FiAward className="w-3 h-3 mr-1" />
                              {badge}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    {user.bio && (
                      <p className="text-gray-600 text-sm mb-2 line-clamp-2">
                        {user.bio}
                      </p>
                    )}

                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <div className="flex items-center">
                        <FiTrendingUp className="w-4 h-4 mr-1" />
                        <span>{user.reputation || 0} reputation</span>
                      </div>
                      <div className="flex items-center">
                        <FiUser className="w-4 h-4 mr-1" />
                        <span>Member since {new Date(user.createdAt || Date.now()).getFullYear()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex-shrink-0 text-right">
                    <div className="text-sm text-gray-500">
                      <div className="font-medium text-gray-900">{user.reputation || 0}</div>
                      <div>reputation</div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Top Users Section (when not searching) */}
        {!searchTerm.trim() && users.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Top Contributors</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {users.slice(0, 6).map((user, index) => (
                <div key={user._id || index} className="bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center space-x-3">
                    {user.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user.username}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                        <FiUser className="w-5 h-5 text-gray-600" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <Link
                        to={`/users/${user.username}`}
                        className="text-sm font-medium text-primary-600 hover:text-primary-700 truncate block"
                      >
                        {user.username}
                      </Link>
                      <div className="text-xs text-gray-500">
                        {user.reputation || 0} reputation
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Users; 