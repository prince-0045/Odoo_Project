const express = require('express');
const router = express.Router();
const Answer = require('../models/Answer');
const Question = require('../models/Question');
const Notification = require('../models/Notification');
const { authenticateToken, requireOwnership, rateLimit } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

// @desc    Get answers for a question
// @route   GET /api/answers/question/:questionId
// @access  Public
const getAnswersByQuestion = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, sort = 'votes' } = req.query;

  const answers = await Answer.getByQuestion(req.params.questionId, parseInt(page), parseInt(limit), sort);
  const total = await Answer.countDocuments({ question: req.params.questionId });

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

// @desc    Get single answer
// @route   GET /api/answers/:id
// @access  Public
const getAnswer = asyncHandler(async (req, res) => {
  const answer = await Answer.findById(req.params.id)
    .populate('author', 'username avatar reputation badges')
    .populate('comments.author', 'username avatar')
    .populate('question', 'title');

  if (!answer) {
    return res.status(404).json({
      success: false,
      message: 'Answer not found'
    });
  }

  res.json({
    success: true,
    data: { answer }
  });
});

// @desc    Create answer
// @route   POST /api/answers
// @access  Private
const createAnswer = asyncHandler(async (req, res) => {
  const { questionId, content } = req.body;

  // Check if question exists
  const question = await Question.findById(questionId);
  if (!question) {
    return res.status(404).json({
      success: false,
      message: 'Question not found'
    });
  }

  // Check if user already answered this question
  const existingAnswer = await Answer.findOne({
    question: questionId,
    author: req.user._id
  });

  if (existingAnswer) {
    return res.status(400).json({
      success: false,
      message: 'You have already answered this question'
    });
  }

  const answer = await Answer.create({
    content,
    question: questionId,
    author: req.user._id
  });

  await answer.populate('author', 'username avatar reputation badges');

  // Send notification to question author
  const io = req.app.get('io');
  if (io && !question.author.equals(req.user._id)) {
    let username = req.user.username;
    console.log('[Notification Debug] req.user:', req.user);
    if (!username) {
      const User = require('../models/User');
      const userDoc = await User.findById(req.user._id);
      console.log('[Notification Debug] userDoc:', userDoc);
      username = userDoc && userDoc.username ? userDoc.username : 'Someone';
    }
    console.log('[Notification Debug] Final username:', username);
    const notification = await Notification.createAnswerNotification(
      questionId,
      answer._id,
      req.user._id,
      question.author
    );
    // Update notification with username
    if (notification) {
      notification.username = username;
      await notification.save();
    }
    io.to(`user_${question.author}`).emit('notification', {
      type: 'answer',
      content: `${username} answered your question`,
      questionId,
      answerId: answer._id,
      username: username,
      sender: req.user._id
    });
  }

  res.status(201).json({
    success: true,
    message: 'Answer created successfully',
    data: { answer }
  });
});

// @desc    Update answer
// @route   PUT /api/answers/:id
// @access  Private
const updateAnswer = asyncHandler(async (req, res) => {
  const { content } = req.body;

  const answer = await Answer.findById(req.params.id);
  if (!answer) {
    return res.status(404).json({
      success: false,
      message: 'Answer not found'
    });
  }

  // Check ownership
  if (!answer.author.equals(req.user._id)) {
    return res.status(403).json({
      success: false,
      message: 'You can only edit your own answers'
    });
  }

  // Store edit history
  const editHistory = {
    editedBy: req.user._id,
    editedAt: new Date(),
    previousContent: answer.content
  };

  answer.content = content;
  answer.editHistory.push(editHistory);

  await answer.save();
  await answer.populate('author', 'username avatar reputation badges');
  await answer.populate('editHistory.editedBy', 'username');

  res.json({
    success: true,
    message: 'Answer updated successfully',
    data: { answer }
  });
});

// @desc    Delete answer
// @route   DELETE /api/answers/:id
// @access  Private
const deleteAnswer = asyncHandler(async (req, res) => {
  console.log('[DeleteAnswer] Method:', req.method, 'URL:', req.originalUrl, 'Params:', req.params, 'User:', req.user);
  // The requireOwnership middleware already checks ownership and existence
  // req.item is set to the answer
  const answer = req.item;

  // Use findByIdAndDelete for robustness
  await Answer.findByIdAndDelete(answer._id);

  res.json({
    success: true,
    message: 'Answer deleted successfully'
  });
});

// @desc    Vote on answer
// @route   POST /api/answers/:id/vote
// @access  Private
const voteAnswer = asyncHandler(async (req, res) => {
  const { voteType } = req.body; // 'upvote', 'downvote', or 'remove'

  const answer = await Answer.findById(req.params.id);
  if (!answer) {
    return res.status(404).json({
      success: false,
      message: 'Answer not found'
    });
  }

  if (voteType === 'remove') {
    await answer.removeVote(req.user._id);
  } else {
    await answer.addVote(req.user._id, voteType);
  }

  // Send notification for vote
  const io = req.app.get('io');
  if (io && !answer.author.equals(req.user._id)) {
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
      answer._id,
      'answer',
      req.user._id,
      answer.author,
      voteType
    );
    // Update notification with username
    if (notification) {
      notification.username = username;
      await notification.save();
    }
    io.to(`user_${answer.author}`).emit('notification', {
      type: 'vote',
      content: `${username} ${voteType}d your answer`,
      answerId: answer._id,
      username: username,
      sender: req.user._id
    });
  }

  res.json({
    success: true,
    message: 'Vote updated successfully',
    data: {
      voteCount: answer.voteCount,
      userVote: voteType === 'remove' ? null : voteType
    }
  });
});

// @desc    Accept answer
// @route   PUT /api/answers/:id/accept
// @access  Private
const acceptAnswer = asyncHandler(async (req, res) => {
  console.log('[AcceptAnswer] Method:', req.method, 'URL:', req.originalUrl, 'Params:', req.params, 'User:', req.user);
  const answer = await Answer.findById(req.params.id);
  if (!answer) {
    return res.status(404).json({
      success: false,
      message: 'Answer not found'
    });
  }

  // Get question to check ownership
  const question = await Question.findById(answer.question);
  if (!question) {
    return res.status(404).json({
      success: false,
      message: 'Question not found'
    });
  }

  // Only question author can accept answers
  if (!question.author.equals(req.user._id)) {
    return res.status(403).json({
      success: false,
      message: 'Only the question author can accept answers'
    });
  }

  // Toggle acceptance
  if (answer.isAccepted) {
    await answer.unaccept();
  } else {
    await answer.accept();
  }

  // Send notification for acceptance
  const io = req.app.get('io');
  if (io && answer.isAccepted) {
    const notification = await Notification.createAcceptNotification(
      question._id,
      answer._id,
      req.user._id,
      answer.author
    );

    // Send real-time notification
    io.to(`user_${answer.author}`).emit('notification', {
      type: 'accept',
      content: 'Your answer was accepted as the best answer',
      questionId: question._id,
      answerId: answer._id
    });
  }

  res.json({
    success: true,
    message: answer.isAccepted ? 'Answer accepted' : 'Answer unaccepted',
    data: {
      isAccepted: answer.isAccepted
    }
  });
});

// @desc    Add comment to answer
// @route   POST /api/answers/:id/comments
// @access  Private
const addComment = asyncHandler(async (req, res) => {
  const { content } = req.body;

  const answer = await Answer.findById(req.params.id);
  if (!answer) {
    return res.status(404).json({
      success: false,
      message: 'Answer not found'
    });
  }

  await answer.addComment(content, req.user._id);
  await answer.populate('comments.author', 'username avatar');

  const newComment = answer.comments[answer.comments.length - 1];

  res.status(201).json({
    success: true,
    message: 'Comment added successfully',
    data: { comment: newComment }
  });
});

// @desc    Update comment
// @route   PUT /api/answers/:answerId/comments/:commentId
// @access  Private
const updateComment = asyncHandler(async (req, res) => {
  const { content } = req.body;

  const answer = await Answer.findById(req.params.answerId);
  if (!answer) {
    return res.status(404).json({
      success: false,
      message: 'Answer not found'
    });
  }

  await answer.updateComment(req.params.commentId, content, req.user._id);
  await answer.populate('comments.author', 'username avatar');

  const updatedComment = answer.comments.id(req.params.commentId);

  res.json({
    success: true,
    message: 'Comment updated successfully',
    data: { comment: updatedComment }
  });
});

// @desc    Delete comment
// @route   DELETE /api/answers/:answerId/comments/:commentId
// @access  Private
const deleteComment = asyncHandler(async (req, res) => {
  const answer = await Answer.findById(req.params.answerId);
  if (!answer) {
    return res.status(404).json({
      success: false,
      message: 'Answer not found'
    });
  }

  await answer.removeComment(req.params.commentId, req.user._id);

  res.json({
    success: true,
    message: 'Comment deleted successfully'
  });
});

// @desc    Get user's answers
// @route   GET /api/answers/user/:userId
// @access  Public
const getUserAnswers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const skip = (page - 1) * limit;

  const answers = await Answer.find({ author: req.params.userId })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit))
    .populate('author', 'username avatar reputation badges')
    .populate('question', 'title tags')
    .lean();

  const total = await Answer.countDocuments({ author: req.params.userId });

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

// Routes
router.get('/question/:questionId', getAnswersByQuestion);
router.get('/user/:userId', getUserAnswers);
router.get('/:id', getAnswer);

router.post('/', authenticateToken, rateLimit(5, 60000), createAnswer);
router.put('/:id', authenticateToken, requireOwnership('Answer'), updateAnswer);
router.delete('/:id', authenticateToken, requireOwnership('Answer'), deleteAnswer);
router.post('/:id/vote', authenticateToken, rateLimit(10, 60000), voteAnswer);
router.put('/:id/accept', authenticateToken, acceptAnswer);

router.post('/:id/comments', authenticateToken, asyncHandler(async (req, res) => {
  const { content } = req.body;
  const answer = await Answer.findById(req.params.id);
  if (!answer) {
    return res.status(404).json({ success: false, message: 'Answer not found' });
  }
  await answer.populate('question'); // Ensure answer.question is populated
  // Parse @username mentions
  const mentionUsernames = [...content.matchAll(/@([a-zA-Z0-9_]+)/g)].map(m => m[1]);
  let mentionedUsers = [];
  if (mentionUsernames.length > 0) {
    mentionedUsers = await require('../models/User').find({ username: { $in: mentionUsernames } });
  }
  const comment = {
    content,
    author: req.user._id,
    mentions: mentionedUsers.map(u => u._id)
  };
  answer.comments.push(comment);
  await answer.save();
  const savedComment = answer.comments[answer.comments.length - 1]; // Get the actual saved comment (with _id)
  // Notify mentioned users
  const io = req.app.get('io');
  for (const user of mentionedUsers) {
    if (!user._id.equals(req.user._id)) {
      const notification = await require('../models/Notification').create({
        recipient: user._id,
        type: 'mention',
        content: `${req.user.username} mentioned you in a comment`,
        answer: answer._id,
        comment: savedComment._id,
        questionId: answer.question._id,
        sender: req.user._id
      });
      if (io) {
        io.to(`user_${user._id}`).emit('notification', {
          type: 'mention',
          content: `${req.user.username} mentioned you in a comment`,
          answerId: answer._id,
          commentId: savedComment._id,
          questionId: answer.question._id,
          sender: req.user._id
        });
      }
    }
  }
  // Notify answer author if commenter is not the author
  if (!answer.author.equals(req.user._id)) {
    const notification = await require('../models/Notification').create({
      recipient: answer.author,
      type: 'comment',
      content: `${req.user.username} commented on your answer`,
      answer: answer._id,
      comment: savedComment._id,
      questionId: answer.question._id,
      sender: req.user._id
    });
    if (io) {
      io.to(`user_${answer.author}`).emit('notification', {
        type: 'comment',
        content: `${req.user.username} commented on your answer`,
        answerId: answer._id,
        commentId: savedComment._id,
        questionId: answer.question._id,
        sender: req.user._id
      });
    }
  }
  res.status(201).json({ success: true, comment: savedComment });
}));
router.put('/:answerId/comments/:commentId', authenticateToken, updateComment);
router.delete('/:answerId/comments/:commentId', authenticateToken, deleteComment);

// Add GET /api/answers/:id/comments
router.get('/:id/comments', asyncHandler(async (req, res) => {
  const answer = await Answer.findById(req.params.id)
    .populate('comments.author', 'username avatar')
    .populate('comments.mentions', 'username avatar');
  if (!answer) {
    return res.status(404).json({ success: false, message: 'Answer not found' });
  }
  res.json({ success: true, comments: answer.comments });
}));

module.exports = router; 