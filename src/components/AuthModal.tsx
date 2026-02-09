"use client";

import React, { useState } from "react";
import { X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

type LoginType = "user" | "admin";
type ModalType = "login" | "register" | null;

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
  const { login, register } = useAuth();
  const [activeTab, setActiveTab] = useState<LoginType>("user");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [subscriptionType, setSubscriptionType] = useState("Starter");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    setError("");
    setLoading(true);

    try {
      if (modalType === "register") {
        // Registration (Users only)
        if (!name || !email || !password) {
          setError("All fields are required");
          setLoading(false);
          return;
        }

        if (password !== confirmPassword) {
          setError("Passwords do not match");
          setLoading(false);
          return;
        }

        // Register using auth context
        await register(name, email, password);
        onClose();
        // Redirect happens automatically via AuthContext
      } else {
        // Login using auth context
        await login(email, password, false);
        onClose();
        // Redirect happens automatically via AuthContext
      }
    } catch (err: any) {
      console.error("Auth error:", err);
      if (err?.response?.status === 403 || err?.response?.status === 401) {
        setError("Invalid credentials. Please try again.");
      } else {
        setError(err?.response?.data?.message || err.message || "Authentication failed");
      }
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setName("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setSubscriptionType("Starter");
    setError("");
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
            {modalType === "register" ? "Create Account" : "Log In"}
          </h2>

          {modalType === "login" && (
            <div className="flex border-b border-gray-200 mb-6">
              <button
                onClick={() => {
                  setActiveTab("user");
                  setError("");
                }}
                className={`flex-1 pb-3 text-center transition-colors ${
                  activeTab === "user"
                    ? "border-b-2 border-black text-black font-semibold"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                User
              </button>
              <button
                onClick={() => {
                  setActiveTab("admin");
                  setError("");
                }}
                className={`flex-1 pb-3 text-center transition-colors ${
                  activeTab === "admin"
                    ? "border-b-2 border-black text-black font-semibold"
                    : "text-gray-500 hover:text-gray-700"
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
            {modalType === "register" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 focus:outline-none focus:border-black transition-colors"
                  placeholder="Your full name"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 focus:outline-none focus:border-black transition-colors"
                placeholder={
                  activeTab === "admin"
                    ? "admin@example.com"
                    : "user@example.com"
                }
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
                placeholder={activeTab === "admin" ? "" : ""}
              />
            </div>

            {modalType === "register" && (
              <>
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

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Subscription Type
                  </label>
                  <select
                    value={subscriptionType}
                    onChange={(e) => setSubscriptionType(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 focus:outline-none focus:border-black transition-colors"
                  >
                    <option value="Starter">Starter - 3 seats ($29/mo)</option>
                    <option value="Team">Team - 10 seats ($99/mo)</option>
                    <option value="Enterprise">Enterprise - Unlimited</option>
                  </select>
                </div>
              </>
            )}

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full bg-black text-white py-3 hover:bg-gray-800 transition-colors font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading
                ? "Please wait..."
                : modalType === "register"
                  ? "Create Account"
                  : "Log In"}
            </button>
          </div>

          {modalType === "login" && activeTab === "user" && (
            <div className="mt-4 text-center">
              <button
                onClick={onSwitchToRegister}
                className="text-sm text-gray-600 hover:text-black transition-colors underline"
              >
                Create an account
              </button>
            </div>
          )}

          {modalType === "login" && activeTab === "admin" && (
            <div className="mt-4 text-center text-xs text-gray-500">
              Admin credentials required (no registration available)
            </div>
          )}
        </div>
      </div>
    </div>
  );
};