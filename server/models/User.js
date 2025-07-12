const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters long'],
    maxlength: [30, 'Username cannot exceed 30 characters'],
    match: [/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters long']
  },
  firebaseUid: {
    type: String,
    required: false
  },
  avatar: {
    type: String,
    default: null
  },
  bio: {
    type: String,
    maxlength: [500, 'Bio cannot exceed 500 characters'],
    default: ''
  },
  reputation: {
    type: Number,
    default: 0
  },
  badges: [{
    type: String,
    enum: ['newbie', 'regular', 'expert', 'moderator', 'admin']
  }],
  isVerified: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastSeen: {
    type: Date,
    default: Date.now
  },
  preferences: {
    emailNotifications: {
      type: Boolean,
      default: true
    },
    pushNotifications: {
      type: Boolean,
      default: true
    },
    theme: {
      type: String,
      enum: ['light', 'dark', 'auto'],
      default: 'auto'
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for question count
userSchema.virtual('questionCount', {
  ref: 'Question',
  localField: '_id',
  foreignField: 'author',
  count: true
});

// Virtual for answer count
userSchema.virtual('answerCount', {
  ref: 'Answer',
  localField: '_id',
  foreignField: 'author',
  count: true
});

// Virtual for accepted answers count
userSchema.virtual('acceptedAnswerCount', {
  ref: 'Answer',
  localField: '_id',
  foreignField: 'author',
  count: true,
  match: { isAccepted: true }
});

// Indexes for better performance
userSchema.index({ username: 1 });
userSchema.index({ email: 1 });
userSchema.index({ firebaseUid: 1 });
userSchema.index({ reputation: -1 });
userSchema.index({ createdAt: -1 });

// Pre-save middleware to hash password and update lastSeen
userSchema.pre('save', async function(next) {
  // Hash password if it's modified
  if (this.isModified('password')) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
  
  // Update lastSeen if any field is modified
  if (this.isModified()) {
    this.lastSeen = new Date();
  }
  next();
});

// Instance method to update reputation
userSchema.methods.updateReputation = function(points) {
  this.reputation += points;
  return this.save();
};

// Instance method to add badge
userSchema.methods.addBadge = function(badge) {
  if (!this.badges.includes(badge)) {
    this.badges.push(badge);
    return this.save();
  }
  return Promise.resolve(this);
};

// Static method to find by Firebase UID
userSchema.statics.findByFirebaseUid = function(firebaseUid) {
  return this.findOne({ firebaseUid });
};

// Static method to get top users by reputation
userSchema.statics.getTopUsers = function(limit = 10) {
  return this.find({ isActive: true })
    .sort({ reputation: -1 })
    .limit(limit)
    .select('username avatar reputation badges');
};

// Instance method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema); 