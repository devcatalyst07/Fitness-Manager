import React, { useEffect, useState } from "react";
import { X, UserPlus, ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";
import BrandLineGraph from "./BrandLineGraph";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://fitout-manager-api.vercel.app";

interface Brand {
  _id: string;
  name: string;
  description?: string;
}

interface Project {
  _id: string;
  projectName: string;
  status: string;
  budget?: number;
  spent?: number;
  completionPercent?: number;
  taskCount?: number;
  createdAt: string;
}

interface BrandTeamMember {
  _id: string;
  name: string;
  email: string;
}

interface BrandDashboardModalProps {
  brand: Brand;
  isOpen: boolean;
  onClose: () => void;
}

export default function BrandDashboardModal({
  brand,
  isOpen,
  onClose,
}: BrandDashboardModalProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);
  const [brandTeamMembers, setBrandTeamMembers] = useState<BrandTeamMember[]>(
    [],
  );
  const [isAddUserExpanded, setIsAddUserExpanded] = useState(false);

  // Form states
  const [newUserName, setNewUserName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [saving, setSaving] = useState(false);

  // Filter states
  const [selectedProjectForGraph, setSelectedProjectForGraph] =
    useState<string>("all");
  const [projectStatusFilter, setProjectStatusFilter] = useState<string>("all");

  useEffect(() => {
    if (isOpen && brand?._id) {
      fetchDashboardData();
      fetchBrandTeamMembers();
    }
  }, [isOpen, brand?._id]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${API_URL}/api/brands/${brand._id}/dashboard`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (response.ok) {
        const data = await response.json();
        setProjects(data.projects || []);
      }
    } catch (error) {
      console.error("Error fetching brand data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBrandTeamMembers = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/api/brands/${brand._id}/team`, {
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

  const handleAddUser = async () => {
    if (!newUserName.trim() || !newUserEmail.trim()) {
      alert("Please fill in all fields");
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/api/brands/${brand._id}/team`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newUserName,
          email: newUserEmail,
        }),
      });

      if (response.ok) {
        alert("User added successfully!");
        setNewUserName("");
        setNewUserEmail("");
        setIsAddUserExpanded(false);
        fetchBrandTeamMembers();
      } else {
        const error = await response.json();
        alert(error.message || "Failed to add user");
      }
    } catch (error) {
      console.error("Add user error:", error);
      alert("Failed to add user");
    } finally {
      setSaving(false);
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === "Completed") {
      return {
        text: "Completed",
        className: "bg-green-100 text-green-700",
      };
    }
    return {
      text: "Active",
      className: "bg-blue-100 text-blue-700",
    };
  };

  const getFilteredProjects = () => {
    if (projectStatusFilter === "all") {
      return projects;
    } else if (projectStatusFilter === "active") {
      return projects.filter((p) => p.status !== "Completed");
    } else if (projectStatusFilter === "completed") {
      return projects.filter((p) => p.status === "Completed");
    }
    return projects;
  };

  const filteredProjects = getFilteredProjects();

  const calculateProjectProgress = (project: Project) => {
    // Use task completion if available, otherwise fallback to 0
    return project.completionPercent || 0;
  };

  const handleProjectClick = (projectId: string) => {
    router.push(`/admin/projects/${projectId}`);
    onClose();
  };

  // Click outside to close
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white w-full max-w-5xl rounded-xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="sticky top-0 bg-white border-b px-8 py-6 flex items-center justify-between rounded-t-xl z-10">
          <h2 className="text-2xl font-bold text-gray-900">{brand.name}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <X size={28} />
          </button>
        </div>

        <div className="p-8">
          {loading ? (
            <div className="space-y-8 animate-pulse">
              <div className="bg-gray-100 rounded-lg h-80"></div>

              <div>
                <div className="h-6 bg-gray-100 rounded w-48 mb-6"></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="border rounded-xl p-6">
                      <div className="h-6 bg-gray-100 rounded w-3/4 mb-4"></div>
                      <div className="h-4 bg-gray-100 rounded w-1/2 mb-3"></div>
                      <div className="h-2 bg-gray-100 rounded w-full"></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : projects.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-gray-400 mb-6">
                <svg
                  className="w-20 h-20 mx-auto"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                No Projects Yet
              </h3>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                This brand doesn't have any projects yet. Create a project to
                get started.
              </p>
              <button
                onClick={onClose}
                className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
              >
                Close
              </button>
            </div>
          ) : (
            <>
              {/* Line Graph Section */}
              <div className="mb-8">
                <BrandLineGraph
                  projects={projects}
                />
              </div>

              {/* Projects & Tasks Section */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-gray-900">
                    Projects & Tasks
                  </h3>

                  <div className="relative">
                    <select
                      value={projectStatusFilter}
                      onChange={(e) => setProjectStatusFilter(e.target.value)}
                      className="appearance-none px-4 py-2 pr-10 border border-gray-300 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                      <option value="all">All Projects</option>
                      <option value="active">Active</option>
                      <option value="completed">Completed</option>
                    </select>
                    <ChevronDown
                      size={16}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                    />
                  </div>
                </div>

                {filteredProjects.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    No {projectStatusFilter} projects found
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {filteredProjects.map((project) => {
                      const progressPercent = calculateProjectProgress(project);
                      const statusBadge = getStatusBadge(project.status);

                      return (
                        <div
                          key={project._id}
                          onClick={() => handleProjectClick(project._id)}
                          className="border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all cursor-pointer bg-white"
                        >
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                <svg
                                  className="w-5 h-5 text-blue-600"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                                  />
                                </svg>
                              </div>
                              <div>
                                <h4 className="font-semibold text-gray-900 text-lg">
                                  {project.projectName}
                                </h4>
                              </div>
                            </div>
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-medium ${statusBadge.className}`}
                            >
                              {statusBadge.text}
                            </span>
                          </div>

                          <div className="mb-4">
                            <div className="flex items-center justify-between text-sm mb-2">
                              <div className="flex items-center gap-2 text-gray-600">
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
                                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                                  />
                                </svg>
                                <span>Progress</span>
                              </div>
                              <span className="font-medium text-gray-900">
                                {progressPercent.toFixed(0)}%
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2.5">
                              <div
                                className={`h-2.5 rounded-full transition-all duration-300 ${
                                  project.status === "Completed"
                                    ? "bg-green-500"
                                    : "bg-blue-500"
                                }`}
                                style={{ width: `${progressPercent}%` }}
                              ></div>
                            </div>
                          </div>

                          {project.budget && (
                            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
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
                                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                  />
                                </svg>
                                <span>Budget</span>
                              </div>
                              <span className="font-semibold text-gray-900">
                                ₱{project.budget.toLocaleString()}
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Add User Section */}
              <div className="mt-8">
                <div className="border border-gray-200 rounded-xl bg-white overflow-hidden">
                  <button
                    onClick={() => setIsAddUserExpanded(!isAddUserExpanded)}
                    className="w-full flex items-center justify-between p-6 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <UserPlus size={22} className="text-blue-600" />
                      <span className="font-semibold text-gray-900 text-lg">
                        Add New User
                      </span>
                    </div>
                    <X
                      size={20}
                      className={`text-gray-400 transform transition-transform ${
                        isAddUserExpanded ? "rotate-45" : ""
                      }`}
                    />
                  </button>

                  {isAddUserExpanded && (
                    <div className="border-t border-gray-200 p-6 bg-gray-50">
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Name
                          </label>
                          <input
                            type="text"
                            value={newUserName}
                            onChange={(e) => setNewUserName(e.target.value)}
                            placeholder="Enter user name"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Email
                          </label>
                          <input
                            type="email"
                            value={newUserEmail}
                            onChange={(e) => setNewUserEmail(e.target.value)}
                            placeholder="Enter user email"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        <div className="flex gap-3 pt-2">
                          <button
                            onClick={handleAddUser}
                            disabled={saving}
                            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
                          >
                            {saving ? "Adding..." : "Add User"}
                          </button>
                          <button
                            onClick={() => setIsAddUserExpanded(false)}
                            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}