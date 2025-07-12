import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiMessageSquare, FiEye, FiClock, FiUser, FiTag, FiThumbsUp, FiThumbsDown, FiCheck } from 'react-icons/fi';
import { questionService } from '../services/questionService';
import { answerService } from '../services/answerService';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import ReactQuill, { Quill } from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import axios from 'axios';

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

const QuestionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  const [question, setQuestion] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [answerContent, setAnswerContent] = useState('');
  const [submittingAnswer, setSubmittingAnswer] = useState(false);

  useEffect(() => {
    fetchQuestionData();
  }, [id]);

  const fetchQuestionData = async () => {
    try {
      setLoading(true);
      const [questionResponse, answersResponse] = await Promise.all([
        questionService.getQuestion(id),
        answerService.getAnswers(id)
      ]);
      
      setQuestion(questionResponse.data.question);
      setAnswers(answersResponse.data?.answers || answersResponse.answers || []);
    } catch (error) {
      console.error('Error fetching question data:', error);
      toast.error('Failed to load question');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitAnswer = async (e) => {
    e.preventDefault();
    
    if (!currentUser) {
      toast.error('Please login to answer this question');
      navigate('/login');
      return;
    }

    if (!answerContent.trim()) {
      toast.error('Please enter an answer');
      return;
    }

    try {
      setSubmittingAnswer(true);
      
      const answerData = {
        questionId: id,
        content: answerContent
      };

      const response = await answerService.createAnswer(answerData);
      
      // Add the new answer to the list
      setAnswers(prev => [response.data.answer, ...prev]);
      setAnswerContent('');
      toast.success('Answer posted successfully!');
    } catch (error) {
      console.error('Error creating answer:', error);
      toast.error(error.message || 'Failed to post answer');
    } finally {
      setSubmittingAnswer(false);
    }
  };

  const handleVote = async (itemId, voteType, isAnswer = false) => {
    if (!currentUser) {
      toast.error('Please login to vote');
      navigate('/login');
      return;
    }

    try {
      if (isAnswer) {
        await answerService.voteAnswer(itemId, voteType);
      } else {
        await questionService.voteQuestion(itemId, voteType);
      }
      
      // Refresh the data
      fetchQuestionData();
      toast.success('Vote recorded!');
    } catch (error) {
      console.error('Error voting:', error);
      toast.error(error.message || 'Failed to record vote');
    }
  };

  const handleAcceptAnswer = async (answerId) => {
    if (!currentUser) {
      toast.error('Please login to accept answers');
      navigate('/login');
      return;
    }

    try {
      await answerService.acceptAnswer(answerId);
      fetchQuestionData();
      toast.success('Answer accepted!');
    } catch (error) {
      console.error('Error accepting answer:', error);
      let msg = 'Failed to accept answer.';
      if (error.response && error.response.data && error.response.data.message) msg = error.response.data.message;
      toast.error(msg);
    }
  };

  // Add delete logic for question
  const handleDeleteQuestion = async () => {
    if (!window.confirm('Are you sure you want to delete this question?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete((process.env.REACT_APP_API_URL || 'http://localhost:5000') + `/api/questions/${question._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      window.location.href = '/questions';
    } catch (err) {
      let msg = 'Failed to delete question.';
      if (err.response && err.response.data && err.response.data.message) msg = err.response.data.message;
      alert(msg);
    }
  };
  // Add delete logic for answer
  const handleDeleteAnswer = async (answerId) => {
    if (!window.confirm('Are you sure you want to delete this answer?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete((process.env.REACT_APP_API_URL || 'http://localhost:5000') + `/api/answers/${answerId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Remove answer from UI
      setAnswers((prev) => prev.filter((a) => a._id !== answerId));
    } catch (err) {
      let msg = 'Failed to delete answer.';
      if (err.response && err.response.data && err.response.data.message) msg = err.response.data.message;
      alert(msg);
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
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white shadow rounded-lg p-6">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!question) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white shadow rounded-lg p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Question Not Found</h1>
            <p className="text-gray-600">The question you're looking for doesn't exist or has been removed.</p>
          </div>
        </div>
      </div>
    );
  }

  console.log('currentUser:', currentUser);
  console.log('question.author:', question.author);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Question */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="flex items-start space-x-4">
            {/* Vote buttons */}
            <div className="flex flex-col items-center space-y-2">
              <button
                onClick={() => handleVote(question._id, 'upvote')}
                className="p-2 text-gray-400 hover:text-green-600"
                disabled={!currentUser}
              >
                <FiThumbsUp className="w-5 h-5" />
              </button>
              <span className="text-lg font-semibold text-gray-700">
                {(question.votes?.upvotes?.length || 0) - (question.votes?.downvotes?.length || 0)}
              </span>
              <button
                onClick={() => handleVote(question._id, 'downvote')}
                className="p-2 text-gray-400 hover:text-red-600"
                disabled={!currentUser}
              >
                <FiThumbsDown className="w-5 h-5" />
              </button>
            </div>

            {/* Question content */}
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">{question.title}</h1>
              
              <div className="prose max-w-none mb-6">
                <p className="text-gray-700 whitespace-pre-wrap">{question.description}</p>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-2 mb-4">
                {question.tags?.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                  >
                    <FiTag className="w-3 h-3 mr-1" />
                    {tag}
                  </span>
                ))}
              </div>

              {/* Question meta */}
              <div className="flex items-center justify-between text-sm text-gray-500 border-t pt-4">
                <div className="flex items-center space-x-4">
                  <span className="flex items-center">
                    <FiClock className="w-4 h-4 mr-1" />
                    {formatDate(question.createdAt)}
                  </span>
                  <span className="flex items-center">
                    <FiUser className="w-4 h-4 mr-1" />
                    {question.author?.username || 'Anonymous'}
                  </span>
                  <span className="flex items-center">
                    <FiEye className="w-4 h-4 mr-1" />
                    {question.views || 0} views
                  </span>
                </div>
                {question.isSolved && (
                  <span className="flex items-center text-green-600">
                    <FiCheck className="w-4 h-4 mr-1" />
                    Solved
                  </span>
                )}
              </div>
            </div>
          </div>
          {currentUser && question.author && currentUser._id !== question.author._id && (
            <div className="text-sm text-gray-400 mt-2">You are not the author of this question.</div>
          )}
          {currentUser && question.author && currentUser._id === question.author._id && (
            <button
              onClick={handleDeleteQuestion}
              className="ml-4 px-3 py-1 text-sm text-red-600 border border-red-600 rounded hover:bg-red-50"
            >
              Delete Question
            </button>
          )}
        </div>

        {/* Answers section */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            {answers.length} Answer{answers.length !== 1 ? 's' : ''}
          </h2>

          {/* Answer form */}
          {currentUser && (
            <div className="mb-8 border-b pb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Your Answer</h3>
              <form onSubmit={handleSubmitAnswer}>
                <ReactQuill
                  value={answerContent}
                  onChange={setAnswerContent}
                  className="mb-4 bg-white"
                  theme="snow"
                  placeholder="Write your answer here..."
                  modules={quillModules}
                />
                <div className="mt-4 flex justify-end">
                  <button
                    type="submit"
                    disabled={submittingAnswer || !answerContent.trim()}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {submittingAnswer ? 'Posting...' : 'Post Answer'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Answers list */}
          <div className="space-y-6">
            {answers.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No answers yet. Be the first to answer!</p>
            ) : (
              answers.map((answer) => (
                <div key={answer._id} className="border rounded-lg p-4">
                  <div className="flex items-start space-x-4">
                    {/* Vote buttons */}
                    <div className="flex flex-col items-center space-y-2">
                                             <button
                         onClick={() => handleVote(answer._id, 'upvote', true)}
                         className="p-2 text-gray-400 hover:text-green-600"
                         disabled={!currentUser}
                       >
                        <FiThumbsUp className="w-5 h-5" />
                      </button>
                      <span className="text-lg font-semibold text-gray-700">
                        {(answer.votes?.upvotes?.length || 0) - (answer.votes?.downvotes?.length || 0)}
                      </span>
                                             <button
                         onClick={() => handleVote(answer._id, 'downvote', true)}
                         className="p-2 text-gray-400 hover:text-red-600"
                         disabled={!currentUser}
                       >
                        <FiThumbsDown className="w-5 h-5" />
                      </button>
                      {answer.isAccepted && (
                        <div className="mt-2">
                          <FiCheck className="w-6 h-6 text-green-600" />
                        </div>
                      )}
                    </div>

                    {/* Answer content */}
                    <div className="flex-1">
                      <div className="prose max-w-none mb-4" dangerouslySetInnerHTML={{ __html: answer.content }} />

                      {/* Answer meta */}
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <div className="flex items-center space-x-4">
                          <span className="flex items-center">
                            <FiClock className="w-4 h-4 mr-1" />
                            {formatDate(answer.createdAt)}
                          </span>
                          <span className="flex items-center">
                            <FiUser className="w-4 h-4 mr-1" />
                            {answer.author?.username || 'Anonymous'}
                          </span>
                        </div>
                        
                        {/* Accept answer button (only for question author) */}
                        {currentUser && question.author?._id === currentUser._id && !question.isSolved && !answer.isAccepted && (
                          <button
                            onClick={() => handleAcceptAnswer(answer._id)}
                            className="flex items-center px-3 py-1 text-sm text-green-600 border border-green-600 rounded hover:bg-green-50"
                          >
                            <FiCheck className="w-4 h-4 mr-1" />
                            Accept
                          </button>
                        )}
                        {currentUser && answer.author && currentUser._id !== answer.author._id && (
                          <div className="text-xs text-gray-400 mt-1">You are not the author of this answer.</div>
                        )}
                        {currentUser && answer.author && currentUser._id === answer.author._id && (
                          <button
                            onClick={() => handleDeleteAnswer(answer._id)}
                            className="ml-4 px-3 py-1 text-sm text-red-600 border border-red-600 rounded hover:bg-red-50"
                          >
                            Delete Answer
                          </button>
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
    </div>
  );
};

export default QuestionDetail; 