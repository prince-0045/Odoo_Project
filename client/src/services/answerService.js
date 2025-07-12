import { apiService } from './api';

export const answerService = {
  // Get answers for a question
  getAnswers: async (questionId, params = {}) => {
    const queryParams = new URLSearchParams();
    
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null) {
        queryParams.append(key, params[key]);
      }
    });
    
    const url = `/answers/question/${questionId}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return await apiService.get(url);
  },

  // Create new answer
  createAnswer: async (answerData) => {
    return await apiService.post('/answers', answerData);
  },

  // Update answer
  updateAnswer: async (id, answerData) => {
    return await apiService.put(`/answers/${id}`, answerData);
  },

  // Delete answer
  deleteAnswer: async (id) => {
    console.log('[Frontend] Deleting answer:', id);
    return await apiService.delete(`/answers/${id}`);
  },

  // Vote on answer
  voteAnswer: async (id, voteType) => {
    console.log('[Frontend] Voting on answer:', id, voteType);
    return await apiService.post(`/answers/${id}/vote`, { voteType });
  },

  // Accept answer
  acceptAnswer: async (id) => {
    console.log('[Frontend] Accepting answer:', id);
    // Use PUT to match backend
    return await apiService.put(`/answers/${id}/accept`);
  },

  // Get user's answers
  getUserAnswers: async (username, params = {}) => {
    const queryParams = new URLSearchParams();
    
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null) {
        queryParams.append(key, params[key]);
      }
    });
    
    const url = `/answers/user/${username}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return await apiService.get(url);
  },

  // Post a comment on an answer
  postComment: async (answerId, content) => {
    return await apiService.post(`/answers/${answerId}/comments`, { content });
  },

  // Get comments for an answer
  getComments: async (answerId) => {
    return await apiService.get(`/answers/${answerId}/comments`);
  }
}; 