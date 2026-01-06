import React, { useState } from 'react';
import { X } from 'lucide-react';

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
  const [activeTab, setActiveTab] = useState<LoginType>('user');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  if (!isOpen) return null;

  const handleSubmit = () => {
    console.log('Submitted:', { email, password, type: activeTab, modalType });
    onClose();
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <div className="fixed inset-1 bg-black/90 flex items-center justify-center z-50 p-4">
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
                onClick={() => setActiveTab('user')}
                className={`flex-1 pb-3 text-center transition-colors ${
                  activeTab === 'user'
                    ? 'border-b-2 border-black text-black font-semibold'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                User
              </button>
              <button
                onClick={() => setActiveTab('admin')}
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
              className="w-full bg-black text-white py-3 hover:bg-gray-800 transition-colors font-medium"
            >
              {modalType === 'register' ? 'Create Account' : 'Log In'}
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
        </div>
      </div>
    </div>
  );
};