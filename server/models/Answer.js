const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  content: { type: String, required: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now },
  mentions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
});

const answerSchema = new mongoose.Schema({
  content: {
    type: String,
    required: [true, 'Answer content is required'],
    minlength: [10, 'Answer must be at least 10 characters long']
  },
  question: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question',
    required: [true, 'Question reference is required']
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Author is required']
  },
  votes: {
    upvotes: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    downvotes: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }]
  },
  isAccepted: {
    type: Boolean,
    default: false
  },
  isEdited: {
    type: Boolean,
    default: false
  },
  editHistory: [{
    editedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    editedAt: {
      type: Date,
      default: Date.now
    },
    previousContent: String
  }],
  comments: [commentSchema],
  codeBlocks: [{
    language: String,
    code: String,
    filename: String
  }],
  attachments: [{
    filename: String,
    url: String,
    size: Number,
    type: String
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for vote count
answerSchema.virtual('voteCount').get(function() {
  return this.votes.upvotes.length - this.votes.downvotes.length;
});

// Virtual for comment count
answerSchema.virtual('commentCount').get(function() {
  return this.comments.length;
});

// Indexes for better performance
answerSchema.index({ question: 1 });
answerSchema.index({ author: 1 });
answerSchema.index({ createdAt: -1 });
answerSchema.index({ isAccepted: 1 });
answerSchema.index({ 'votes.upvotes': 1 });
answerSchema.index({ 'votes.downvotes': 1 });

// Pre-save middleware to update isEdited
answerSchema.pre('save', function(next) {
  if (this.isModified('content')) {
    this.isEdited = true;
  }
  next();
});

// Pre-save middleware to update question's acceptedAnswer
answerSchema.pre('save', async function(next) {
  if (this.isModified('isAccepted') && this.isAccepted) {
    const Question = mongoose.model('Question');
    await Question.findByIdAndUpdate(this.question, {
      acceptedAnswer: this._id,
      isSolved: true
    });
  }
  next();
});

// Instance method to add vote
answerSchema.methods.addVote = function(userId, voteType) {
  if (voteType === 'upvote') {
    // Remove from downvotes if exists
    this.votes.downvotes = this.votes.downvotes.filter(id => !id.equals(userId));
    // Add to upvotes if not already there
    if (!this.votes.upvotes.some(id => id.equals(userId))) {
      this.votes.upvotes.push(userId);
    }
  } else if (voteType === 'downvote') {
    // Remove from upvotes if exists
    this.votes.upvotes = this.votes.upvotes.filter(id => !id.equals(userId));
    // Add to downvotes if not already there
    if (!this.votes.downvotes.some(id => id.equals(userId))) {
      this.votes.downvotes.push(userId);
    }
  }
  return this.save();
};

// Instance method to remove vote
answerSchema.methods.removeVote = function(userId) {
  this.votes.upvotes = this.votes.upvotes.filter(id => !id.equals(userId));
  this.votes.downvotes = this.votes.downvotes.filter(id => !id.equals(userId));
  return this.save();
};

// Instance method to accept answer
answerSchema.methods.accept = async function() {
  const Question = mongoose.model('Question');
  
  // Unaccept all other answers for this question
  await this.constructor.updateMany(
    { question: this.question, _id: { $ne: this._id } },
    { isAccepted: false }
  );
  
  // Accept this answer
  this.isAccepted = true;
  await this.save();
  
  // Update question
  await Question.findByIdAndUpdate(this.question, {
    acceptedAnswer: this._id,
    isSolved: true
  });
  
  return this;
};

// Instance method to unaccept answer
answerSchema.methods.unaccept = async function() {
  const Question = mongoose.model('Question');
  
  this.isAccepted = false;
  await this.save();
  
  // Update question
  await Question.findByIdAndUpdate(this.question, {
    acceptedAnswer: null,
    isSolved: false
  });
  
  return this;
};

// Instance method to add comment
answerSchema.methods.addComment = function(content, authorId) {
  this.comments.push({
    content,
    author: authorId,
    createdAt: new Date(),
    updatedAt: new Date()
  });
  return this.save();
};

// Instance method to update comment
answerSchema.methods.updateComment = function(commentId, content, userId) {
  const comment = this.comments.id(commentId);
  if (comment && comment.author.equals(userId)) {
    comment.content = content;
    comment.updatedAt = new Date();
    return this.save();
  }
  throw new Error('Comment not found or unauthorized');
};

// Instance method to remove comment
answerSchema.methods.removeComment = function(commentId, userId) {
  const comment = this.comments.id(commentId);
  if (comment && (comment.author.equals(userId) || this.author.equals(userId))) {
    comment.remove();
    return this.save();
  }
  throw new Error('Comment not found or unauthorized');
};

// Static method to get answers by question with pagination
answerSchema.statics.getByQuestion = function(questionId, page = 1, limit = 10, sortBy = 'votes') {
  const skip = (page - 1) * limit;
  
  let sortQuery = {};
  switch (sortBy) {
    case 'votes':
      sortQuery = { 'votes.upvotes': -1, createdAt: -1 };
      break;
    case 'newest':
      sortQuery = { createdAt: -1 };
      break;
    case 'oldest':
      sortQuery = { createdAt: 1 };
      break;
    default:
      sortQuery = { 'votes.upvotes': -1, createdAt: -1 };
  }
  
  return this.find({ question: questionId })
    .sort(sortQuery)
    .skip(skip)
    .limit(limit)
    .populate('author', 'username avatar reputation badges')
    .populate('comments.author', 'username avatar');
};

// Static method to get accepted answers by user
answerSchema.statics.getAcceptedByUser = function(userId, limit = 10) {
  return this.find({ author: userId, isAccepted: true })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('question', 'title tags')
    .populate('author', 'username avatar');
};

module.exports = mongoose.model('Answer', answerSchema); 