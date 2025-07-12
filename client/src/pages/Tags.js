import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiTag, FiMessageSquare, FiTrendingUp } from 'react-icons/fi';
import { questionService } from '../services/questionService';
import toast from 'react-hot-toast';

const Tags = () => {
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchTags();
  }, []);

  const fetchTags = async () => {
    try {
      setLoading(true);
      const response = await questionService.getTrendingTags();
      const tagsData = response.data?.tags || response.tags || [];
      setTags(Array.isArray(tagsData) ? tagsData : []);
    } catch (error) {
      console.error('Error fetching tags:', error);
      toast.error('Failed to load tags');
      setTags([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredTags = tags.filter(tag => 
    tag._id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tag.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="spinner w-8 h-8 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading tags...</p>
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Tags</h1>
          <p className="text-gray-600">
            Browse questions by topic or technology
          </p>
        </div>

        {/* Search */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="relative">
            <FiTag className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search tags..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Tags Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredTags.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <FiTag className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No tags found</h3>
              <p className="text-gray-600">
                {searchTerm ? 'Try adjusting your search criteria.' : 'No tags available yet.'}
              </p>
            </div>
          ) : (
            filteredTags.map((tag, index) => (
              <div key={tag._id || index} className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <Link
                    to={`/questions?tag=${tag._id || tag.name}`}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 hover:bg-blue-200 transition-colors"
                  >
                    <FiTag className="w-4 h-4 mr-1" />
                    {tag._id || tag.name}
                  </Link>
                  <span className="text-sm text-gray-500">
                    {tag.count || 0} questions
                  </span>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center text-sm text-gray-600">
                    <FiMessageSquare className="w-4 h-4 mr-2" />
                    <span>{tag.count || 0} questions</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <FiTrendingUp className="w-4 h-4 mr-2" />
                    <span>Trending</span>
                  </div>
                </div>

                <div className="mt-4">
                  <Link
                    to={`/questions?tag=${tag._id || tag.name}`}
                    className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                  >
                    View questions →
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Popular Tags Section */}
        {tags.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Popular Tags</h2>
            <div className="flex flex-wrap gap-2">
              {tags.slice(0, 20).map((tag, index) => (
                <Link
                  key={tag._id || index}
                  to={`/questions?tag=${tag._id || tag.name}`}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800 hover:bg-gray-200 transition-colors"
                >
                  <FiTag className="w-3 h-3 mr-1" />
                  {tag._id || tag.name}
                  <span className="ml-1 text-xs text-gray-500">({tag.count || 0})</span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Tags; 