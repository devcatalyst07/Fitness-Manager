"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Pencil,
  Mail,
  User,
  Shield,
  Clock,
  FolderKanban,
  Lock,
} from "lucide-react";
import AdminSidebar from "@/components/AdminSidebar";
import AdminHeader from "@/components/AdminHeader";
import { Permission } from "@/utils/permissions";
import { apiClient } from "@/lib/axios";
import { useAuth } from "@/context/AuthContext";

// ─── Types ────────────────────────────────────────────────────────────────────
interface BrandRole {
  brandName: string;
  role: string;
}

interface UserProfileData {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  profilePhoto?: string;
  brandRoles: BrandRole[]; // roles per brand — not editable
  updatedAt?: string;
}

// ─── Role Badge Color Map ─────────────────────────────────────────────────────
function getRoleBadgeStyles(role: string) {
  const map: Record<string, { bg: string; text: string; border: string }> = {
    "Project Manager": {
      bg: "bg-blue-50",
      text: "text-blue-600",
      border: "border-blue-100",
    },
    Member: {
      bg: "bg-emerald-50",
      text: "text-emerald-600",
      border: "border-emerald-100",
    },
    Viewer: {
      bg: "bg-gray-50",
      text: "text-gray-600",
      border: "border-gray-200",
    },
    "Site Supervisor": {
      bg: "bg-amber-50",
      text: "text-amber-600",
      border: "border-amber-100",
    },
    Accountant: {
      bg: "bg-purple-50",
      text: "text-purple-600",
      border: "border-purple-100",
    },
  };
  return (
    map[role] || {
      bg: "bg-indigo-50",
      text: "text-indigo-600",
      border: "border-indigo-100",
    }
  );
}

function getCachedPermissions(): Permission[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem("rolePermissions");
    return raw ? (JSON.parse(raw) as Permission[]) : [];
  } catch {
    return [];
  }
}

// ─── Avatar Component ─────────────────────────────────────────────────────────
function Avatar({
  photoUrl,
  initials,
  size = 96,
}: {
  photoUrl?: string;
  initials: string;
  size?: number;
}) {
  return (
    <div
      className="relative flex items-center justify-center rounded-full overflow-hidden"
      style={{
        width: size,
        height: size,
        background: photoUrl
          ? undefined
          : "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
      }}
    >
      {photoUrl ? (
        <img
          src={photoUrl}
          alt="Profile"
          className="w-full h-full object-cover"
        />
      ) : (
        <span
          className="text-white font-semibold"
          style={{ fontSize: size * 0.35 }}
        >
          {initials}
        </span>
      )}
    </div>
  );
}

// ─── Edit Profile Modal ───────────────────────────────────────────────────────
function EditProfileModal({
  isOpen,
  onClose,
  profile,
  onSave,
}: {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfileData;
  onSave: (updated: UserProfileData) => void;
}) {
  const [form, setForm] = useState({
    firstName: profile.firstName,
    lastName: profile.lastName,
    username: profile.username,
    email: profile.email,
  });
  const [photoPreview, setPhotoPreview] = useState<string | null>(
    profile.profilePhoto || null,
  );
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setForm({
      firstName: profile.firstName,
      lastName: profile.lastName,
      username: profile.username,
      email: profile.email,
    });
    setPhotoPreview(profile.profilePhoto || null);
  }, [profile]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError("");
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setPhotoPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    setError("");
    try {
      const firstName = form.firstName.trim() || profile.firstName;
      const lastName = form.lastName.trim() || profile.lastName;
      const username = form.username.trim() || profile.username;
      const email = form.email.trim() || profile.email;

      const formData = new FormData();
      if (firstName) formData.append("firstName", firstName);
      if (lastName) formData.append("lastName", lastName);
      if (username) formData.append("username", username);
      if (email) formData.append("email", email);
      if (selectedFile) {
        formData.append("profilePhoto", selectedFile);
      }

      const data = await apiClient.put("/api/profile", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      onSave({
        ...profile,
        firstName: data.profile.firstName,
        lastName: data.profile.lastName,
        username: data.profile.username,
        email: data.profile.email,
        profilePhoto: data.profile.profilePhoto || undefined,
        updatedAt: new Date(data.profile.updatedAt).toLocaleDateString(
          "en-US",
          {
            year: "numeric",
            month: "long",
            day: "numeric",
          },
        ),
      });

      // Update localStorage and dispatch event to update header
      localStorage.setItem(
        "userName",
        `${data.profile.firstName} ${data.profile.lastName}`,
      );
      window.dispatchEvent(new Event("profileUpdated"));

      setSelectedFile(null);
      onClose();
    } catch (err: any) {
      setError(
        err?.response?.data?.message || "Network error — please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const initials =
    `${form.firstName[0] || ""}${form.lastName[0] || ""}`.toUpperCase();

  return (
    <>
      <div
        className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      />

      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col relative"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header - Sticky */}
          <div className="flex items-start justify-between mb-6 p-8 pb-0 sticky top-0 bg-white z-10">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Edit Profile</h2>
              <p className="text-sm text-gray-500 mt-1">
                Update your personal information
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors text-2xl leading-none flex-shrink-0"
            >
              ✕
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="overflow-y-auto flex-1">
            <div className="px-8">
              {/* Photo Upload */}
              <div className="flex flex-col items-center mb-8 pb-8 border-b border-gray-200">
                <div className="relative">
                  <Avatar
                    photoUrl={photoPreview || undefined}
                    initials={initials}
                    size={100}
                  />
                  <label className="absolute -bottom-1 -right-1 bg-indigo-600 hover:bg-indigo-700 border-2 border-white rounded-full w-8 h-8 flex items-center justify-center cursor-pointer shadow-lg transition">
                    <Pencil size={14} className="text-white" />
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handlePhotoChange}
                    />
                  </label>
                </div>
                <span className="text-sm text-indigo-600 font-medium mt-3 cursor-pointer hover:text-indigo-700">
                  Change Photo
                </span>
              </div>

              {/* Form Fields */}
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Username
                  </label>
                  <input
                    name="username"
                    value={form.username}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      First Name
                    </label>
                    <input
                      name="firstName"
                      value={form.firstName}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Last Name
                    </label>
                    <input
                      name="lastName"
                      value={form.lastName}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                  />
                </div>
              </div>

              {error && (
                <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-600 text-sm font-medium">{error}</p>
                </div>
              )}
            </div>
          </div>

          {/* Buttons - Sticky Footer */}
          <div className="flex justify-end gap-3 mt-8 p-8 pt-6 border-t border-gray-200 bg-white sticky bottom-0 z-10">
            <button
              onClick={onClose}
              className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition disabled:opacity-60 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
            >
              {isLoading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Main User Profile Page ───────────────────────────────────────────────────
export default function UserProfile() {
  const router = useRouter();
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfileData>({
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    updatedAt: "",
    brandRoles: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [permissions, setPermissions] =
    useState<Permission[]>(getCachedPermissions);
  const [roleName, setRoleName] = useState<string>("Member");

  useEffect(() => {
    const fetchAll = async () => {
      // Guard: Don't fetch if user is not authenticated
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        const roleId = user?.roleId ?? localStorage.getItem("roleId");

        // ── 1. Fetch base profile ──
        const profileData = await apiClient.get("/api/profile");

        // ── 2. Fetch user's projects (already filtered by backend for user role) ──
        //    Each project has team members with populated roleId → { name, brandId }
        //    We extract unique brand+role combos from there.
        let brandRoles: BrandRole[] = [];
        try {
          const projects = await apiClient.get("/api/projects");

          // projects is an array; each project may have a `brand` field (name)
          // and the current user's team entry has roleId.name
          // Deduplicate by brandName
          const seen = new Set<string>();
          for (const proj of projects) {
            const brandName = proj.brand?.name || proj.brandName || "General";
            if (!seen.has(brandName)) {
              seen.add(brandName);
              // The user's role in this project — populated from roleId
              const roleName = proj.userRole || proj.teamRole || "Member";
              brandRoles.push({ brandName, role: roleName });
            }
          }
        } catch {
          // non-blocking — brandRoles stays empty if projects fetch fails
        }

        setProfile({
          firstName: profileData.firstName || "",
          lastName: profileData.lastName || "",
          username: profileData.username || "",
          email: profileData.email || "",
          profilePhoto: profileData.profilePhoto || undefined,
          updatedAt: profileData.updatedAt
            ? new Date(profileData.updatedAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })
            : "",
          brandRoles,
        });

        if (roleId) {
          try {
            const roleData = await apiClient.get(`/api/roles/${roleId}`);
            setPermissions(roleData.permissions || []);
            if (roleData?.name) {
              setRoleName(roleData.name);
            }
            try {
              localStorage.setItem(
                "rolePermissions",
                JSON.stringify(roleData.permissions || []),
              );
            } catch {
              // Ignore storage errors
            }
          } catch {
            // non-blocking — role data stays default if fetch fails
          }
        }
      } catch (err) {
        console.error("Failed to fetch user profile:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const initials =
    `${profile.firstName?.[0] || ""}${profile.lastName?.[0] || ""}`.toUpperCase();
  const primaryRole = roleName || profile.brandRoles[0]?.role || "Member";

  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <AdminSidebar userRole="user" permissions={permissions} />
        <AdminHeader />
        <main className="lg:ml-64 mt-16 p-4 sm:p-6 lg:p-8 flex-1">
          <div className="text-center text-gray-400 text-sm mt-24">
            Loading profile…
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar userRole="user" permissions={permissions} />
      <AdminHeader />

      <main className="lg:ml-64 mt-16 p-4 sm:p-6 lg:p-8 flex-1">
        {/* ── Page Header ── */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Profile Setting
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Manage your personal information and account settings
              </p>
            </div>
            <button
              onClick={() => setIsEditOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition shadow-md hover:shadow-lg whitespace-nowrap"
            >
              <Pencil size={16} />
              Edit Profile
            </button>
          </div>
        </div>

        {/* ── Two Column Layout ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ── LEFT COL — Avatar Card ── */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col h-full">
            <div className="flex flex-col items-center flex-1 justify-center px-6 py-8">
              <Avatar
                photoUrl={profile.profilePhoto}
                initials={initials}
                size={112}
              />
              <h2 className="text-xl font-semibold text-gray-900">
                {profile.firstName} {profile.lastName}
              </h2>
              <p className="text-sm text-gray-500 mt-2">@{profile.username}</p>

              {/* Primary Role Badge */}
              <div className="mt-6">
                <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-200">
                  <Shield size={13} className="text-blue-600" />
                  {primaryRole}
                </span>
              </div>
            </div>

            {/* Last Updated footer */}
            <div className="px-6 py-5 bg-gray-50 border-t border-gray-100">
              <p className="flex items-center gap-1.5 text-xs text-gray-500">
                <Clock size={13} />
                Last updated: {profile.updatedAt || "—"}
              </p>
            </div>
          </div>

          {/* ── RIGHT COL — Info Cards ── */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Information Card */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-100">
                <h3 className="text-sm font-semibold text-gray-800">
                  Personal Information
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Your basic profile details
                </p>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* First Name */}
                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-xs text-gray-400 uppercase tracking-wider mb-2">
                      <User size={13} />
                      <span>First Name</span>
                    </div>
                    <p className="text-sm text-gray-800 font-semibold">
                      {profile.firstName || "—"}
                    </p>
                  </div>

                  {/* Last Name */}
                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-xs text-gray-400 uppercase tracking-wider mb-2">
                      <User size={13} />
                      <span>Last Name</span>
                    </div>
                    <p className="text-sm text-gray-800 font-semibold">
                      {profile.lastName || "—"}
                    </p>
                  </div>

                  {/* Email — full width */}
                  <div className="bg-gray-50 rounded-xl p-4 col-span-2">
                    <div className="flex items-center gap-2 text-xs text-gray-400 uppercase tracking-wider mb-2">
                      <Mail size={13} />
                      <span>Email Address</span>
                    </div>
                    <p className="text-sm text-gray-800 font-semibold truncate">
                      {profile.email || "—"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Account Details Card */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-100">
                <h3 className="text-sm font-semibold text-gray-800">
                  Account Details
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Role and access information
                </p>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* Username */}
                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-xs text-gray-400 uppercase tracking-wider mb-2">
                      <User size={13} />
                      <span>Username</span>
                    </div>
                    <p className="text-sm text-gray-800 font-semibold">
                      @{profile.username || "—"}
                    </p>
                  </div>

                  {/* Role */}
                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-xs text-gray-400 uppercase tracking-wider mb-2">
                      <Shield size={13} />
                      <span>Role</span>
                    </div>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-50 text-black text-xs font-semibold border border-indigo-100">
                      {primaryRole}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions Card */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-100">
                <h3 className="text-sm font-semibold text-gray-800">
                  Quick Actions
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Manage your account security
                </p>
              </div>

              <div className="p-6 flex flex-wrap gap-3">
                <button
                  onClick={() => router.push("/user/settings/change-password")}
                  className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-sm text-gray-700 font-medium rounded-lg transition"
                >
                  <Lock size={15} className="text-indigo-600" />
                  Change Password
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Edit Modal */}
        <EditProfileModal
          isOpen={isEditOpen}
          onClose={() => setIsEditOpen(false)}
          profile={profile}
          onSave={setProfile}
        />
      </main>
    </div>
  );
}
