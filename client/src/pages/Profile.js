import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { FiUser, FiEdit2, FiSave, FiX, FiTrendingUp, FiMessageSquare, FiAward } from 'react-icons/fi';
import toast from 'react-hot-toast';

const Profile = () => {
  const { currentUser, updateUserProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    username: currentUser?.username || '',
    bio: currentUser?.bio || ''
  });

  const handleSave = async () => {
    try {
      const result = await updateUserProfile(formData);
      if (result.success) {
        setIsEditing(false);
      }
    } catch (error) {
      toast.error('Failed to update profile');
    }
  };

  const handleCancel = () => {
    setFormData({
      username: currentUser?.username || '',
      bio: currentUser?.bio || ''
    });
    setIsEditing(false);
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white shadow rounded-lg p-8 text-center">
            <FiUser className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Not Logged In</h1>
            <p className="text-gray-600">Please log in to view your profile.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <FiEdit2 className="w-4 h-4 mr-2" />
                Edit Profile
              </button>
            ) : (
              <div className="flex space-x-2">
                <button
                  onClick={handleSave}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <FiSave className="w-4 h-4 mr-2" />
                  Save
                </button>
                <button
                  onClick={handleCancel}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <FiX className="w-4 h-4 mr-2" />
                  Cancel
                </button>
              </div>
            )}
          </div>
          
          <div className="space-y-6">
            <div className="flex items-center space-x-4">
              {currentUser.avatar ? (
                <img
                  src={currentUser.avatar}
                  alt={currentUser.username}
                  className="w-20 h-20 rounded-full object-cover"
                />
              ) : (
                <div className="w-20 h-20 bg-gray-300 rounded-full flex items-center justify-center">
                  <FiUser className="w-10 h-10 text-gray-600" />
                </div>
              )}
              <div>
                <h2 className="text-xl font-semibold text-gray-900">{currentUser.username}</h2>
                <p className="text-gray-600">{currentUser.email}</p>
                {currentUser.badges && currentUser.badges.length > 0 && (
                  <div className="flex space-x-2 mt-2">
                    {currentUser.badges.map((badge, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800"
                      >
                        <FiAward className="w-3 h-3 mr-1" />
                        {badge}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="border-t pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Profile Information</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Username</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  ) : (
                    <p className="mt-1 text-sm text-gray-900">{currentUser.username}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Reputation</label>
                  <div className="mt-1 flex items-center">
                    <FiTrendingUp className="w-4 h-4 text-green-600 mr-2" />
                    <span className="text-sm text-gray-900">{currentUser.reputation || 0} points</span>
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Bio</label>
                  {isEditing ? (
                    <textarea
                      value={formData.bio}
                      onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                      rows={3}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      placeholder="Tell us about yourself..."
                    />
                  ) : (
                    <p className="mt-1 text-sm text-gray-900">
                      {currentUser.bio || 'No bio added yet.'}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="border-t pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Statistics</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="text-center">
                  <div className="text-2xl font-bold text-indigo-600">{currentUser.questionCount || 0}</div>
                  <div className="text-sm text-gray-600">Questions</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{currentUser.answerCount || 0}</div>
                  <div className="text-sm text-gray-600">Answers</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">{currentUser.acceptedAnswerCount || 0}</div>
                  <div className="text-sm text-gray-600">Accepted</div>
                </div>
              </div>
            </div>

            <div className="border-t pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Account Information</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Member Since</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {new Date(currentUser.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Last Seen</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {currentUser.lastSeen ? new Date(currentUser.lastSeen).toLocaleDateString() : 'Never'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile; 