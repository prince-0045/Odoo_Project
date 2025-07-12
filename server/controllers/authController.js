const User = require('../models/User');
const { asyncHandler } = require('../middleware/errorHandler');

// Firebase Admin - only initialize if credentials are available
let admin = null;
try {
  admin = require('firebase-admin');
  
  if (!admin.apps.length) {
    if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        }),
      });
    } else {
      console.log('Firebase credentials not found. Running in development mode without Firebase.');
    }
  }
} catch (error) {
  console.log('Firebase Admin not available. Running in development mode without Firebase.');
}

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
const register = asyncHandler(async (req, res) => {
  const {username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Please provide username, email, and password'
    });
  }

  try {
    // Check if user already exists by email
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered'
      });
    }

    // Check if username is taken
    const usernameExists = await User.findOne({ username });
    if (usernameExists) {
      return res.status(400).json({
        success: false,
        message: 'Username already taken'
      });
    }

    // Create user with password
    const user = await User.create({
      username,
      email,
      password,
      badges: ['newbie']
    });

    // Populate user data
    await user.populate('questionCount answerCount acceptedAnswerCount');

    // Generate JWT token
    const jwt = require('jsonwebtoken');
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'dev-secret',
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token: token,
      data: {
        user: {
          _id: user._id,
          username: user.username,
          email: user.email,
          avatar: user.avatar,
          bio: user.bio,
          reputation: user.reputation,
          badges: user.badges,
          isVerified: user.isVerified,
          questionCount: user.questionCount,
          answerCount: user.answerCount,
          acceptedAnswerCount: user.acceptedAnswerCount,
          preferences: user.preferences,
          createdAt: user.createdAt
        }
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed'
    });
  }
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Please provide email and password'
    });
  }

  try {
    // Find user by email
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found. Please register first.'
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated'
      });
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid password'
      });
    }

    // Update last seen
    user.lastSeen = new Date();
    await user.save();

    // Populate user data
    await user.populate('questionCount answerCount acceptedAnswerCount');

    // Generate JWT token
    const jwt = require('jsonwebtoken');
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'dev-secret',
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

    res.json({
      success: true,
      message: 'Login successful',
      token: token,
      data: {
        user: {
          _id: user._id,
          username: user.username,
          email: user.email,
          avatar: user.avatar,
          bio: user.bio,
          reputation: user.reputation,
          badges: user.badges,
          isVerified: user.isVerified,
          questionCount: user.questionCount,
          answerCount: user.answerCount,
          acceptedAnswerCount: user.acceptedAnswerCount,
          preferences: user.preferences,
          lastSeen: user.lastSeen,
          createdAt: user.createdAt
        }
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed'
    });
  }
});

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id)
    .populate('questionCount answerCount acceptedAnswerCount');

  res.json({
    success: true,
    data: {
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        bio: user.bio,
        reputation: user.reputation,
        badges: user.badges,
        isVerified: user.isVerified,
        questionCount: user.questionCount,
        answerCount: user.answerCount,
        acceptedAnswerCount: user.acceptedAnswerCount,
        preferences: user.preferences,
        lastSeen: user.lastSeen,
        createdAt: user.createdAt
      }
    }
  });
});

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = asyncHandler(async (req, res) => {
  const { username, bio, avatar, preferences } = req.body;

  const updateData = {};
  if (username !== undefined) updateData.username = username;
  if (bio !== undefined) updateData.bio = bio;
  if (avatar !== undefined) updateData.avatar = avatar;
  if (preferences !== undefined) updateData.preferences = preferences;

  // Check if username is taken (if being updated)
  if (username && username !== req.user.username) {
    const usernameExists = await User.findOne({ username });
    if (usernameExists) {
      return res.status(400).json({
        success: false,
        message: 'Username already taken'
      });
    }
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    updateData,
    { new: true, runValidators: true }
  ).populate('questionCount answerCount acceptedAnswerCount');

  res.json({
    success: true,
    message: 'Profile updated successfully',
    data: {
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        bio: user.bio,
        reputation: user.reputation,
        badges: user.badges,
        isVerified: user.isVerified,
        questionCount: user.questionCount,
        answerCount: user.answerCount,
        acceptedAnswerCount: user.acceptedAnswerCount,
        preferences: user.preferences,
        lastSeen: user.lastSeen,
        createdAt: user.createdAt
      }
    }
  });
});

// @desc    Delete user account
// @route   DELETE /api/auth/account
// @access  Private
const deleteAccount = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  // Soft delete - mark as inactive
  user.isActive = false;
  await user.save();

  res.json({
    success: true,
    message: 'Account deleted successfully'
  });
});

// @desc    Refresh token
// @route   POST /api/auth/refresh
// @access  Public
const refreshToken = asyncHandler(async (req, res) => {
  const { idToken, email } = req.body;

  if (!idToken && !email) {
    return res.status(400).json({
      success: false,
      message: 'Please provide idToken or email'
    });
  }

  try {
    let firebaseUid = null;
    let user = null;
    // Verify Firebase token if available
    if (admin && idToken) {
      try {
        const decodedToken = await admin.auth().verifyIdToken(idToken, true);
        firebaseUid = decodedToken.uid;
        user = await User.findByFirebaseUid(firebaseUid);
      } catch (firebaseError) {
        console.log('Firebase token verification failed:', firebaseError.message);
      }
    }
    // If no user found via Firebase, try by email
    if (!user && email) {
      user = await User.findOne({ email });
    }
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'User not found or inactive'
      });
    }
    res.json({
      success: true,
      message: 'Token refreshed successfully'
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(401).json({
      success: false,
      message: 'Token refresh failed'
    });
  }
});

module.exports = {
  register,
  login,
  getMe,
  updateProfile,
  deleteAccount,
  refreshToken
}; 