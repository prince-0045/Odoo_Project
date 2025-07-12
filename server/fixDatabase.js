const mongoose = require('mongoose');
require('dotenv').config();

async function fixDatabase() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/stackit';
    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB successfully!');

    // Get the database instance
    const db = mongoose.connection.db;
    
    // Drop the problematic firebaseUid index
    console.log('Dropping firebaseUid index...');
    try {
      await db.collection('users').dropIndex('firebaseUid_1');
      console.log('✅ Successfully dropped firebaseUid index');
    } catch (error) {
      if (error.code === 26) {
        console.log('ℹ️ firebaseUid index does not exist, skipping...');
      } else {
        console.error('❌ Error dropping index:', error.message);
      }
    }

    // Update existing users to remove firebaseUid field if it's null
    console.log('Updating existing users...');
    const result = await db.collection('users').updateMany(
      { firebaseUid: null },
      { $unset: { firebaseUid: "" } }
    );
    console.log(`✅ Updated ${result.modifiedCount} users`);

    // Create a new non-unique index on firebaseUid (if needed)
    console.log('Creating new firebaseUid index...');
    try {
      await db.collection('users').createIndex({ firebaseUid: 1 }, { sparse: true });
      console.log('✅ Created new firebaseUid index (non-unique)');
    } catch (error) {
      console.error('❌ Error creating index:', error.message);
    }

    console.log('🎉 Database fix completed successfully!');
    console.log('You can now register new users without errors.');

  } catch (error) {
    console.error('❌ Database fix failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Update old notifications to include username in content using 'sender' field
const updateNotificationContents = async () => {
  const Notification = require('./models/Notification');
  const User = require('./models/User');

  // Update answer notifications
  const answerNotifications = await Notification.find({
    type: 'answer',
    content: /Someone answered your question/
  });
  for (const notif of answerNotifications) {
    if (notif.sender) {
      const user = await User.findById(notif.sender);
      if (user && user.username) {
        notif.content = `${user.username} answered your question`;
        await notif.save();
      }
    }
  }

  // Update vote notifications for questions
  const voteNotifications = await Notification.find({
    type: 'vote',
    content: /Someone (upvoted|downvoted) your question/
  });
  for (const notif of voteNotifications) {
    if (notif.sender) {
      const user = await User.findById(notif.sender);
      if (user && user.username) {
        // Try to determine vote type from content
        let voteType = 'upvoted';
        if (notif.content.includes('downvoted')) voteType = 'downvoted';
        notif.content = `${user.username} ${voteType} your question`;
        await notif.save();
      }
    }
  }

  // Update vote notifications for answers
  const voteAnswerNotifications = await Notification.find({
    type: 'vote',
    content: /Someone (upvoted|downvoted) your answer/
  });
  for (const notif of voteAnswerNotifications) {
    if (notif.sender) {
      const user = await User.findById(notif.sender);
      if (user && user.username) {
        let voteType = 'upvoted';
        if (notif.content.includes('downvoted')) voteType = 'downvoted';
        notif.content = `${user.username} ${voteType} your answer`;
        await notif.save();
      }
    }
  }

  console.log('Notification contents updated using sender!');
};

// Seed example IT/tech data
const seedExampleData = async () => {
  const User = require('./models/User');
  const Question = require('./models/Question');
  const Answer = require('./models/Answer');

  // Create users
  const users = [
    { username: 'alice', email: 'alice@example.com', password: 'password123' },
    { username: 'bob', email: 'bob@example.com', password: 'password123' },
    { username: 'charlie', email: 'charlie@example.com', password: 'password123' },
  ];
  const userDocs = [];
  for (const u of users) {
    let user = await User.findOne({ email: u.email });
    if (!user) user = await User.create(u);
    userDocs.push(user);
  }

  // Example tags
  const tags = ['React', 'Node.js', 'MongoDB', 'DevOps', 'Cloud', 'Cybersecurity'];

  // Create questions
  const questions = [
    {
      title: 'How do I deploy a React app to production?',
      description: 'I want to deploy my React app. What are the best practices?',
      tags: ['React', 'DevOps', 'Cloud'],
      author: userDocs[0]._id
    },
    {
      title: 'How to secure a Node.js API?',
      description: 'What are the best ways to secure a Node.js REST API?',
      tags: ['Node.js', 'Cybersecurity'],
      author: userDocs[1]._id
    },
    {
      title: 'What is the difference between SQL and NoSQL databases?',
      description: 'Can someone explain the main differences between SQL and NoSQL databases?',
      tags: ['MongoDB', 'Cloud'],
      author: userDocs[2]._id
    }
  ];
  const questionDocs = [];
  for (const q of questions) {
    let question = await Question.findOne({ title: q.title });
    if (!question) question = await Question.create(q);
    questionDocs.push(question);
  }

  // Create answers
  const answers = [
    {
      content: 'You can use Vercel, Netlify, or AWS S3 for static React apps.',
      question: questionDocs[0]._id,
      author: userDocs[1]._id
    },
    {
      content: 'Use helmet, rate limiting, and JWT for securing Node.js APIs.',
      question: questionDocs[1]._id,
      author: userDocs[2]._id
    },
    {
      content: 'SQL is relational, NoSQL is non-relational. MongoDB is a popular NoSQL database.',
      question: questionDocs[2]._id,
      author: userDocs[0]._id
    }
  ];
  const answerDocs = [];
  for (const a of answers) {
    let answer = await Answer.findOne({ content: a.content });
    if (!answer) answer = await Answer.create(a);
    answerDocs.push(answer);
  }

  // Upvote/downvote
  await questionDocs[0].addVote(userDocs[1]._id, 'upvote');
  await questionDocs[0].addVote(userDocs[2]._id, 'downvote');
  await questionDocs[1].addVote(userDocs[0]._id, 'upvote');
  await questionDocs[2].addVote(userDocs[1]._id, 'upvote');
  await answerDocs[0].addVote(userDocs[2]._id, 'upvote');
  await answerDocs[1].addVote(userDocs[0]._id, 'downvote');

  console.log('Seeded example IT/tech questions, answers, tags, and votes!');
};

if (require.main === module) {
  // Uncomment to run the seeder
  // seedExampleData().then(() => process.exit(0));
  updateNotificationContents().then(() => process.exit(0));
}

// Run the fix
fixDatabase(); 