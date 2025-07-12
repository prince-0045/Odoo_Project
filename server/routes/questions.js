const express = require('express');
const router = express.Router();
const Question = require('../models/Question');
const Answer = require('../models/Answer');
const Notification = require('../models/Notification');
const { authenticateToken, optionalAuth, requireOwnership, rateLimit } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

// @desc    Get all questions with filters
// @route   GET /api/questions
// @access  Public
const getQuestions = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    sort = 'newest',
    tag,
    search,
    status,
    isSolved
  } = req.query;

  const skip = (page - 1) * limit;
  const query = {};

  // Apply filters
  if (tag) query.tags = { $in: [tag] };
  if (status) query.status = status;
  if (isSolved !== undefined) query.isSolved = isSolved === 'true';

  let questions;
  let total;

  if (search) {
    // Text search
    questions = await Question.search(search, { tags: tag ? [tag] : [], status, isSolved });
    total = questions.length;
  } else {
    // Regular query
    total = await Question.countDocuments(query);
    
    let sortQuery = {};
    switch (sort) {
      case 'newest':
        sortQuery = { createdAt: -1 };
        break;
      case 'oldest':
        sortQuery = { createdAt: 1 };
        break;
      case 'votes':
        sortQuery = { 'votes.upvotes': -1, createdAt: -1 };
        break;
      case 'trending':
        questions = await Question.getTrending(parseInt(limit));
        break;
      default:
        sortQuery = { createdAt: -1 };
    }

    if (sort !== 'trending') {
      questions = await Question.find(query)
        .sort(sortQuery)
        .skip(skip)
        .limit(parseInt(limit))
        .populate('author', 'username avatar reputation badges')
        .populate('acceptedAnswer')
        .lean();
    }
  }

  // Add vote status for authenticated users
  if (req.user) {
    questions = questions.map(question => ({
      ...question,
      userVote: question.votes.upvotes.includes(req.user._id) ? 'upvote' :
                question.votes.downvotes.includes(req.user._id) ? 'downvote' : null,
      isBookmarked: question.bookmarks.includes(req.user._id)
    }));
  }

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

// @desc    Get single question
// @route   GET /api/questions/:id
// @access  Public
const getQuestion = asyncHandler(async (req, res) => {
  const question = await Question.findById(req.params.id)
    .populate('author', 'username avatar reputation badges')
    .populate('acceptedAnswer')
    .populate('editHistory.editedBy', 'username');

  if (!question) {
    return res.status(404).json({
      success: false,
      message: 'Question not found'
    });
  }

  // Increment views
  await question.incrementViews();

  // Get answers
  const answers = await Answer.getByQuestion(req.params.id, 1, 50, 'votes');

  // Add vote status for authenticated users
  if (req.user) {
    question.userVote = question.votes.upvotes.includes(req.user._id) ? 'upvote' :
                       question.votes.downvotes.includes(req.user._id) ? 'downvote' : null;
    question.isBookmarked = question.bookmarks.includes(req.user._id);
    
    answers.forEach(answer => {
      answer.userVote = answer.votes.upvotes.includes(req.user._id) ? 'upvote' :
                       answer.votes.downvotes.includes(req.user._id) ? 'downvote' : null;
    });
  }

  res.json({
    success: true,
    data: {
      question,
      answers
    }
  });
});

// @desc    Create question
// @route   POST /api/questions
// @access  Private
const createQuestion = asyncHandler(async (req, res) => {
  const { title, description, tags } = req.body;

  const question = await Question.create({
    title,
    description,
    tags,
    author: req.user._id
  });

  await question.populate('author', 'username avatar reputation badges');

  res.status(201).json({
    success: true,
    message: 'Question created successfully',
    data: { question }
  });
});

// @desc    Update question
// @route   PUT /api/questions/:id
// @access  Private
const updateQuestion = asyncHandler(async (req, res) => {
  const { title, description, tags } = req.body;

  const question = await Question.findById(req.params.id);
  if (!question) {
    return res.status(404).json({
      success: false,
      message: 'Question not found'
    });
  }

  // Check ownership
  if (!question.author.equals(req.user._id)) {
    return res.status(403).json({
      success: false,
      message: 'You can only edit your own questions'
    });
  }

  // Store edit history
  const editHistory = {
    editedBy: req.user._id,
    editedAt: new Date(),
    previousTitle: question.title,
    previousDescription: question.description,
    previousTags: question.tags
  };

  question.title = title || question.title;
  question.description = description || question.description;
  question.tags = tags || question.tags;
  question.editHistory.push(editHistory);

  await question.save();
  await question.populate('author', 'username avatar reputation badges');
  await question.populate('editHistory.editedBy', 'username');

  res.json({
    success: true,
    message: 'Question updated successfully',
    data: { question }
  });
});

// @desc    Delete question
// @route   DELETE /api/questions/:id
// @access  Private
const deleteQuestion = asyncHandler(async (req, res) => {
  const question = await Question.findById(req.params.id);
  if (!question) {
    return res.status(404).json({
      success: false,
      message: 'Question not found'
    });
  }

  // Check ownership
  if (!question.author.equals(req.user._id)) {
    return res.status(403).json({
      success: false,
      message: 'You can only delete your own questions'
    });
  }

  // Delete associated answers
  await Answer.deleteMany({ question: req.params.id });

  await question.remove();

  res.json({
    success: true,
    message: 'Question deleted successfully'
  });
});

// @desc    Vote on question
// @route   POST /api/questions/:id/vote
// @access  Private
const voteQuestion = asyncHandler(async (req, res) => {
  const { voteType } = req.body; // 'upvote', 'downvote', or 'remove'

  const question = await Question.findById(req.params.id);
  if (!question) {
    return res.status(404).json({
      success: false,
      message: 'Question not found'
    });
  }

  if (voteType === 'remove') {
    await question.removeVote(req.user._id);
  } else {
    await question.addVote(req.user._id, voteType);
  }

  // --- Notification logic for question votes ---
  const io = req.app.get('io');
  console.log('[voteQuestion] io:', !!io, 'question.author:', question.author?.toString(), 'voter:', req.user._id.toString(), 'voteType:', voteType);
  if (io && !question.author.equals(req.user._id) && voteType !== 'remove') {
    let username = req.user.username;
    console.log('[Notification Debug] req.user:', req.user);
    if (!username) {
      const User = require('../models/User');
      const userDoc = await User.findById(req.user._id);
      console.log('[Notification Debug] userDoc:', userDoc);
      username = userDoc && userDoc.username ? userDoc.username : 'Someone';
    }
    console.log('[Notification Debug] Final username:', username);
    const notification = await Notification.createVoteNotification(
      question._id,
      'question',
      req.user._id,
      question.author,
      voteType
    );
    // Update notification with username
    if (notification) {
      notification.username = username;
      await notification.save();
    }
    io.to(`user_${question.author}`).emit('notification', {
      type: 'vote',
      content: `${username} ${voteType}d your question`,
      questionId: question._id,
      username: username,
      sender: req.user._id
    });
  } else {
    console.log('[voteQuestion] Notification not sent (maybe self-vote or remove)');
  }
  // --- End notification logic ---

  res.json({
    success: true,
    message: 'Vote updated successfully',
    data: {
      voteCount: question.voteCount,
      userVote: voteType === 'remove' ? null : voteType
    }
  });
});

// @desc    Bookmark question
// @route   POST /api/questions/:id/bookmark
// @access  Private
const bookmarkQuestion = asyncHandler(async (req, res) => {
  const question = await Question.findById(req.params.id);
  if (!question) {
    return res.status(404).json({
      success: false,
      message: 'Question not found'
    });
  }

  const isBookmarked = question.bookmarks.includes(req.user._id);
  
  if (isBookmarked) {
    await question.removeBookmark(req.user._id);
  } else {
    await question.addBookmark(req.user._id);
  }

  res.json({
    success: true,
    message: isBookmarked ? 'Question removed from bookmarks' : 'Question bookmarked',
    data: {
      isBookmarked: !isBookmarked
    }
  });
});

// @desc    Get user's questions
// @route   GET /api/questions/user/:userId
// @access  Public
const getUserQuestions = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const skip = (page - 1) * limit;

  const questions = await Question.find({ author: req.params.userId })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit))
    .populate('author', 'username avatar reputation badges')
    .populate('acceptedAnswer')
    .lean();

  const total = await Question.countDocuments({ author: req.params.userId });

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

// @desc    Get trending tags
// @route   GET /api/questions/tags/trending
// @access  Public
const getTrendingTags = asyncHandler(async (req, res) => {
  const tags = await Question.aggregate([
    { $unwind: '$tags' },
    {
      $group: {
        _id: '$tags',
        count: { $sum: 1 }
      }
    },
    { $sort: { count: -1 } },
    { $limit: 20 }
  ]);

  res.json({
    success: true,
    data: { tags }
  });
});

// Routes
router.get('/', optionalAuth, getQuestions);
router.get('/tags/trending', getTrendingTags);
router.get('/user/:userId', getUserQuestions);
router.get('/:id', optionalAuth, getQuestion);

router.post('/', authenticateToken, rateLimit(5, 60000), createQuestion);
router.put('/:id', authenticateToken, requireOwnership('Question'), updateQuestion);
router.delete('/:id', authenticateToken, requireOwnership('Question'), deleteQuestion);
router.post('/:id/vote', authenticateToken, rateLimit(10, 60000), voteQuestion);
router.post('/:id/bookmark', authenticateToken, bookmarkQuestion);

module.exports = router; 