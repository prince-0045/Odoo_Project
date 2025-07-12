import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout/Layout';
import Home from './pages/Home';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import Dashboard from './pages/Dashboard';
import AskQuestion from './pages/AskQuestion';
import Questions from './pages/Questions';
import QuestionDetail from './pages/QuestionDetail';
import Tags from './pages/Tags';
import Users from './pages/Users';
import Profile from './pages/Profile';
import UserProfile from './pages/UserProfile';
import TestAPI from './components/TestAPI';
import SimpleTest from './components/SimpleTest';
import ValidationTest from './components/ValidationTest';
import NotificationTest from './components/NotificationTest';
import NotFound from './pages/NotFound';

// Protected Route component
const ProtectedRoute = ({ children }) => {
  const { currentUser, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner w-8 h-8"></div>
      </div>
    );
  }
  
  return currentUser ? children : <Navigate to="/login" replace />;
};

function App() {
  return (
    <div className="App">
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
          <Route path="questions" element={<Questions />} />
          <Route path="questions/:id" element={<QuestionDetail />} />
          <Route path="tags" element={<Tags />} />
          <Route path="users" element={<Users />} />
          <Route path="users/:username" element={<UserProfile />} />
          <Route path="test" element={<TestAPI />} />
          <Route path="simple-test" element={<SimpleTest />} />
          <Route path="validation-test" element={<ValidationTest />} />
          <Route path="notification-test" element={<NotificationTest />} />
          
          {/* Protected routes */}
          <Route path="dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="ask" element={
            <ProtectedRoute>
              <AskQuestion />
            </ProtectedRoute>
          } />
          <Route path="profile" element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } />
          
          {/* 404 route */}
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </div>
  );
}

export default App; 