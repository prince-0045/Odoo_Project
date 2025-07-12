const mongoose = require('mongoose');
const User = require('./models/User');
const Question = require('./models/Question');
const Answer = require('./models/Answer');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/odoo_project';

async function seed() {
  await mongoose.connect(MONGO_URI);

  // Clear old data
  await User.deleteMany({});
  await Question.deleteMany({});
  await Answer.deleteMany({});

  // Create users
  const users = await User.insertMany([
    { username: 'alice', email: 'alice@example.com', password: 'password123' },
    { username: 'bob', email: 'bob@example.com', password: 'password123' },
    { username: 'charlie', email: 'charlie@example.com', password: 'password123' },
    { username: 'dave', email: 'dave@example.com', password: 'password123' },
    { username: 'eve', email: 'eve@example.com', password: 'password123' }
  ]);

  // Create questions
  const questions = await Question.insertMany([
    {
      title: 'How do I center a div in CSS?',
      description: '<p>I want to center a div both vertically and horizontally. What is the best way?</p>',
      tags: ['css', 'html', 'frontend'],
      author: users[0]._id
    },
    {
      title: 'What is the difference between let and var in JavaScript?',
      description: '<p>Can someone explain the difference between <code>let</code> and <code>var</code>?</p>',
      tags: ['javascript', 'es6'],
      author: users[1]._id
    },
    {
      title: 'How to connect MongoDB with Node.js?',
      description: '<p>I am new to backend development. How do I connect my Node.js app to MongoDB?</p>',
      tags: ['mongodb', 'nodejs', 'backend'],
      author: users[2]._id
    },
    {
      title: 'What is a REST API?',
      description: '<p>What does REST stand for and how does a REST API work?</p>',
      tags: ['api', 'rest', 'web'],
      author: users[3]._id
    },
    {
      title: 'How to use useEffect in React?',
      description: '<p>I am confused about how <code>useEffect</code> works in React. Can someone explain with an example?</p>',
      tags: ['react', 'hooks', 'frontend'],
      author: users[4]._id
    }
  ]);

  // Create answers
  await Answer.insertMany([
    {
      content: '<p>You can use <code>display: flex</code> and <code>justify-content: center</code> and <code>align-items: center</code>.</p>',
      question: questions[0]._id,
      author: users[1]._id
    },
    {
      content: '<p><code>let</code> is block scoped, <code>var</code> is function scoped.</p>',
      question: questions[1]._id,
      author: users[2]._id
    },
    {
      content: '<p>Use the <code>mongoose.connect()</code> method in your Node.js app.</p>',
      question: questions[2]._id,
      author: users[3]._id
    },
    {
      content: '<p>REST stands for Representational State Transfer. It is an architectural style for APIs.</p>',
      question: questions[3]._id,
      author: users[4]._id
    },
    {
      content: '<p><code>useEffect</code> lets you perform side effects in function components. Example:<br/><code>useEffect(() => { /* code */ }, []);</code></p>',
      question: questions[4]._id,
      author: users[0]._id
    },
    {
      content: '<p>You can also use <code>margin: auto</code> for centering in some cases.</p>',
      question: questions[0]._id,
      author: users[2]._id
    },
    {
      content: '<p>Another difference: <code>var</code> is hoisted, <code>let</code> is not.</p>',
      question: questions[1]._id,
      author: users[3]._id
    }
  ]);

  console.log('Seed data inserted!');
  process.exit();
}

seed(); 