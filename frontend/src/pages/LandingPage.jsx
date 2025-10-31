import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const LandingPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  // If user is already authenticated, redirect them to their dashboard
  useEffect(() => {
    if (isAuthenticated) {
      navigate(user.role === 'admin' ? '/admin' : '/cashier');
    }
  }, [isAuthenticated, user, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 to-purple-600">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto text-center text-white">
          <h1 className="text-5xl font-bold mb-8">
            Welcome to POS System
          </h1>
          <p className="text-xl mb-12">
            A modern point of sale system with role-based access, inventory management, 
            and real-time analytics.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
            {/* Admin Features */}
            <div className="bg-white bg-opacity-10 p-6 rounded-lg backdrop-blur-lg">
              <h2 className="text-2xl font-semibold mb-4">Admin Features</h2>
              <ul className="text-left space-y-2">
                <li>✓ Complete inventory management</li>
                <li>✓ Sales analytics and reporting</li>
                <li>✓ User management</li>
                <li>✓ Product category management</li>
              </ul>
            </div>

            {/* Cashier Features */}
            <div className="bg-white bg-opacity-10 p-6 rounded-lg backdrop-blur-lg">
              <h2 className="text-2xl font-semibold mb-4">Cashier Features</h2>
              <ul className="text-left space-y-2">
                <li>✓ Quick and easy sales processing</li>
                <li>✓ Real-time inventory checking</li>
                <li>✓ Receipt generation</li>
                <li>✓ Daily sales summary</li>
              </ul>
            </div>
          </div>

          <button
            onClick={() => navigate('/login')}
            className="bg-white text-indigo-600 px-8 py-3 rounded-lg font-semibold text-lg hover:bg-indigo-50 transition-colors"
          >
            Login to System
          </button>
        </div>

        {/* Footer */}
        <footer className="mt-16 text-center text-white text-sm">
          <p>© 2025 POS System. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
};

export default LandingPage;