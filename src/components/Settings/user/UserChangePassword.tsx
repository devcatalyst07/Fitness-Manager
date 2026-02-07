"use client";

import React, { useEffect, useState } from "react";
import { Eye, EyeOff, Check, Shield } from "lucide-react";
import AdminSidebar from "@/components/AdminSidebar";
import AdminHeader from "@/components/AdminHeader";
import { Permission } from "@/utils/permissions";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

// ─── Password Strength Logic ──────────────────────────────────────────────────
type StrengthLevel = "weak" | "fair" | "good" | "strong";

function getCachedPermissions(): Permission[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem("rolePermissions");
    return raw ? (JSON.parse(raw) as Permission[]) : [];
  } catch {
    return [];
  }
}

function getStrength(password: string): StrengthLevel {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) return "weak";
  if (score === 2) return "fair";
  if (score === 3) return "good";
  return "strong";
}

const strengthConfig: Record<
  StrengthLevel,
  { label: string; color: string; bars: number; barColor: string }
> = {
  weak: {
    label: "Weak",
    color: "text-red-500",
    bars: 1,
    barColor: "bg-red-500",
  },
  fair: {
    label: "Fair",
    color: "text-amber-500",
    bars: 2,
    barColor: "bg-amber-500",
  },
  good: {
    label: "Good",
    color: "text-blue-500",
    bars: 3,
    barColor: "bg-blue-500",
  },
  strong: {
    label: "Strong",
    color: "text-emerald-500",
    bars: 4,
    barColor: "bg-emerald-500",
  },
};

function PasswordStrengthBar({ password }: { password: string }) {
  if (!password) return null;
  const level = getStrength(password);
  const { label, color, bars, barColor } = strengthConfig[level];

  return (
    <div className="mt-2">
      <div className="flex gap-1.5">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-all duration-300 ${
              i <= bars ? barColor : "bg-gray-200"
            }`}
          />
        ))}
      </div>
      <p className={`text-xs mt-1.5 font-medium ${color}`}>{label} password</p>
    </div>
  );
}

// ─── Password Input ───────────────────────────────────────────────────────────
function PasswordInput({
  label,
  name,
  value,
  onChange,
  error,
  showStrength,
  placeholder,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  showStrength?: boolean;
  placeholder?: string;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div>
      <label className="block text-sm font-medium text-gray-600 mb-1.5">
        {label}
      </label>
      <div className="relative">
        <input
          type={visible ? "text" : "password"}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder || "••••••••"}
          className={`w-full px-4 py-2.5 pr-10 rounded-lg border text-sm text-gray-800 focus:outline-none focus:ring-2 transition ${
            error
              ? "border-red-300 focus:ring-red-200 focus:border-red-400"
              : "border-gray-200 focus:ring-indigo-200 focus:border-indigo-400"
          }`}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
        >
          {visible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
      {showStrength && <PasswordStrengthBar password={value} />}
      {error && <p className="text-red-500 text-xs mt-1.5">{error}</p>}
    </div>
  );
}

// ─── Success Message ──────────────────────────────────────────────────────────
function SuccessMessage() {
  return (
    <div className="flex items-start gap-3 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-lg">
      <div className="mt-0.5 flex-shrink-0 w-5 h-5 bg-emerald-100 rounded-full flex items-center justify-center">
        <Check size={13} className="text-emerald-600" />
      </div>
      <div>
        <p className="text-sm font-medium text-emerald-700">Password updated</p>
        <p className="text-xs text-emerald-600 mt-0.5">
          Your password has been changed successfully.
        </p>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function UserChangePassword() {
  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [permissions, setPermissions] =
    useState<Permission[]>(getCachedPermissions);

  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        const token = localStorage.getItem("token");
        const roleId = localStorage.getItem("roleId");
        if (!roleId) return;

        const res = await fetch(`${API_URL}/api/roles/${roleId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setPermissions(data.permissions || []);
          try {
            localStorage.setItem(
              "rolePermissions",
              JSON.stringify(data.permissions || []),
            );
          } catch {
            // Ignore storage errors
          }
        }
      } catch (error) {
        console.error("Failed to load permissions:", error);
      }
    };

    fetchPermissions();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name])
      setErrors((prev) => {
        const n = { ...prev };
        delete n[name];
        return n;
      });
    if (name === "confirmPassword" && errors.confirmPassword) {
      setErrors((prev) => {
        const n = { ...prev };
        delete n.confirmPassword;
        return n;
      });
    }
    setIsSuccess(false);
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!form.currentPassword.trim())
      newErrors.currentPassword = "Current password is required.";
    if (!form.newPassword.trim()) {
      newErrors.newPassword = "New password is required.";
    } else if (form.newPassword.length < 8) {
      newErrors.newPassword = "Password must be at least 8 characters.";
    }
    if (!form.confirmPassword.trim()) {
      newErrors.confirmPassword = "Please confirm your new password.";
    } else if (form.newPassword !== form.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match.";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");

      const res = await fetch(`${API_URL}/api/profile/change-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword: form.currentPassword,
          newPassword: form.newPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrors({
          currentPassword: data.message || "Failed to update password.",
        });
        return;
      }

      setIsSuccess(true);
      setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err: any) {
      setErrors({ currentPassword: "Network error — please try again." });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar userRole="user" permissions={permissions} />
      <AdminHeader />

      <main className="lg:ml-64 mt-16 p-4 sm:p-6 lg:p-8 flex-1">
        <div className="max-w-2xl mx-auto">
          {/* ── Header ── */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              Change Password
            </h1>
            <p className="text-gray-500 mt-1">
              Update your account password to keep your account secure
            </p>
          </div>

          {/* ── Card ── */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden">
            <div className="p-8 space-y-6">
              {isSuccess && <SuccessMessage />}

              <PasswordInput
                label="Current Password"
                name="currentPassword"
                value={form.currentPassword}
                onChange={handleChange}
                error={errors.currentPassword}
                placeholder="Enter your current password"
              />

              <div className="border-t border-gray-200" />

              <PasswordInput
                label="New Password"
                name="newPassword"
                value={form.newPassword}
                onChange={handleChange}
                error={errors.newPassword}
                showStrength
                placeholder="Create a new password"
              />

              <PasswordInput
                label="Confirm New Password"
                name="confirmPassword"
                value={form.confirmPassword}
                onChange={handleChange}
                error={errors.confirmPassword}
                placeholder="Re-enter your new password"
              />

              {/* Requirements hint */}
              <div className="px-4 py-3.5 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg border border-gray-200">
                <p className="text-sm font-semibold text-gray-700 mb-3">
                  Password requirements:
                </p>
                <ul className="space-y-2">
                  {[
                    {
                      text: "At least 8 characters long",
                      met: form.newPassword.length >= 8,
                    },
                    {
                      text: "Contains uppercase and lowercase letters",
                      met:
                        /[A-Z]/.test(form.newPassword) &&
                        /[a-z]/.test(form.newPassword),
                    },
                    {
                      text: "Contains at least one number",
                      met: /[0-9]/.test(form.newPassword),
                    },
                    {
                      text: "Contains a special character (!@#$%^&*)",
                      met: /[^A-Za-z0-9]/.test(form.newPassword),
                    },
                  ].map((req, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <Check
                        size={16}
                        className={`transition-colors flex-shrink-0 ${req.met ? "text-emerald-500" : "text-gray-300"}`}
                      />
                      <span
                        className={`text-sm transition-colors ${req.met ? "text-emerald-700 font-medium" : "text-gray-500"}`}
                      >
                        {req.text}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Footer */}
            <div className="px-8 py-5 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => window.history.back()}
                className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm font-medium rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={isLoading}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition disabled:opacity-60 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
              >
                {isLoading ? "Updating..." : "Update Password"}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
