# StackIt Q&A Forum - Setup Instructions

## Issues Fixed

I've identified and fixed the main issues preventing questions and answers from being stored in the database:

### 1. **AskQuestion Component Not Submitting to API**
- **Problem**: The component had a TODO comment and was only logging data instead of calling the API
- **Fix**: Updated to use `questionService.createQuestion()` to actually submit questions to the database

### 2. **QuestionDetail Component Not Fetching Real Data**
- **Problem**: Component showed static content instead of real question data
- **Fix**: Completely rewrote to fetch real question data and display answers

### 3. **Missing Answer Service**
- **Problem**: No way to create answers from the frontend
- **Fix**: Created `answerService.js` with all necessary API calls

### 4. **Missing Answer Creation Functionality**
- **Problem**: No form to submit answers
- **Fix**: Added answer creation form in QuestionDetail component

## Setup Instructions

### 1. Environment Variables

Create these files in your project:

**Server (.env file in server folder):**
```
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/stackit
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRE=7d
CLIENT_URL=http://localhost:3000
```

**Client (.env file in client folder):**
```
REACT_APP_API_URL=http://localhost:5000/api
```

### 2. Database Setup

You need MongoDB running. Options:

**Option A: Local MongoDB**
1. Install MongoDB locally
2. Start MongoDB service
3. Use `mongodb://localhost:27017/stackit` as MONGODB_URI

**Option B: MongoDB Atlas (Recommended)**
1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create free account and cluster
3. Get connection string
4. Replace MONGODB_URI with your Atlas connection string

### 3. Start the Application

**Terminal 1 - Start Backend:**
```bash
cd server
npm install
npm start
```

**Terminal 2 - Start Frontend:**
```bash
cd client
npm install
npm start
```

### 4. Test the Application

1. **Register/Login**: Go to http://localhost:3000/register to create an account
2. **Ask Questions**: Go to http://localhost:3000/ask to create questions
3. **View Questions**: Go to http://localhost:3000/questions to see all questions
4. **Answer Questions**: Click on any question to view details and add answers
5. **Test API**: Go to http://localhost:3000/test to run API tests

## How It Works Now

### Question Creation Flow:
1. User fills out form on `/ask` page
2. Form submits to `questionService.createQuestion()`
3. Backend saves to MongoDB
4. User is redirected to question detail page

### Answer Creation Flow:
1. User views question detail page
2. User fills out answer form
3. Form submits to `answerService.createAnswer()`
4. Backend saves to MongoDB
5. Answer appears in the list

### Data Display:
- Questions page fetches all questions from database
- Question detail page fetches specific question and its answers
- All data is real and persisted in MongoDB

## Troubleshooting

### If you see "Route not found" errors:
- Make sure both servers are running
- Check that environment variables are set correctly
- Verify MongoDB connection

### If questions/answers don't save:
- Check browser console for errors
- Verify you're logged in (authentication required)
- Check server console for database errors

### If you can't connect to database:
- Verify MongoDB is running
- Check MONGODB_URI in server .env file
- Try using MongoDB Atlas for cloud database

## API Test Page

Visit http://localhost:3000/test to run automated tests that will:
- Test questions API connectivity
- Create a test question
- Create a test answer
- Show detailed results and any errors

This will help you verify that everything is working correctly. 