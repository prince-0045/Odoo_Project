const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Question = require('../models/Question');
const Answer = require('../models/Answer');
const { authenticateToken, optionalAuth } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

// @desc    Get user profile
// @route   GET /api/users/:username
// @access  Public
const getUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findOne({ username: req.params.username })
    .populate('questionCount answerCount acceptedAnswerCount');

  if (!user || !user.isActive) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  res.json({
    success: true,
    data: {
      user: {
        _id: user._id,
        username: user.username,
        avatar: user.avatar,
        bio: user.bio,
        reputation: user.reputation,
        badges: user.badges,
        isVerified: user.isVerified,
        questionCount: user.questionCount,
        answerCount: user.answerCount,
        acceptedAnswerCount: user.acceptedAnswerCount,
        lastSeen: user.lastSeen,
        createdAt: user.createdAt
      }
    }
  });
});

// @desc    Get user's questions
// @route   GET /api/users/:username/questions
// @access  Public
const getUserQuestions = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const skip = (page - 1) * limit;

  const user = await User.findOne({ username: req.params.username });
  if (!user || !user.isActive) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  const questions = await Question.find({ author: user._id })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit))
    .populate('author', 'username avatar reputation badges')
    .populate('acceptedAnswer')
    .lean();

  const total = await Question.countDocuments({ author: user._id });

  res.json({
    success: true,
    data: {
      questions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    }
  });
});

// @desc    Get user's answers
// @route   GET /api/users/:username/answers
// @access  Public
const getUserAnswers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const skip = (page - 1) * limit;

  const user = await User.findOne({ username: req.params.username });
  if (!user || !user.isActive) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  const answers = await Answer.find({ author: user._id })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit))
    .populate('author', 'username avatar reputation badges')
    .populate('question', 'title tags')
    .lean();

  const total = await Answer.countDocuments({ author: user._id });

  res.json({
    success: true,
    data: {
      answers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    }
  });
});

// @desc    Get user's accepted answers
// @route   GET /api/users/:username/accepted-answers
// @access  Public
const getUserAcceptedAnswers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const skip = (page - 1) * limit;

  const user = await User.findOne({ username: req.params.username });
  if (!user || !user.isActive) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  const answers = await Answer.getAcceptedByUser(user._id, parseInt(limit));
  const total = await Answer.countDocuments({ author: user._id, isAccepted: true });

  res.json({
    success: true,
    data: {
      answers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    }
  });
});

// @desc    Get user statistics
// @route   GET /api/users/:username/stats
// @access  Public
const getUserStats = asyncHandler(async (req, res) => {
  const user = await User.findOne({ username: req.params.username });
  if (!user || !user.isActive) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  // Get detailed statistics
  const questionCount = await Question.countDocuments({ author: user._id });
  const answerCount = await Answer.countDocuments({ author: user._id });
  const acceptedAnswerCount = await Answer.countDocuments({ author: user._id, isAccepted: true });
  
  // Get total votes received
  const questions = await Question.find({ author: user._id });
  const answers = await Answer.find({ author: user._id });
  
  const totalQuestionVotes = questions.reduce((sum, q) => sum + q.voteCount, 0);
  const totalAnswerVotes = answers.reduce((sum, a) => sum + a.voteCount, 0);
  const totalVotes = totalQuestionVotes + totalAnswerVotes;

  // Get top tags
  const topTags = await Question.aggregate([
    { $match: { author: user._id } },
    { $unwind: '$tags' },
    {
      $group: {
        _id: '$tags',
        count: { $sum: 1 }
      }
    },
    { $sort: { count: -1 } },
    { $limit: 5 }
  ]);

  // Get recent activity
  const recentQuestions = await Question.find({ author: user._id })
    .sort({ createdAt: -1 })
    .limit(5)
    .select('title createdAt');

  const recentAnswers = await Answer.find({ author: user._id })
    .sort({ createdAt: -1 })
    .limit(5)
    .populate('question', 'title')
    .select('content createdAt question');

  res.json({
    success: true,
    data: {
      stats: {
        questionCount,
        answerCount,
        acceptedAnswerCount,
        totalVotes,
        reputation: user.reputation,
        badges: user.badges,
        memberSince: user.createdAt
      },
      topTags,
      recentActivity: {
        questions: recentQuestions,
        answers: recentAnswers
      }
    }
  });
});

// @desc    Get top users
// @route   GET /api/users/top
// @access  Public
const getTopUsers = asyncHandler(async (req, res) => {
  const { limit = 10 } = req.query;

  const users = await User.getTopUsers(parseInt(limit));

  res.json({
    success: true,
    data: { users }
  });
});

// @desc    Search users
// @route   GET /api/users/search
// @access  Public
const searchUsers = asyncHandler(async (req, res) => {
  const { q: query, page = 1, limit = 10 } = req.query;
  const skip = (page - 1) * limit;

  if (!query) {
    return res.status(400).json({
      success: false,
      message: 'Search query is required'
    });
  }

  const searchRegex = new RegExp(query, 'i');
  const users = await User.find({
    $or: [
      { username: searchRegex },
      { bio: searchRegex }
    ],
    isActive: true
  })
    .sort({ reputation: -1, username: 1 })
    .skip(skip)
    .limit(parseInt(limit))
    .select('username avatar bio reputation badges')
    .lean();

  const total = await User.countDocuments({
    $or: [
      { username: searchRegex },
      { bio: searchRegex }
    ],
    isActive: true
  });

  res.json({
    success: true,
    data: {
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    }
  });
});

// @desc    Update user preferences
// @route   PUT /api/users/preferences
// @access  Private
const updatePreferences = asyncHandler(async (req, res) => {
  const { preferences } = req.body;

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { preferences },
    { new: true, runValidators: true }
  );

  res.json({
    success: true,
    message: 'Preferences updated successfully',
    data: {
      preferences: user.preferences
    }
  });
});

// Routes
router.get('/top', getTopUsers);
router.get('/search', searchUsers);
router.get('/:username', getUserProfile);
router.get('/:username/questions', getUserQuestions);
router.get('/:username/answers', getUserAnswers);
router.get('/:username/accepted-answers', getUserAcceptedAnswers);
router.get('/:username/stats', getUserStats);

router.put('/preferences', authenticateToken, updatePreferences);

module.exports = router; 