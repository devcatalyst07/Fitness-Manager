import React, { useEffect, useState } from "react";
import { X, UserPlus, ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";
import BrandLineGraph from "./BrandLineGraph";
import { apiClient } from "@/lib/axios";

interface Brand {
  _id: string;
  name: string;
  description?: string;
}

interface Project {
  _id: string;
  projectName: string;
  status: string;
  isCompleted?: boolean;
  budget?: number;
  spent?: number;
  completionPercent?: number;
  taskCount?: number;
  completedTaskCount?: number;
  createdAt: string;
  updatedAt?: string;
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
  canAddUser?: boolean;
}

export default function BrandDashboardModal({
  brand,
  isOpen,
  onClose,
  canAddUser = false,
}: BrandDashboardModalProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);
  const [brandTeamMembers, setBrandTeamMembers] = useState<BrandTeamMember[]>([]);
  const [isAddUserExpanded, setIsAddUserExpanded] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState("");
  const [saving, setSaving] = useState(false);
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
      const data = await apiClient.get(`/api/brands/${brand._id}/dashboard`);
      setProjects(data.projects || []);
    } catch (error) {
      console.error("Error fetching brand data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBrandTeamMembers = async () => {
    try {
      const data = await apiClient.get(`/api/brands/${brand._id}/team`);
      setBrandTeamMembers(data || []);
    } catch (error) {
      console.error("Error fetching brand team members:", error);
    }
  };

  const handleAddUser = async () => {
    if (!newUserEmail.trim()) {
      alert("Please fill in email");
      return;
    }

    setSaving(true);
    try {
      await apiClient.post(`/api/brands/${brand._id}/team`, {
        name: newUserEmail.split("@")[0],
        email: newUserEmail,
      });
      alert("User added successfully!");
      setNewUserEmail("");
      setIsAddUserExpanded(false);
      fetchBrandTeamMembers();
    } catch (error: any) {
      console.error("Add user error:", error);
      const message = error?.response?.data?.message || "Failed to add user";
      alert(message);
    } finally {
      setSaving(false);
    }
  };

  const getStatusBadge = (project: Project) => {
    const allTasksCompleted =
      project.taskCount !== undefined &&
      project.taskCount > 0 &&
      project.completedTaskCount === project.taskCount;

    if (allTasksCompleted || project.isCompleted || project.status === "Completed") {
      return { text: "Completed", className: "bg-green-100 text-green-700" };
    }
    return { text: "Active", className: "bg-blue-100 text-blue-700" };
  };

  const getFilteredProjects = () => {
    if (projectStatusFilter === "all") return projects;
    if (projectStatusFilter === "active") {
      return projects.filter((p) => {
        const allTasksCompleted = p.taskCount !== undefined && p.taskCount > 0 && p.completedTaskCount === p.taskCount;
        return !allTasksCompleted && !p.isCompleted && p.status !== "Completed";
      });
    }
    if (projectStatusFilter === "completed") {
      return projects.filter((p) => {
        const allTasksCompleted = p.taskCount !== undefined && p.taskCount > 0 && p.completedTaskCount === p.taskCount;
        return allTasksCompleted || p.isCompleted || p.status === "Completed";
      });
    }
    return projects;
  };

  const filteredProjects = getFilteredProjects();

  const handleProjectClick = (projectId: string) => {
    router.push(`/admin/projects/${projectId}`);
    onClose();
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={handleBackdropClick}>
      <div className="bg-white w-full max-w-5xl rounded-xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="sticky top-0 bg-white border-b px-8 py-6 flex items-center justify-between rounded-t-xl z-10">
          <h2 className="text-2xl font-bold text-gray-900">{brand.name}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">
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
                <svg className="w-20 h-20 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">No Projects Yet</h3>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">This brand doesn't have any projects yet. Create a project to get started.</p>
              <button onClick={onClose} className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium">Close</button>
            </div>
          ) : (
            <>
              <div className="mb-8">
                <BrandLineGraph projects={projects} />
              </div>

              <div className="mb-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-gray-900">Projects & Tasks</h3>
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
                    <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                {filteredProjects.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">No {projectStatusFilter} projects found</div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {filteredProjects.map((project) => {
                      const progressPercent = project.completionPercent || 0;
                      const statusBadge = getStatusBadge(project);
                      return (
                        <div key={project._id} onClick={() => handleProjectClick(project._id)} className="border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all cursor-pointer bg-white">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                </svg>
                              </div>
                              <h4 className="font-semibold text-gray-900 text-lg">{project.projectName}</h4>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusBadge.className}`}>{statusBadge.text}</span>
                          </div>
                          <div className="mb-4">
                            <div className="flex items-center justify-between text-sm mb-2">
                              <span className="text-gray-600">Progress</span>
                              <span className="font-medium text-gray-900">{progressPercent}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2.5">
                              <div className={`h-2.5 rounded-full transition-all duration-300 ${statusBadge.text === "Completed" ? "bg-green-500" : "bg-blue-500"}`} style={{ width: `${progressPercent}%` }}></div>
                            </div>
                          </div>
                          {project.budget !== undefined && project.budget > 0 && (
                            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                              <span className="text-sm text-gray-600">Budget</span>
                              <span className="font-semibold text-gray-900">₱{project.budget.toLocaleString()}</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {canAddUser && (
                <div className="mt-8">
                  <div className="border border-gray-200 rounded-xl bg-white overflow-hidden">
                    <button type="button" onClick={() => setIsAddUserExpanded(!isAddUserExpanded)} className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition">
                      <div className="flex items-center gap-3">
                        <div className="bg-blue-50 p-2 rounded-md"><UserPlus size={18} className="text-blue-600" /></div>
                        <div>
                          <div className="font-semibold text-gray-900 text-sm">Add New User</div>
                          <div className="text-xs text-gray-500">Invite a team member to this brand</div>
                        </div>
                      </div>
                      <X size={20} className={`text-gray-400 transform transition-transform ${isAddUserExpanded ? "rotate-45" : ""}`} />
                    </button>
                    {isAddUserExpanded && (
                      <div className="border-t border-gray-100 p-6 bg-gray-50">
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                            <input type="email" value={newUserEmail} onChange={(e) => setNewUserEmail(e.target.value)} placeholder="name@company.com" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                            <p className="text-xs text-gray-500 mt-2">The invited user will receive an email to join this brand's team.</p>
                          </div>
                          <div className="flex items-center justify-end gap-3 pt-2">
                            <button type="button" onClick={() => setIsAddUserExpanded(false)} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-100 transition-colors font-medium">Cancel</button>
                            <button type="button" onClick={handleAddUser} disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium disabled:opacity-50">
                              {saving ? "Adding..." : "Add User"}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}