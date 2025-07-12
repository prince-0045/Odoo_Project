import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FiUser, FiAward, FiMessageSquare, FiTrendingUp, FiClock } from 'react-icons/fi';
import { apiService } from '../services/api';
import toast from 'react-hot-toast';

const UserProfile = () => {
  const { username } = useParams();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('questions');
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState([]);

  useEffect(() => {
    fetchUserProfile();
  }, [username]);

  useEffect(() => {
    if (user) {
      if (activeTab === 'questions') {
        fetchUserQuestions();
      } else if (activeTab === 'answers') {
        fetchUserAnswers();
      }
    }
  }, [user, activeTab]);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const response = await apiService.get(`/users/${username}`);
      setUser(response.data?.user || response.user);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      toast.error('Failed to load user profile');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserQuestions = async () => {
    try {
      const response = await apiService.get(`/users/${username}/questions`);
      const questionsData = response.data?.questions || response.questions || [];
      setQuestions(Array.isArray(questionsData) ? questionsData : []);
    } catch (error) {
      console.error('Error fetching user questions:', error);
      setQuestions([]);
    }
  };

  const fetchUserAnswers = async () => {
    try {
      const response = await apiService.get(`/users/${username}/answers`);
      const answersData = response.data?.answers || response.answers || [];
      setAnswers(Array.isArray(answersData) ? answersData : []);
    } catch (error) {
      console.error('Error fetching user answers:', error);
      setAnswers([]);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="spinner w-8 h-8 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading user profile...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white shadow rounded-lg p-8 text-center">
            <FiUser className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">User Not Found</h1>
            <p className="text-gray-600">The user "{username}" could not be found.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* User Header */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="flex items-center space-x-6">
            {user.avatar ? (
              <img
                src={user.avatar}
                alt={user.username}
                className="w-24 h-24 rounded-full object-cover"
              />
            ) : (
              <div className="w-24 h-24 bg-gray-300 rounded-full flex items-center justify-center">
                <FiUser className="w-12 h-12 text-gray-600" />
              </div>
            )}
            
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <h1 className="text-3xl font-bold text-gray-900">{user.username}</h1>
                {user.badges && user.badges.length > 0 && (
                  <div className="flex space-x-2">
                    {user.badges.map((badge, index) => (
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
              
              <div className="flex items-center space-x-6 text-sm text-gray-600 mb-3">
                <div className="flex items-center">
                  <FiTrendingUp className="w-4 h-4 mr-1" />
                  <span>{user.reputation || 0} reputation</span>
                </div>
                <div className="flex items-center">
                  <FiClock className="w-4 h-4 mr-1" />
                  <span>Member since {new Date(user.createdAt).getFullYear()}</span>
                </div>
              </div>
              
              {user.bio && (
                <p className="text-gray-700">{user.bio}</p>
              )}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white shadow rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-primary-600">{user.questionCount || 0}</div>
            <div className="text-sm text-gray-600">Questions</div>
          </div>
          <div className="bg-white shadow rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-success-600">{user.answerCount || 0}</div>
            <div className="text-sm text-gray-600">Answers</div>
          </div>
          <div className="bg-white shadow rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-warning-600">{user.acceptedAnswerCount || 0}</div>
            <div className="text-sm text-gray-600">Accepted Answers</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white shadow rounded-lg">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('questions')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'questions'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Questions ({user.questionCount || 0})
              </button>
              <button
                onClick={() => setActiveTab('answers')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'answers'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Answers ({user.answerCount || 0})
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'questions' && (
              <div className="space-y-4">
                {questions.length === 0 ? (
                  <div className="text-center py-8">
                    <FiMessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No questions yet.</p>
                  </div>
                ) : (
                  questions.map((question, index) => (
                    <div key={question._id || index} className="border-b border-gray-200 pb-4 last:border-b-0">
                      <Link
                        to={`/questions/${question._id}`}
                        className="text-lg font-medium text-primary-600 hover:text-primary-700 block mb-2"
                      >
                        {question.title}
                      </Link>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>{(question.votes?.upvotes?.length || 0) - (question.votes?.downvotes?.length || 0)} votes</span>
                        <span>{question.answers?.length || 0} answers</span>
                        <span>{new Date(question.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'answers' && (
              <div className="space-y-4">
                {answers.length === 0 ? (
                  <div className="text-center py-8">
                    <FiMessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No answers yet.</p>
                  </div>
                ) : (
                  answers.map((answer, index) => (
                    <div key={answer._id || index} className="border-b border-gray-200 pb-4 last:border-b-0">
                      <Link
                        to={`/questions/${answer.question?._id}`}
                        className="text-lg font-medium text-primary-600 hover:text-primary-700 block mb-2"
                      >
                        {answer.question?.title || 'Question'}
                      </Link>
                      <p className="text-gray-600 text-sm mb-2 line-clamp-2">
                        {answer.content?.replace(/<[^>]*>/g, '').substring(0, 200)}...
                      </p>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>{(answer.votes?.upvotes?.length || 0) - (answer.votes?.downvotes?.length || 0)} votes</span>
                        {answer.isAccepted && (
                          <span className="text-green-600 font-medium">✓ Accepted</span>
                        )}
                        <span>{new Date(answer.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile; 