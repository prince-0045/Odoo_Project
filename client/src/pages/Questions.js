import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiMessageSquare, FiEye, FiClock, FiUser, FiTag } from 'react-icons/fi';
import { questionService } from '../services/questionService';
import toast from 'react-hot-toast';

const Questions = () => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    sort: 'newest',
    tags: '',
    search: ''
  });

  useEffect(() => {
    fetchQuestions();
  }, [filters]);

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const response = await questionService.getQuestions(filters);
      console.log('API Response:', response); // Debug log
      
      // Handle different response structures
      const questionsArray = response.data?.questions || response.questions || (Array.isArray(response) ? response : []);
      console.log('Questions array:', questionsArray); // Debug log
      
      setQuestions(Array.isArray(questionsArray) ? questionsArray : []);
    } catch (error) {
      console.error('Error fetching questions:', error);
      toast.error('Failed to load questions');
      setQuestions([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="spinner w-8 h-8 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading questions...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">All Questions</h1>
            <p className="text-gray-600">
              {questions.length} question{questions.length !== 1 ? 's' : ''} found
            </p>
          </div>
          <Link
            to="/ask"
            className="inline-flex items-center px-4 py-2 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors"
          >
            Ask Question
          </Link>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search questions..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              />
            </div>
            <select
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              value={filters.sort}
              onChange={(e) => setFilters({ ...filters, sort: e.target.value })}
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="votes">Most Voted</option>
              <option value="answers">Most Answered</option>
            </select>
          </div>
        </div>

        {/* Questions List */}
        <div className="space-y-4">
          {questions.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-8 text-center">
              <FiMessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No questions found</h3>
              <p className="text-gray-600 mb-4">
                {filters.search ? 'Try adjusting your search criteria.' : 'Be the first to ask a question!'}
              </p>
              <Link
                to="/ask"
                className="inline-flex items-center px-4 py-2 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors"
              >
                Ask Question
              </Link>
            </div>
          ) : (
            (Array.isArray(questions) ? questions : []).map((question) => (
              <div key={question._id} className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
                <div className="flex gap-4">
                  {/* Stats */}
                  <div className="flex flex-col items-center text-sm text-gray-500 min-w-[60px]">
                    <div className="font-medium text-gray-900">
                      {(question.votes?.upvotes?.length || 0) - (question.votes?.downvotes?.length || 0)}
                    </div>
                    <div>votes</div>
                    <div className="font-medium text-gray-900 mt-2">{question.answers?.length || 0}</div>
                    <div>answers</div>
                    <div className="font-medium text-gray-900 mt-2">{question.views || 0}</div>
                    <div>views</div>
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <Link
                      to={`/questions/${question._id}`}
                      className="text-lg font-medium text-primary-600 hover:text-primary-700 mb-2 block"
                    >
                      {question.title}
                    </Link>
                    <p className="text-gray-600 mb-3 line-clamp-2">
                      {question.description?.replace(/<[^>]*>/g, '').substring(0, 200)}...
                    </p>
                    
                    {/* Tags */}
                    <div className="flex flex-wrap gap-2 mb-3">
                      {question.tags?.slice(0, 3).map((tag, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                        >
                          <FiTag className="w-3 h-3 mr-1" />
                          {tag}
                        </span>
                      ))}
                      {question.tags?.length > 3 && (
                        <span className="text-xs text-gray-500">
                          +{question.tags.length - 3} more
                        </span>
                      )}
                    </div>

                    {/* Meta */}
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                          <FiUser className="w-4 h-4" />
                          <span>{question.author?.username || 'Anonymous'}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <FiClock className="w-4 h-4" />
                          <span>{formatDate(question.createdAt)}</span>
                        </div>
                      </div>
                      {question.isAccepted && (
                        <div className="flex items-center gap-1 text-green-600">
                          <FiMessageSquare className="w-4 h-4" />
                          <span>Accepted</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Questions; 