"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, UserPlus, Search, X } from "lucide-react";
import AdminSidebar from "@/components/AdminSidebar";
import AdminHeader from "@/components/AdminHeader";
import FitoutLoadingSpinner from "@/components/FitoutLoadingSpinner";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://fitout-manager-api.vercel.app";

interface TeamMember {
  _id: string;
  userId: {
    _id: string;
    name: string;
    email: string;
  };
  role: "ProjectManager" | "Finance" | "Vendor" | "Designer" | "Member";
  status: "active" | "pending" | "removed";
  createdAt: string;
}

export default function ProjectTeamPage() {
  const router = useRouter();
  const params = useParams();
  const [pathname, setPathname] = useState("/admin/projects");
  const [loading, setLoading] = useState(true);
  const [isVerified, setIsVerified] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [projectName, setProjectName] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    userEmail: "",
    role: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("userRole");

    if (!token || role !== "admin") {
      localStorage.clear();
      router.replace("/");
    } else {
      setIsVerified(true);
      fetchProject();
      fetchTeamMembers();
    }
  }, [params.id, router]);

  const fetchProject = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/api/projects/${params.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setProjectName(data.projectName);
      }
    } catch (error) {
      console.error("Error fetching project:", error);
    }
  };

  const fetchTeamMembers = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${API_URL}/api/projects/${params.id}/team`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setTeamMembers(data);
      }
    } catch (error) {
      console.error("Error fetching team members:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = async () => {
    if (!formData.userEmail) {
      alert("Please enter a user email");
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${API_URL}/api/projects/${params.id}/team`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(formData),
        }
      );

      if (response.ok) {
        await fetchTeamMembers();
        setIsAddModalOpen(false);
        setFormData({ userEmail: "", role: "" });
        alert("Team member added successfully!");
      } else {
        const error = await response.json();
        alert(error.message || "Failed to add team member");
      }
    } catch (error) {
      console.error("Add team member error:", error);
      alert("Failed to add team member");
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm("Are you sure you want to remove this team member?")) return;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${API_URL}/api/projects/${params.id}/team/${memberId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.ok) {
        await fetchTeamMembers();
        alert("Team member removed successfully!");
      } else {
        const error = await response.json();
        alert(error.message || "Failed to remove team member");
      }
    } catch (error) {
      console.error("Remove team member error:", error);
      alert("Failed to remove team member");
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "ProjectManager":
        return "bg-blue-100 text-blue-700 border border-blue-300";
      case "Finance":
        return "bg-green-100 text-green-700 border border-green-300";
      case "Vendor":
        return "bg-orange-100 text-orange-700 border border-orange-300";
      case "Designer":
        return "bg-purple-100 text-purple-700 border border-purple-300";
      default:
        return "bg-gray-100 text-gray-700 border border-gray-300";
    }
  };

  const getStatusColor = (status: string) => {
    return status === "active"
      ? "bg-green-100 text-green-700"
      : "bg-yellow-100 text-yellow-700";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "numeric",
      day: "numeric",
      year: "numeric",
    });
  };

  const getInitials = (name: string) => {
    const parts = name.split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const filteredMembers = teamMembers.filter(
    (member) =>
      member.userId.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.userId.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isVerified || loading) {
    return <FitoutLoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminSidebar pathname={pathname} setPathname={setPathname} />
      <AdminHeader />

      <main className="lg:ml-64 mt-16 p-4 sm:p-6 lg:p-8">
        <div className="mb-6">
          <button
            onClick={() => router.push(`/admin/projects/${params.id}`)}
            className="text-gray-600 hover:text-black mb-4 flex items-center gap-2"
          >
            <ArrowLeft size={20} />
            <span>{projectName || "Back to Project"}</span>
          </button>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                Team
              </h1>
              <p className="text-sm text-gray-600">
                Team members for this project
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">
                👥 {teamMembers.length} Members
              </span>
              <button
                onClick={() => {
                  setFormData({ userEmail: "", role: "" });
                  setIsAddModalOpen(true);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <UserPlus size={18} />
                <span>Add Member</span>
              </button>
            </div>
          </div>
        </div>

        <div className="mb-6 border-b border-gray-200">
          <div className="flex gap-6">
            {["Overview", "Tasks", "Budget", "Documents", "Team"].map((tab) => (
              <button
                key={tab}
                className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
                  tab === "Team"
                    ? "border-black text-black"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
                onClick={() => {
                  if (tab === "Overview")
                    router.push(`/admin/projects/${params.id}`);
                  if (tab === "Tasks")
                    router.push(`/admin/projects/${params.id}/tasks`);
                  if (tab === "Budget")
                    router.push(`/admin/projects/${params.id}/budget`);
                  if (tab === "Documents")
                    router.push(`/admin/projects/${params.id}/documents`);
                }}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={20}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search team members..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-500">
              {filteredMembers.length} members
            </span>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <svg
                className="w-5 h-5 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
              <h2 className="text-lg font-semibold text-gray-900">
                Team Members
              </h2>
            </div>
            <p className="text-sm text-gray-600 mt-1">
              Users assigned to this project with their roles and status
            </p>
          </div>

          {filteredMembers.length === 0 ? (
            <div className="p-12 text-center">
              <svg
                className="w-16 h-16 mx-auto text-gray-300 mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {teamMembers.length === 0
                  ? "No team members yet"
                  : "No members found"}
              </h3>
              <p className="text-gray-600 mb-4">
                {teamMembers.length === 0
                  ? "Add team members to collaborate on this project"
                  : "Try adjusting your search query"}
              </p>
              {teamMembers.length === 0 && (
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
                >
                  <UserPlus size={20} />
                  <span>Add Team Member</span>
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Joined
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredMembers.map((member) => (
                    <tr key={member._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                            {getInitials(member.userId.name)}
                          </div>
                          <span className="font-medium text-gray-900">
                            {member.userId.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getRoleColor(
                            member.role
                          )}`}
                        >
                          {member.role}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                            />
                          </svg>
                          {member.userId.email}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                            member.status
                          )}`}
                        >
                          {member.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {formatDate(member.createdAt)}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleRemoveMember(member._id)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-2">
            <svg
              className="w-5 h-5 text-blue-600 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div>
              <h4 className="font-medium text-blue-900 mb-1">
                Project Team Features
              </h4>
              <p className="text-sm text-blue-700">
                Team members are assigned specific roles to control access and
                permissions within this project. For comprehensive user
                management, visit Admin → Users to manage all system users.
              </p>
            </div>
          </div>
        </div>

        {/* Add Member Modal */}
        {isAddModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white w-full max-w-md rounded-lg">
              <div className="p-8 text-black">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold">Add Team Member</h2>
                  <button
                    onClick={() => setIsAddModalOpen(false)}
                    className="text-gray-400 hover:text-black"
                  >
                    <X size={24} />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      User Email *
                    </label>
                    <input
                      type="email"
                      value={formData.userEmail}
                      onChange={(e) =>
                        setFormData({ ...formData, userEmail: e.target.value })
                      }
                      placeholder="user@example.com"
                      className="w-full px-4 py-2 border rounded-lg"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Enter the email of an existing user
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Role
                    </label>
                    <select
                      value={formData.role}
                      onChange={(e) =>
                        setFormData({ ...formData, role: e.target.value })
                      }
                      className="w-full px-4 py-2 border rounded-lg"
                    >
                      <option value="" disabled>
                        -- Choose Role --
                      </option>
                      <option value="Member">Member</option>
                      <option value="ProjectManager">Project Manager</option>
                      <option value="Finance">Finance</option>
                      <option value="Designer">Designer</option>
                      <option value="Vendor">Vendor</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setIsAddModalOpen(false)}
                    className="flex-1 px-4 py-3 border rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddMember}
                    disabled={saving}
                    className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg"
                  >
                    {saving ? "Adding..." : "Add Member"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
