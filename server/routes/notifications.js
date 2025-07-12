const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const { authenticateToken } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

// @desc    Get user notifications
// @route   GET /api/notifications
// @access  Private
const getNotifications = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, unreadOnly = false } = req.query;
  const skip = (page - 1) * limit;

  const query = { recipient: req.user._id };
  if (unreadOnly === 'true') {
    query.isRead = false;
  }

  const notifications = await Notification.getForUser(req.user._id, parseInt(page), parseInt(limit));
  const total = await Notification.countDocuments(query);
  const unreadCount = await Notification.getUnreadCount(req.user._id);

  res.json({
    success: true,
    data: {
      notifications,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      },
      unreadCount
    }
  });
});

// @desc    Get notification by ID
// @route   GET /api/notifications/:id
// @access  Private
const getNotification = asyncHandler(async (req, res) => {
  const notification = await Notification.findById(req.params.id)
    .populate('sender', 'username avatar')
    .populate('question', 'title')
    .populate('answer', 'content');

  if (!notification) {
    return res.status(404).json({
      success: false,
      message: 'Notification not found'
    });
  }

  // Check ownership
  if (!notification.recipient.equals(req.user._id)) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to view this notification'
    });
  }

  res.json({
    success: true,
    data: { notification }
  });
});

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
const markAsRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findById(req.params.id);

  if (!notification) {
    return res.status(404).json({
      success: false,
      message: 'Notification not found'
    });
  }

  // Check ownership
  if (!notification.recipient.equals(req.user._id)) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to modify this notification'
    });
  }

  await notification.markAsRead();

  res.json({
    success: true,
    message: 'Notification marked as read'
  });
});

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/read-all
// @access  Private
const markAllAsRead = asyncHandler(async (req, res) => {
  await Notification.markAllAsRead(req.user._id);

  res.json({
    success: true,
    message: 'All notifications marked as read'
  });
});

// @desc    Delete notification
// @route   DELETE /api/notifications/:id
// @access  Private
const deleteNotification = asyncHandler(async (req, res) => {
  const notification = await Notification.findById(req.params.id);

  if (!notification) {
    return res.status(404).json({
      success: false,
      message: 'Notification not found'
    });
  }

  // Check ownership
  if (!notification.recipient.equals(req.user._id)) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to delete this notification'
    });
  }

  await notification.remove();

  res.json({
    success: true,
    message: 'Notification deleted successfully'
  });
});

// @desc    Get notification statistics
// @route   GET /api/notifications/stats
// @access  Private
const getNotificationStats = asyncHandler(async (req, res) => {
  const stats = await Notification.getStats(req.user._id);
  const unreadCount = await Notification.getUnreadCount(req.user._id);

  res.json({
    success: true,
    data: {
      stats,
      unreadCount
    }
  });
});

// @desc    Get unread notifications count
// @route   GET /api/notifications/unread-count
// @access  Private
const getUnreadCount = asyncHandler(async (req, res) => {
  const unreadCount = await Notification.getUnreadCount(req.user._id);

  res.json({
    success: true,
    data: { unreadCount }
  });
});

// @desc    Clear all notifications for the current user
// @route   DELETE /api/notifications/clear
// @access  Private
const clearAllNotifications = asyncHandler(async (req, res) => {
  console.log('[ClearAllNotifications] Called for user:', req.user._id);
  await Notification.deleteMany({ recipient: req.user._id });
  res.json({ success: true, message: 'All notifications cleared' });
});

// Routes
router.get('/', authenticateToken, getNotifications);
router.get('/stats', authenticateToken, getNotificationStats);
router.get('/unread-count', authenticateToken, getUnreadCount);
router.get('/:id', authenticateToken, getNotification);

router.put('/:id/read', authenticateToken, markAsRead);
router.put('/read-all', authenticateToken, markAllAsRead);
router.delete('/clear', authenticateToken, clearAllNotifications);
router.delete('/:id', authenticateToken, deleteNotification);

module.exports = router; 