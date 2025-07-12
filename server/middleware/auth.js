const jwt = require('jsonwebtoken');
const User = require('../models/User');

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

// Middleware to verify JWT token
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ message: 'Access token required' });
    }

    // Try Firebase token verification if available
    if (admin) {
      try {
        const decodedToken = await admin.auth().verifyIdToken(token);
        const firebaseUid = decodedToken.uid;
        const user = await User.findByFirebaseUid(firebaseUid);
        
        if (user && user.isActive) {
          req.user = user;
          return next();
        }
      } catch (firebaseError) {
        console.log('Firebase token verification failed:', firebaseError.message);
      }
    }

    // For development, try JWT token
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret');
      const user = await User.findById(decoded.userId);
      
      if (user && user.isActive) {
        req.user = user;
        return next();
      }
    } catch (jwtError) {
      console.log('JWT token verification failed:', jwtError.message);
    }

    return res.status(401).json({ message: 'Invalid token' });
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(401).json({ message: 'Invalid token' });
  }
};

// Socket.IO authentication middleware
const authenticateSocket = async (socket, next) => {
  try {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }

    // Try Firebase token verification if available
    if (admin) {
      try {
        const decodedToken = await admin.auth().verifyIdToken(token);
        const firebaseUid = decodedToken.uid;
        const user = await User.findByFirebaseUid(firebaseUid);
        
        if (user && user.isActive) {
          socket.userId = user._id.toString();
          socket.user = user;
          return next();
        }
      } catch (firebaseError) {
        console.log('Firebase token verification failed:', firebaseError.message);
      }
    }

    // For development, try JWT token
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret');
      const user = await User.findById(decoded.userId);
      
      if (user && user.isActive) {
        socket.userId = user._id.toString();
        socket.user = user;
        return next();
      }
    } catch (jwtError) {
      console.log('JWT token verification failed:', jwtError.message);
    }

    next(new Error('Authentication error: Invalid token'));
  } catch (error) {
    console.error('Socket auth error:', error);
    next(new Error('Authentication error: Invalid token'));
  }
};

// Optional authentication middleware (doesn't fail if no token)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      req.user = null;
      return next();
    }

    // Verify Firebase token
    const decodedToken = await admin.auth().verifyIdToken(token);
    const firebaseUid = decodedToken.uid;

    // Find user in database
    const user = await User.findByFirebaseUid(firebaseUid);
    if (user && user.isActive) {
      req.user = user;
    } else {
      req.user = null;
    }

    next();
  } catch (error) {
    console.error('Optional auth middleware error:', error);
    req.user = null;
    next();
  }
};

// Role-based authorization middleware
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const userRoles = req.user.badges || [];
    const hasRequiredRole = roles.some(role => userRoles.includes(role));

    if (!hasRequiredRole) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    next();
  };
};

// Ownership verification middleware
const requireOwnership = (model, field = 'author') => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        console.log('[Ownership] No user in request');
        return res.status(401).json({ message: 'Authentication required' });
      }

      const itemId = req.params.id;
      const Model = require(`../models/${model}`);
      const item = await Model.findById(itemId);
      console.log(`[Ownership] Model: ${model}, ItemId: ${itemId}, UserId: ${req.user._id}`);
      if (!item) {
        console.log('[Ownership] Item not found');
        return res.status(404).json({ message: `${model} not found` });
      }

      // Add detailed debug logs for both IDs and their types
      console.log(`[Ownership] Comparing item[${field}]:`, item[field], '(', typeof item[field], ')', 'with req.user._id:', req.user._id, '(', typeof req.user._id, ')');

      let isOwner = false;
      try {
        isOwner = item[field].equals(req.user._id);
        console.log(`[Ownership] .equals() result:`, isOwner);
      } catch (e) {
        console.log('[Ownership] .equals() threw error:', e);
      }
      if (!isOwner) {
        // Fallback: compare as strings
        isOwner = String(item[field]) === String(req.user._id);
        console.log(`[Ownership] String compare result:`, isOwner);
      }
      if (!isOwner) {
        console.log(`[Ownership] User ${req.user._id} is not the owner of ${model} ${itemId}`);
        return res.status(403).json({ message: 'You can only modify your own content' });
      }

      req.item = item;
      next();
    } catch (error) {
      console.error('Ownership verification error:', error);
      return res.status(500).json({ message: 'Server error' });
    }
  };
};

// Rate limiting for specific actions
const rateLimit = (maxRequests, windowMs) => {
  const requests = new Map();
  
  return (req, res, next) => {
    const key = req.user ? req.user._id.toString() : req.ip;
    const now = Date.now();
    const windowStart = now - windowMs;
    
    if (!requests.has(key)) {
      requests.set(key, []);
    }
    
    const userRequests = requests.get(key);
    const recentRequests = userRequests.filter(time => time > windowStart);
    
    if (recentRequests.length >= maxRequests) {
      return res.status(429).json({ 
        message: `Too many requests. Please try again in ${Math.ceil(windowMs / 1000)} seconds.` 
      });
    }
    
    recentRequests.push(now);
    requests.set(key, recentRequests);
    
    next();
  };
};

module.exports = {
  authenticateToken,
  authenticateSocket,
  optionalAuth,
  requireRole,
  requireOwnership,
  rateLimit
}; 