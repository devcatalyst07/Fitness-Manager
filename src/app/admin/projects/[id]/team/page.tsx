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

interface BrandTeamMember {
  _id: string;
  name: string;
  email: string;
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
  const [projectBrand, setProjectBrand] = useState("");
  const [brandId, setBrandId] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [brandTeamMembers, setBrandTeamMembers] = useState<BrandTeamMember[]>(
    [],
  );
  const [formData, setFormData] = useState({
    selectedUser: "",
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
        setProjectBrand(data.brand);

        // Fetch brand details to get brand ID
        await fetchBrandDetails(data.brand);
      }
    } catch (error) {
      console.error("Error fetching project:", error);
    }
  };

  const fetchBrandDetails = async (brandName: string) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/api/brands`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const brands = await response.json();
        const brand = brands.find((b: any) => b.name === brandName);

        if (brand) {
          setBrandId(brand._id);
          await fetchBrandTeamMembers(brand._id);
        }
      }
    } catch (error) {
      console.error("Error fetching brand details:", error);
    }
  };

  const fetchBrandTeamMembers = async (bId: string) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/api/brands/${bId}/team`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setBrandTeamMembers(data || []);
      }
    } catch (error) {
      console.error("Error fetching brand team members:", error);
    }
  };

  const fetchTeamMembers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${API_URL}/api/projects/${params.id}/team`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
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
    if (!formData.selectedUser || !formData.role) {
      alert("Please select a user and role");
      return;
    }

    const selectedMember = brandTeamMembers.find(
      (m) => m.email === formData.selectedUser,
    );

    if (!selectedMember) {
      alert("Selected user not found");
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
          body: JSON.stringify({
            userEmail: selectedMember.email,
            userName: selectedMember.name,
            role: formData.role,
          }),
        },
      );

      if (response.ok) {
        alert("Team member added successfully!");
        setFormData({ selectedUser: "", role: "" });
        setIsAddModalOpen(false);
        fetchTeamMembers();
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
    if (!confirm("Are you sure you want to remove this team member?")) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${API_URL}/api/projects/${params.id}/team/${memberId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (response.ok) {
        alert("Team member removed successfully");
        fetchTeamMembers();
      } else {
        alert("Failed to remove team member");
      }
    } catch (error) {
      console.error("Remove team member error:", error);
      alert("Failed to remove team member");
    }
  };

  const filteredMembers = teamMembers.filter(
    (member) =>
      member.userId.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.userId.email.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  if (!isVerified || loading) {
    return <FitoutLoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminSidebar pathname={pathname} setPathname={setPathname} />
      <AdminHeader />

      <main className="lg:ml-64 mt-16 p-8">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft size={20} />
          <span>{projectName}</span>
        </button>

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Team</h1>
            <p className="text-gray-600 mt-1">Team members for this project</p>
            {projectBrand && (
              <p className="text-sm text-gray-500 mt-1">
                Brand: <span className="font-medium">{projectBrand}</span>
              </p>
            )}
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-gray-600">
              <UserPlus size={20} />
              <span>{teamMembers.length} Members</span>
            </div>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
            >
              <UserPlus size={20} />
              <span>Add Member</span>
            </button>
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
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-6">
            <UserPlus size={20} className="text-gray-700" />
            <h2 className="text-lg font-semibold text-gray-900">
              Team Members
            </h2>
          </div>
          <p className="text-sm text-gray-600 mb-6">
            Users assigned to this project with their roles and status
          </p>

          {filteredMembers.length === 0 ? (
            <div className="text-center py-12">
              <UserPlus size={48} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No team members yet
              </h3>
              <p className="text-gray-600 mb-6">
                Add team members to collaborate on this project
              </p>
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
              >
                <UserPlus size={20} />
                <span>Add Team Member</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredMembers.map((member) => (
                <div
                  key={member._id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-semibold text-lg">
                        {member.userId.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {member.userId.name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {member.userId.email}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                      {member.role}
                    </span>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        member.status === "active"
                          ? "bg-green-100 text-green-700"
                          : member.status === "pending"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {member.status}
                    </span>
                    <button
                      onClick={() => handleRemoveMember(member._id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <X size={20} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Add Member Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                Add Team Member
              </h2>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  User <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.selectedUser}
                  onChange={(e) =>
                    setFormData({ ...formData, selectedUser: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Select User --</option>
                  {brandTeamMembers.map((member) => (
                    <option key={member._id} value={member.email}>
                      {member.name} ({member.email})
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Users from {projectBrand} brand
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Role <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.role}
                  onChange={(e) =>
                    setFormData({ ...formData, role: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Choose Role --</option>
                  <option value="ProjectManager">Project Manager</option>
                  <option value="Finance">Finance</option>
                  <option value="Vendor">Vendor</option>
                  <option value="Designer">Designer</option>
                  <option value="Member">Member</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddMember}
                  disabled={saving}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300"
                >
                  {saving ? "Adding..." : "Add Member"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}