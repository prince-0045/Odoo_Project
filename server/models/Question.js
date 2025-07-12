const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Question title is required'],
    trim: true,
    minlength: [10, 'Title must be at least 10 characters long'],
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Question description is required'],
    minlength: [20, 'Description must be at least 20 characters long']
  },
  tags: {
    type: [String],
    required: [true, 'At least one tag is required'],
    validate: {
      validator: function(v) {
        return v && v.length > 0;
      },
      message: 'At least one tag is required'
    }
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
  views: {
    type: Number,
    default: 0
  },
  isSolved: {
    type: Boolean,
    default: false
  },
  acceptedAnswer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Answer',
    default: null
  },
  bounty: {
    amount: {
      type: Number,
      default: 0
    },
    expiresAt: {
      type: Date,
      default: null
    }
  },
  status: {
    type: String,
    enum: ['open', 'closed', 'duplicate', 'off-topic'],
    default: 'open'
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
    previousTitle: String,
    previousDescription: String,
    previousTags: [String]
  }],
  bookmarks: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for vote count
questionSchema.virtual('voteCount').get(function() {
  return this.votes.upvotes.length - this.votes.downvotes.length;
});

// Virtual for answer count
questionSchema.virtual('answerCount', {
  ref: 'Answer',
  localField: '_id',
  foreignField: 'question',
  count: true
});

// Virtual for comment count
questionSchema.virtual('commentCount', {
  ref: 'Comment',
  localField: '_id',
  foreignField: 'question',
  count: true
});

// Virtual for isBookmarked (to be used with populate)
questionSchema.virtual('isBookmarked').get(function() {
  return this.bookmarks && this.bookmarks.length > 0;
});

// Indexes for better performance
questionSchema.index({ title: 'text', description: 'text' });
questionSchema.index({ tags: 1 });
questionSchema.index({ author: 1 });
questionSchema.index({ createdAt: -1 });
questionSchema.index({ 'votes.upvotes': 1 });
questionSchema.index({ 'votes.downvotes': 1 });
questionSchema.index({ status: 1 });
questionSchema.index({ isSolved: 1 });

// Pre-save middleware to update isEdited and clean tags
questionSchema.pre('save', function(next) {
  if (this.isModified('title') || this.isModified('description') || this.isModified('tags')) {
    this.isEdited = true;
  }
  
  // Clean and validate tags
  if (this.tags && Array.isArray(this.tags)) {
    this.tags = this.tags
      .map(tag => tag.trim().toLowerCase())
      .filter(tag => tag.length > 0 && tag.length <= 20);
  }
  
  next();
});

// Instance method to add vote
questionSchema.methods.addVote = function(userId, voteType) {
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
questionSchema.methods.removeVote = function(userId) {
  this.votes.upvotes = this.votes.upvotes.filter(id => !id.equals(userId));
  this.votes.downvotes = this.votes.downvotes.filter(id => !id.equals(userId));
  return this.save();
};

// Instance method to increment views
questionSchema.methods.incrementViews = function() {
  this.views += 1;
  return this.save();
};

// Instance method to add bookmark
questionSchema.methods.addBookmark = function(userId) {
  if (!this.bookmarks.some(id => id.equals(userId))) {
    this.bookmarks.push(userId);
  }
  return this.save();
};

// Instance method to remove bookmark
questionSchema.methods.removeBookmark = function(userId) {
  this.bookmarks = this.bookmarks.filter(id => !id.equals(userId));
  return this.save();
};

// Static method to get trending questions
questionSchema.statics.getTrending = function(limit = 10) {
  return this.aggregate([
    {
      $addFields: {
        score: {
          $add: [
            { $multiply: [{ $size: '$votes.upvotes' }, 10] },
            { $multiply: [{ $size: '$votes.downvotes' }, -2] },
            { $multiply: ['$views', 0.1] },
            { $multiply: [{ $size: { $ifNull: ['$answers', []] } }, 5] }
          ]
        }
      }
    },
    { $sort: { score: -1, createdAt: -1 } },
    { $limit: limit },
    {
      $lookup: {
        from: 'users',
        localField: 'author',
        foreignField: '_id',
        as: 'author'
      }
    },
    { $unwind: '$author' },
    {
      $project: {
        title: 1,
        description: 1,
        tags: 1,
        voteCount: 1,
        views: 1,
        answerCount: 1,
        createdAt: 1,
        'author.username': 1,
        'author.avatar': 1
      }
    }
  ]);
};

// Static method to search questions
questionSchema.statics.search = function(query, filters = {}) {
  const searchQuery = {
    $text: { $search: query }
  };

  if (filters.tags && filters.tags.length > 0) {
    searchQuery.tags = { $in: filters.tags };
  }

  if (filters.status) {
    searchQuery.status = filters.status;
  }

  if (filters.isSolved !== undefined) {
    searchQuery.isSolved = filters.isSolved;
  }

  return this.find(searchQuery)
    .sort({ score: { $meta: 'textScore' }, createdAt: -1 })
    .populate('author', 'username avatar')
    .populate('acceptedAnswer');
};

module.exports = mongoose.model('Question', questionSchema); 