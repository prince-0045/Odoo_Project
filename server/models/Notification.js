const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  type: {
    type: String,
    required: [true, 'Notification type is required'],
    enum: ['answer', 'comment', 'vote', 'accept', 'mention', 'bounty', 'system']
  },
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Recipient is required']
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Sender is required']
  },
  question: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question'
  },
  answer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Answer'
  },
  comment: {
    type: mongoose.Schema.Types.ObjectId
  },
  content: {
    type: String,
    required: [true, 'Notification content is required'],
    maxlength: [500, 'Content cannot exceed 500 characters']
  },
  isRead: {
    type: Boolean,
    default: false
  },
  isEmailSent: {
    type: Boolean,
    default: false
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  expiresAt: {
    type: Date,
    default: function() {
      // Notifications expire after 30 days
      return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    }
  },
  username: { type: String } // Add this line to store sender's username
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
notificationSchema.index({ recipient: 1, isRead: 1 });
notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ type: 1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// TTL index to automatically delete expired notifications
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Pre-save middleware to generate content based on type
notificationSchema.pre('save', function(next) {
  if (!this.content && this.type) {
    switch (this.type) {
      case 'answer':
        this.content = 'Someone answered your question';
        break;
      case 'comment':
        this.content = 'Someone commented on your question/answer';
        break;
      case 'vote':
        this.content = 'Someone voted on your question/answer';
        break;
      case 'accept':
        this.content = 'Your answer was accepted as the best answer';
        break;
      case 'mention':
        this.content = 'Someone mentioned you in a comment';
        break;
      case 'bounty':
        this.content = 'A bounty was added to your question';
        break;
      case 'system':
        this.content = 'System notification';
        break;
    }
  }
  next();
});

// Instance method to mark as read
notificationSchema.methods.markAsRead = function() {
  this.isRead = true;
  return this.save();
};

// Instance method to mark as unread
notificationSchema.methods.markAsUnread = function() {
  this.isRead = false;
  return this.save();
};

// Static method to create notification
notificationSchema.statics.createNotification = function(data) {
  const notification = new this({
    type: data.type,
    recipient: data.recipient,
    sender: data.sender,
    question: data.question,
    answer: data.answer,
    comment: data.comment,
    content: data.content,
    metadata: data.metadata || {}
  });
  
  return notification.save();
};

// Static method to get unread notifications count
notificationSchema.statics.getUnreadCount = function(userId) {
  return this.countDocuments({
    recipient: userId,
    isRead: false
  });
};

// Static method to get notifications for user with pagination
notificationSchema.statics.getForUser = function(userId, page = 1, limit = 20) {
  const skip = (page - 1) * limit;
  
  return this.find({ recipient: userId })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('sender', 'username avatar')
    .populate('question', 'title')
    .populate('answer', 'content')
    .lean();
};

// Static method to mark all notifications as read
notificationSchema.statics.markAllAsRead = function(userId) {
  return this.updateMany(
    { recipient: userId, isRead: false },
    { isRead: true }
  );
};

// Static method to delete old notifications
notificationSchema.statics.cleanupOld = function(days = 30) {
  const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  return this.deleteMany({
    createdAt: { $lt: cutoffDate },
    isRead: true
  });
};

// Static method to get notification statistics
notificationSchema.statics.getStats = function(userId) {
  return this.aggregate([
    { $match: { recipient: mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: '$type',
        count: { $sum: 1 },
        unreadCount: {
          $sum: { $cond: ['$isRead', 0, 1] }
        }
      }
    }
  ]);
};

// Static method to create answer notification
notificationSchema.statics.createAnswerNotification = function(questionId, answerId, answerAuthorId, questionAuthorId) {
  if (answerAuthorId.equals(questionAuthorId)) {
    return Promise.resolve(); // Don't notify if answering own question
  }
  
  return this.createNotification({
    type: 'answer',
    recipient: questionAuthorId,
    sender: answerAuthorId,
    question: questionId,
    answer: answerId,
    content: 'Someone answered your question'
  });
};

// Static method to create vote notification
notificationSchema.statics.createVoteNotification = function(itemId, itemType, voterId, itemAuthorId, voteType) {
  if (voterId.equals(itemAuthorId)) {
    return Promise.resolve(); // Don't notify if voting on own content
  }
  
  return this.createNotification({
    type: 'vote',
    recipient: itemAuthorId,
    sender: voterId,
    [itemType]: itemId,
    content: `Someone ${voteType}d your ${itemType}`,
    metadata: { voteType, itemType }
  });
};

// Static method to create accept notification
notificationSchema.statics.createAcceptNotification = function(questionId, answerId, questionAuthorId, answerAuthorId) {
  return this.createNotification({
    type: 'accept',
    recipient: answerAuthorId,
    sender: questionAuthorId,
    question: questionId,
    answer: answerId,
    content: 'Your answer was accepted as the best answer'
  });
};

// Static method to create mention notification
notificationSchema.statics.createMentionNotification = function(questionId, commentId, commentAuthorId, mentionedUserId) {
  if (commentAuthorId.equals(mentionedUserId)) {
    return Promise.resolve(); // Don't notify if mentioning self
  }
  
  return this.createNotification({
    type: 'mention',
    recipient: mentionedUserId,
    sender: commentAuthorId,
    question: questionId,
    comment: commentId,
    content: 'Someone mentioned you in a comment'
  });
};

module.exports = mongoose.model('Notification', notificationSchema); 