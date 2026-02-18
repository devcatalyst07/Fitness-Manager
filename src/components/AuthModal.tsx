"use client";

import React, { useState } from "react";
import { X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { apiClient } from "@/lib/axios";

type LoginType = "user" | "admin";
type ModalType = "login" | "register" | "request-role" | null;
type AccountType = "user" | "admin";

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
  const [accountType, setAccountType] = useState<AccountType>("user");
  const [showRoleRequest, setShowRoleRequest] = useState(false);
  const [requestAdminEmail, setRequestAdminEmail] = useState("");
  const [requestLoading, setRequestLoading] = useState(false);
  const [requestSuccess, setRequestSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    setError("");
    setLoading(true);

    try {
      if (modalType === "register") {
        // Registration
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

        // Register with selected account type (user or admin)
        await register(name, email, password, accountType);

        // If ADMIN: Close modal (user will be redirected to admin dashboard automatically)
        if (accountType === "admin") {
          setLoading(false);
          onClose();
        } else {
          // If USER: Show role request screen to send email to admin
          setShowRoleRequest(true);
          setRequestAdminEmail("");
          setRequestSuccess(false);
          setLoading(false);
        }
      } else {
        // Login using auth context
        await login(email, password, false);
        onClose();
        // Redirect happens automatically via AuthContext
      }
    } catch (err: any) {
      console.error("Auth error:", err);

      // Check for specific error codes first
      const errorCode = err?.response?.data?.code;
      const errorMessage = err?.response?.data?.message;

      if (errorCode === "NO_ROLE_ASSIGNED") {
        setError(
          errorMessage ||
            "You do not have a role assigned. Please contact an administrator to request access.",
        );
      } else if (
        err?.response?.status === 403 ||
        err?.response?.status === 401
      ) {
        setError("Invalid credentials. Please try again.");
      } else {
        setError(errorMessage || err.message || "Authentication failed");
      }
      setLoading(false);
    }
  };

  const handleSendRoleRequest = async () => {
    setError("");
    setRequestLoading(true);

    try {
      if (!requestAdminEmail) {
        setError("Admin email is required");
        setRequestLoading(false);
        return;
      }

      // Call backend endpoint to send role request
      const response = await apiClient.post("/api/auth/request-role", {
        adminEmail: requestAdminEmail,
      });

      if (!response.data) {
        throw new Error("Failed to send role request");
      }

      // Mark that role request was sent (for page.tsx to detect)
      if (typeof window !== "undefined") {
        localStorage.setItem("roleRequestSentAt", new Date().toISOString());
      }

      setRequestSuccess(true);
      setRequestAdminEmail("");

      // Auto-close after 3 seconds
      setTimeout(() => {
        onClose();
      }, 3000);
    } catch (err: any) {
      console.error("Role request error:", err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to send role request",
      );
    } finally {
      setRequestLoading(false);
    }
  };

  const resetForm = () => {
    setName("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setSubscriptionType("Starter");
    setError("");
    setAccountType("user");
    setShowRoleRequest(false);
    setRequestAdminEmail("");
    setRequestSuccess(false);
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
            {showRoleRequest
              ? "Request Role Assignment"
              : modalType === "register"
                ? "Create Account"
                : "Log In"}
          </h2>

          {modalType === "login" && !showRoleRequest && (
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

          {showRoleRequest ? (
            // Role Request Form
            <div className="space-y-4">
              {requestSuccess ? (
                <div className="bg-green-50 border border-green-200 rounded p-4 text-center">
                  <div className="text-green-700 font-semibold mb-2">
                    ✓ Request Sent Successfully!
                  </div>
                  <p className="text-green-600 text-sm">
                    Your role assignment request has been sent to the admin.
                    You'll be notified once your role is assigned.
                  </p>
                </div>
              ) : (
                <>
                  <div className="bg-blue-50 border border-blue-200 rounded p-4 mb-4">
                    <p className="text-blue-700 text-sm">
                      Your account has been created! To get started, please
                      provide the admin email address where they can review and
                      assign youa role.
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      User Email
                    </label>
                    <input
                      type="email"
                      value={email}
                      disabled
                      className="w-full px-4 py-2 border border-gray-300 bg-gray-50 text-gray-500 cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Admin Email
                    </label>
                    <input
                      type="email"
                      value={requestAdminEmail}
                      onChange={(e) => setRequestAdminEmail(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 focus:outline-none focus:border-black transition-colors"
                      placeholder="admin@example.com"
                    />
                  </div>

                  <button
                    onClick={handleSendRoleRequest}
                    disabled={requestLoading}
                    className="w-full bg-black text-white py-3 hover:bg-gray-800 transition-colors font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {requestLoading ? "Sending..." : "Send Role Request"}
                  </button>

                  <button
                    onClick={handleClose}
                    className="w-full border border-gray-300 text-black py-3 hover:bg-gray-50 transition-colors font-medium"
                  >
                    Skip for Now
                  </button>
                </>
              )}
            </div>
          ) : (
            // Original Auth Form
            <div className="space-y-4">
              {modalType === "register" && (
                <>
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

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Account Type
                    </label>
                    <div className="flex gap-4">
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="radio"
                          name="accountType"
                          value="user"
                          checked={accountType === "user"}
                          onChange={(e) =>
                            setAccountType(e.target.value as AccountType)
                          }
                          className="w-4 h-4 cursor-pointer"
                        />
                        <span className="ml-2 text-sm text-gray-700">User</span>
                      </label>
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="radio"
                          name="accountType"
                          value="admin"
                          checked={accountType === "admin"}
                          onChange={(e) =>
                            setAccountType(e.target.value as AccountType)
                          }
                          className="w-4 h-4 cursor-pointer"
                        />
                        <span className="ml-2 text-sm text-gray-700">
                          Admin
                        </span>
                      </label>
                    </div>
                  </div>
                </>
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
                      <option value="Starter">
                        Starter - 3 seats ($29/mo)
                      </option>
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
          )}

          {!showRoleRequest &&
            modalType === "login" &&
            activeTab === "user" && (
              <div className="mt-4 text-center">
                <button
                  onClick={onSwitchToRegister}
                  className="text-sm text-gray-600 hover:text-black transition-colors underline"
                >
                  Create an account
                </button>
              </div>
            )}

          {!showRoleRequest &&
            modalType === "login" &&
            activeTab === "admin" && (
              <div className="mt-4 text-center text-xs text-gray-500">
                Admin credentials required (no registration available)
              </div>
            )}
        </div>
      </div>
    </div>
  );
};
