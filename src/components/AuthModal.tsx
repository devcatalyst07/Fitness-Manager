import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useRouter } from 'next/navigation';

type LoginType = 'user' | 'admin';
type ModalType = 'login' | 'register' | null;

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  modalType: ModalType;
  onSwitchToRegister: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  modalType,
  onSwitchToRegister,
}) => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<LoginType>('user');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    setError('');
    setLoading(true);

    try {
      if (modalType === 'register') {
        if (password !== confirmPassword) {
          setError('Passwords do not match');
          setLoading(false);
          return;
        }
        console.log('Registration:', { email, password });
        onClose();
      } else {
        // Login
        console.log('Attempting login with:', { email, type: activeTab });
        
        // Use environment variable or fallback
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://fitout-manager-4lax2qt7n-rj-turingans-projects.vercel.app/';
        
        const response = await fetch(`${API_URL}/api/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email,
            password,
            type: activeTab,
          }),
        });

        console.log('Response status:', response.status);

        // Try to parse response
        let data;
        try {
          data = await response.json();
          console.log('Response data:', data);
        } catch (parseError) {
          console.error('Failed to parse response:', parseError);
          setError('Server error. Please check if the API is running.');
          setLoading(false);
          return;
        }

        if (!response.ok) {
          console.error('Login failed:', data);
          setError(data.message || 'Invalid credentials. Please try again');
          setLoading(false);
          return;
        }

        // Verify the role matches the selected tab
        if (data.role !== activeTab) {
          console.error('Role mismatch:', { expected: activeTab, got: data.role });
          setError('Invalid credentials. Please try again');
          setLoading(false);
          return;
        }

        // Store token and user info - use try-catch for localStorage
        console.log('Login successful, storing data...');
        try {
          if (typeof window !== 'undefined') {
            localStorage.setItem('token', data.token);
            localStorage.setItem('userRole', data.role);
            localStorage.setItem('userName', data.name);
            localStorage.setItem('userEmail', email);
          }
        } catch (storageError) {
          console.error('Failed to save to localStorage:', storageError);
        }

        // Redirect based on role
        console.log('Redirecting to dashboard...');
        if (data.role === 'admin') {
          router.push('/admin/dashboard');
        } else {
          router.push('/user/dashboard');
        }

        onClose();
      }
    } catch (err) {
      console.error('Auth error:', err);
      setError('Unable to connect to server. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setError('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-md relative">
        <button
          onClick={handleClose}
          className="absolute right-4 top-4 text-gray-400 hover:text-black transition-colors"
        >
          <X size={24} />
        </button>

        <div className="p-8">
          <h2 className="text-2xl font-bold text-black mb-6">
            {modalType === 'register' ? 'Create Account' : 'Log In'}
          </h2>

          {modalType === 'login' && (
            <div className="flex border-b border-gray-200 mb-6">
              <button
                onClick={() => {
                  setActiveTab('user');
                  setError('');
                }}
                className={`flex-1 pb-3 text-center transition-colors ${
                  activeTab === 'user'
                    ? 'border-b-2 border-black text-black font-semibold'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                User
              </button>
              <button
                onClick={() => {
                  setActiveTab('admin');
                  setError('');
                }}
                className={`flex-1 pb-3 text-center transition-colors ${
                  activeTab === 'admin'
                    ? 'border-b-2 border-black text-black font-semibold'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Admin
              </button>
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 focus:outline-none focus:border-black transition-colors"
                placeholder={activeTab === 'admin' ? 'admin@example.com' : 'user@example.com'}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 focus:outline-none focus:border-black transition-colors"
              />
            </div>

            {modalType === 'register' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 focus:outline-none focus:border-black transition-colors"
                />
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full bg-black text-white py-3 hover:bg-gray-800 transition-colors font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? 'Please wait...' : modalType === 'register' ? 'Create Account' : 'Log In'}
            </button>
          </div>

          {modalType === 'login' && activeTab === 'user' && (
            <div className="mt-4 text-center">
              <button
                onClick={onSwitchToRegister}
                className="text-sm text-gray-600 hover:text-black transition-colors underline"
              >
                Create an account
              </button>
            </div>
          )}

          {modalType === 'login' && activeTab === 'admin' && (
            <div className="mt-4 text-center text-xs text-gray-500">
              Admin credentials required
            </div>
          )}
        </div>
      </div>
    </div>
  );
};