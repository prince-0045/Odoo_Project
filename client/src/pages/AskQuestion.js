import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { questionService } from '../services/questionService';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import ReactQuill, { Quill } from 'react-quill';
import 'react-quill/dist/quill.snow.css';

// Add image upload handler
function imageHandler() {
  const input = document.createElement('input');
  input.setAttribute('type', 'file');
  input.setAttribute('accept', 'image/*');
  input.click();
  input.onchange = async () => {
    const file = input.files[0];
    if (file) {
      const formData = new FormData();
      formData.append('image', file);
      try {
        // You should have an endpoint for image upload, e.g. /api/upload
        const res = await fetch((process.env.REACT_APP_API_URL || 'http://localhost:5000') + '/api/upload', {
          method: 'POST',
          body: formData,
        });
        const data = await res.json();
        if (data.url) {
          const quill = this.quill;
          const range = quill.getSelection();
          quill.insertEmbed(range.index, 'image', data.url);
        }
      } catch (err) {
        alert('Image upload failed');
      }
    }
  };
}

const quillModules = {
  toolbar: {
    container: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike', 'blockquote', 'code-block'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'align': [] }],
      ['link', 'image'],
      ['clean']
    ],
    handlers: {
      image: imageHandler
    }
  },
};

const AskQuestion = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    tags: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!currentUser) {
      toast.error('Please login to ask a question');
      navigate('/login');
      return;
    }

    try {
      setLoading(true);
      
      // Parse tags from comma-separated string
      const tagsArray = formData.tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);

      // Validate input before sending
      if (formData.title.length < 10) {
        toast.error('Title must be at least 10 characters long');
        return;
      }

      if (formData.description.length < 20) {
        toast.error('Description must be at least 20 characters long');
        return;
      }

      if (tagsArray.length === 0) {
        toast.error('At least one tag is required');
        return;
      }

      const questionData = {
        title: formData.title,
        description: formData.description,
        tags: tagsArray
      };

      const response = await questionService.createQuestion(questionData);
      
      toast.success('Question posted successfully!');
      navigate(`/questions/${response.data.question._id}`);
    } catch (error) {
      console.error('Error creating question:', error);
      toast.error(error.message || 'Failed to post question');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Ask a Question</h1>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                Title
              </label>
              <input
                type="text"
                id="title"
                required
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="What's your question? Be specific."
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
              />
              <p className="mt-1 text-sm text-gray-500">
                {formData.title.length}/10 characters minimum
              </p>
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <ReactQuill
                value={formData.description}
                onChange={(content) => setFormData({...formData, description: content})}
                className="mb-4 bg-white"
                theme="snow"
                placeholder="Describe your question in detail..."
                modules={quillModules}
              />
              <p className="mt-1 text-sm text-gray-500">
                {formData.description.length}/20 characters minimum
              </p>
            </div>

            <div>
              <label htmlFor="tags" className="block text-sm font-medium text-gray-700">
                Tags
              </label>
              <input
                type="text"
                id="tags"
                required
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="javascript, react, nodejs (comma separated)"
                value={formData.tags}
                onChange={(e) => setFormData({...formData, tags: e.target.value})}
              />
              <p className="mt-1 text-sm text-gray-500">
                At least one tag required (comma separated)
              </p>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
                disabled={loading}
              >
                {loading ? 'Posting...' : 'Post Question'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AskQuestion; 