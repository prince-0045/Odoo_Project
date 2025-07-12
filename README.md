# StackIt - Q&A Forum Platform

A production-grade Q&A forum platform built with the MERN stack and Firebase Authentication, inspired by StackOverflow.

## 🚀 Features

- **User Authentication**: Firebase-powered signup/login with JWT protection
- **Ask & Answer Questions**: Rich text editor for questions and answers
- **Voting System**: Upvote/downvote answers
- **Answer Acceptance**: Question owners can accept best answers
- **Real-time Notifications**: Live notifications for new answers/comments
- **Responsive Design**: Modern UI with Tailwind CSS
- **Search & Tags**: Find questions by tags and search functionality

## 🛠 Tech Stack

- **Frontend**: React.js + Tailwind CSS + Socket.IO Client
- **Backend**: Node.js + Express.js + MongoDB + Mongoose
- **Authentication**: Firebase Authentication + JWT
- **Real-time**: Socket.IO
- **Rich Text**: React-Quill
- **Database**: MongoDB Atlas
- **Deployment**: Vercel (Frontend) + Render (Backend)

## 📁 Project Structure

```
stackit/
├── client/                 # React frontend
│   ├── public/
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/         # Page components
│   │   ├── context/       # React context providers
│   │   ├── hooks/         # Custom hooks
│   │   ├── services/      # API services
│   │   └── utils/         # Utility functions
│   └── package.json
├── server/                 # Node.js backend
│   ├── config/            # Configuration files
│   ├── controllers/       # Route controllers
│   ├── middleware/        # Custom middleware
│   ├── models/           # MongoDB schemas
│   ├── routes/           # API routes
│   ├── services/         # Business logic
│   └── package.json
└── README.md
```

## 🚀 Quick Start

### Prerequisites

- Node.js (v16 or higher)
- MongoDB Atlas account
- Firebase project
- Git

### 1. Clone the Repository

```bash
git clone <repository-url>
cd stackit
```

### 2. Backend Setup

```bash
cd server
npm install
```

Create a `.env` file in the server directory:

```env
PORT=5000
MONGODB_URI=your_mongodb_atlas_uri
JWT_SECRET=your_jwt_secret_key
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_PRIVATE_KEY=your_firebase_private_key
FIREBASE_CLIENT_EMAIL=your_firebase_client_email
CLIENT_URL=http://localhost:3000
```

### 3. Frontend Setup

```bash
cd ../client
npm install
```

Create a `.env` file in the client directory:

```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_FIREBASE_API_KEY=your_firebase_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
REACT_APP_FIREBASE_PROJECT_ID=your_firebase_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
REACT_APP_FIREBASE_APP_ID=your_firebase_app_id
```

### 4. Run the Application

**Backend:**
```bash
cd server
npm run dev
```

**Frontend:**
```bash
cd client
npm start
```

Visit `http://localhost:3000` to see the application.

## 🔧 Firebase Setup

1. Create a new Firebase project
2. Enable Authentication with Email/Password
3. Create a service account and download the JSON file
4. Add the credentials to your backend `.env` file

## 🗄 Database Setup

1. Create a MongoDB Atlas cluster
2. Get your connection string
3. Add it to your backend `.env` file

## 🚀 Deployment

### Backend (Render)

1. Connect your GitHub repository to Render
2. Set environment variables in Render dashboard
3. Deploy the server directory

### Frontend (Vercel)

1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy the client directory

## 📝 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Questions
- `GET /api/questions` - Get all questions
- `POST /api/questions` - Create new question
- `GET /api/questions/:id` - Get question by ID
- `PUT /api/questions/:id` - Update question
- `DELETE /api/questions/:id` - Delete question

### Answers
- `POST /api/questions/:id/answers` - Add answer to question
- `PUT /api/answers/:id` - Update answer
- `DELETE /api/answers/:id` - Delete answer
- `POST /api/answers/:id/vote` - Vote on answer
- `PUT /api/answers/:id/accept` - Accept answer

### Notifications
- `GET /api/notifications` - Get user notifications
- `PUT /api/notifications/:id/read` - Mark notification as read

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request
