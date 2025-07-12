import { apiService } from './api';

export const questionService = {
  // Get all questions with filters
  getQuestions: async (params = {}) => {
    const queryParams = new URLSearchParams();
    
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null) {
        queryParams.append(key, params[key]);
      }
    });
    
    const url = `/questions${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return await apiService.get(url);
  },

  // Get single question
  getQuestion: async (id) => {
    return await apiService.get(`/questions/${id}`);
  },

  // Create new question
  createQuestion: async (questionData) => {
    return await apiService.post('/questions', questionData);
  },

  // Update question
  updateQuestion: async (id, questionData) => {
    return await apiService.put(`/questions/${id}`, questionData);
  },

  // Delete question
  deleteQuestion: async (id) => {
    return await apiService.delete(`/questions/${id}`);
  },

  // Vote on question
  voteQuestion: async (id, voteType) => {
    return await apiService.post(`/questions/${id}/vote`, { voteType });
  },

  // Bookmark question
  bookmarkQuestion: async (id) => {
    return await apiService.post(`/questions/${id}/bookmark`);
  },

  // Get user's questions
  getUserQuestions: async (username, params = {}) => {
    const queryParams = new URLSearchParams();
    
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null) {
        queryParams.append(key, params[key]);
      }
    });
    
    const url = `/questions/user/${username}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return await apiService.get(url);
  },

  // Get trending tags
  getTrendingTags: async () => {
    return await apiService.get('/questions/tags/trending');
  },

  // Search questions
  searchQuestions: async (query, filters = {}) => {
    const params = { search: query, ...filters };
    return await this.getQuestions(params);
  },
}; 