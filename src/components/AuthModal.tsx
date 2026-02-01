import React, { useState } from "react";
import { X } from "lucide-react";
import { useRouter } from "next/navigation";

type LoginType = "user" | "admin";
type ModalType = "login" | "register" | null;

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  modalType: ModalType;
  onSwitchToRegister: () => void;
}

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://fitout-manager-api.vercel.app";

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  modalType,
  onSwitchToRegister,
}) => {
  const router = useRouter();
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

        const response = await fetch(`${API_URL}/api/auth/register`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name,
            email,
            password,
            subscriptionType,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          setError(data.message || "Registration failed");
          setLoading(false);
          return;
        }

        // Store token and redirect
        localStorage.setItem("token", data.token);
        localStorage.setItem("userRole", data.role);
        localStorage.setItem("userName", data.name);
        localStorage.setItem("userEmail", email);
        localStorage.setItem("roleId", data.roleId);

        // Get redirect path based on permissions
        const redirectPath = await getRedirectPath(data.roleId, data.role);
        router.push(redirectPath);
        onClose();
      } else {
        // Login
        const response = await fetch(`${API_URL}/api/auth/login`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            password,
            type: activeTab,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          if (response.status === 403) {
            setError("Invalid credentials. Please try again.");
          } else {
            setError(data.message || "Login failed");
          }
          setLoading(false);
          return;
        }

        if (data.role !== activeTab) {
          setError("Invalid credentials. Please try again.");
          setLoading(false);
          return;
        }

        localStorage.setItem("token", data.token);
        localStorage.setItem("userRole", data.role);
        localStorage.setItem("userName", data.name);
        localStorage.setItem("userEmail", email);
        localStorage.setItem("roleId", data.roleId);

        if (data.role === "admin") {
          router.push("/admin/dashboard");
        } else {
          // Get redirect path based on permissions for users
          const redirectPath = await getRedirectPath(data.roleId, data.role);
          router.push(redirectPath);
        }

        onClose();
      }
    } catch (err) {
      console.error("Auth error:", err);
      setError("Unable to connect to server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getRedirectPath = async (
    roleId: string,
    role: string,
  ): Promise<string> => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/api/roles/${roleId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const roleData = await response.json();
        const permissions = roleData.permissions || [];

        // Define available pages and their permission IDs
        const availablePages = [
          { path: `/user/dashboard`, permissionId: "dashboard" },
          { path: `/user/projects`, permissionId: "projects" },
          { path: `/user/finance`, permissionId: "finance" },
          { path: `/user/documents`, permissionId: "documents" },
          { path: `/user/reports`, permissionId: "reports" },
        ];

        // Helper function to check if permission exists and is checked
        const hasPermission = (permissionId: string, perms: any[]): boolean => {
          for (const perm of perms) {
            if (perm.id === permissionId && perm.checked) {
              return true;
            }
            if (perm.children && perm.children.length > 0) {
              if (hasPermission(permissionId, perm.children)) {
                return true;
              }
            }
          }
          return false;
        };

        // Find first available page based on permissions
        for (const page of availablePages) {
          if (hasPermission(page.permissionId, permissions)) {
            return page.path;
          }
        }

        // If no specific page found, return default based on role
        return role === "admin" ? "/admin/dashboard" : "/user/dashboard";
      }

      // Fallback if fetch fails
      return role === "admin" ? "/admin/dashboard" : "/user/dashboard";
    } catch (error) {
      console.error("Error fetching role permissions:", error);
      return role === "admin" ? "/admin/dashboard" : "/user/dashboard";
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
