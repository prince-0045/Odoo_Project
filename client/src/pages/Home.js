import React from 'react';
import { Link } from 'react-router-dom';
import { FiArrowRight, FiUsers, FiMessageSquare, FiTag, FiTrendingUp } from 'react-icons/fi';

const Home = () => {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-primary text-white py-20">
        <div className="container-responsive text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Welcome to <span className="text-yellow-300">StackIt</span>
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-blue-100 max-w-3xl mx-auto">
            The modern Q&A platform for developers and tech enthusiasts. 
            Ask questions, share knowledge, and connect with the community.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/questions"
              className="inline-flex items-center justify-center px-8 py-3 bg-white text-primary-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors"
            >
              Browse Questions
              <FiArrowRight className="ml-2" />
            </Link>
            <Link
              to="/ask"
              className="inline-flex items-center justify-center px-8 py-3 bg-yellow-400 text-gray-900 font-semibold rounded-lg hover:bg-yellow-300 transition-colors"
            >
              Ask a Question
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white dark:bg-gray-800">
        <div className="container-responsive">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Why Choose StackIt?
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Built by developers, for developers. Get the answers you need from a community of experts.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiMessageSquare className="w-8 h-8 text-primary-600 dark:text-primary-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Rich Q&A Experience
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Ask detailed questions with code snippets, images, and formatting. Get comprehensive answers from experts.
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-16 h-16 bg-success-100 dark:bg-success-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiUsers className="w-8 h-8 text-success-600 dark:text-success-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Expert Community
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Connect with developers from around the world. Share knowledge and learn from the best.
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-16 h-16 bg-warning-100 dark:bg-warning-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiTrendingUp className="w-8 h-8 text-warning-600 dark:text-warning-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Real-time Updates
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Get instant notifications for new answers, comments, and mentions. Stay connected with the community.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gray-50 dark:bg-gray-900">
        <div className="container-responsive">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-primary-600 dark:text-primary-400 mb-2">
                10K+
              </div>
              <div className="text-gray-600 dark:text-gray-400">Questions Asked</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-success-600 dark:text-success-400 mb-2">
                50K+
              </div>
              <div className="text-gray-600 dark:text-gray-400">Answers Provided</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-warning-600 dark:text-warning-400 mb-2">
                5K+
              </div>
              <div className="text-gray-600 dark:text-gray-400">Active Users</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-danger-600 dark:text-danger-400 mb-2">
                100+
              </div>
              <div className="text-gray-600 dark:text-gray-400">Tags Available</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-white dark:bg-gray-800">
        <div className="container-responsive text-center">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
            Join thousands of developers who are already using StackIt to solve problems and share knowledge.
          </p>
          <Link
            to="/register"
            className="inline-flex items-center justify-center px-8 py-3 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition-colors"
          >
            Join StackIt Today
            <FiArrowRight className="ml-2" />
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home; 