"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Mail, UserCheck, UserX, Shield } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { apiClient } from "@/lib/axios";
import AdminSidebar from "@/components/AdminSidebar";
import AdminHeader from "@/components/AdminHeader";
import FitoutLoadingSpinner from "@/components/FitoutLoadingSpinner";
import { hasPermission } from "@/utils/permissions";

interface Permission { id: string; label: string; checked: boolean; children?: Permission[]; }
interface RoleData { _id: string; name: string; permissions: Permission[]; }
interface TeamMember { _id: string; userId: { _id: string; name: string; email: string; }; roleId: { _id: string; name: string; }; status: string; createdAt: string; }

export default function UserProjectTeamPage() {
  const router = useRouter();
  const params = useParams();
  const { user, loading: authLoading } = useAuth();

  const [pathname, setPathname] = useState("/user/projects");
  const [loading, setLoading] = useState(true);
  const [roleData, setRoleData] = useState<RoleData | null>(null);
  const [projectName, setProjectName] = useState("");
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [newMemberRoleId, setNewMemberRoleId] = useState("");
  const [roles, setRoles] = useState<any[]>([]);

  useEffect(() => {
    if (!authLoading && !user) { router.replace("/"); return; }
    if (!authLoading && user && user.role === "admin") { router.replace(`/admin/projects/${params.id}/team`); return; }
  }, [user, authLoading, router, params.id]);

  useEffect(() => {
    if (user && user.role === "user" && params.id) fetchRolePermissions();
  }, [user, params.id]);

  const fetchRolePermissions = async () => {
    try {
      let roleId = (user as any)?.roleId;
      if (!roleId) { try { const p = await apiClient.get("/api/auth/me"); roleId = p?.roleId; } catch {} }
      if (roleId) {
        const data = await apiClient.get(`/api/roles/${roleId}`);
        setRoleData(data);
        if (!hasPermission("projects-view-details-team", data.permissions)) { alert("You do not have permission to access Team."); router.replace("/user/projects"); return; }
      }
      fetchProject(); fetchTeamMembers(); fetchRoles();
    } catch (error) { console.error("Error fetching permissions:", error); fetchProject(); fetchTeamMembers(); fetchRoles(); }
    finally { setLoading(false); }
  };

  const fetchProject = async () => {
    try { const data = await apiClient.get(`/api/projects/${params.id}`); setProjectName(data.projectName); }
    catch (error) { console.error("Error fetching project:", error); }
  };

  const fetchTeamMembers = async () => {
    try { const data = await apiClient.get(`/api/projects/${params.id}/team`); setTeamMembers(data); }
    catch (error) { console.error("Error fetching team members:", error); }
  };

  const fetchRoles = async () => {
    try { const data = await apiClient.get("/api/roles"); setRoles(data); }
    catch (error) { console.error("Error fetching roles:", error); }
  };

  const handleAddMember = async () => {
    if (!newMemberEmail || !newMemberRoleId) { alert("Please enter email and select a role"); return; }
    try {
      await apiClient.post(`/api/projects/${params.id}/team`, { userEmail: newMemberEmail, roleId: newMemberRoleId });
      alert("Team member added successfully!");
      setNewMemberEmail(""); setNewMemberRoleId(""); setIsAddModalOpen(false);
      fetchTeamMembers();
    } catch (error: any) { alert(error?.response?.data?.message || "Failed to add team member"); }
  };

  if (authLoading || loading) return <FitoutLoadingSpinner />;
  if (!user || user.role !== "user") return <FitoutLoadingSpinner />;

  const permissions = roleData?.permissions || [];
  const hasRoleData = !!roleData;
  const canAddMember = !hasRoleData || hasPermission("projects-team-add", permissions);
  const canViewOverview = !hasRoleData || hasPermission("projects-view-details-overview", permissions);
  const canViewTasks = !hasRoleData || hasPermission("projects-view-details-task", permissions);
  const canViewBudget = !hasRoleData || hasPermission("projects-view-details-budget", permissions);
  const canViewDocuments = !hasRoleData || hasPermission("projects-view-details-documents", permissions);

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminSidebar pathname={pathname} setPathname={setPathname} userRole="user" permissions={permissions} />
      <AdminHeader />

      <main className="lg:ml-64 mt-16 p-4 sm:p-6 lg:p-8">
        <div className="mb-6">
          <button onClick={() => router.push(`/user/projects/${params.id}`)} className="text-gray-600 hover:text-black mb-4 flex items-center gap-2"><ArrowLeft size={20} /><span>{projectName || "Back to Project"}</span></button>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Team</h1>
          {roleData && <p className="text-sm text-gray-600">Role: {roleData.name}</p>}
        </div>

        <div className="mb-6 border-b border-gray-200 overflow-x-auto">
          <div className="flex gap-6 whitespace-nowrap">
            {canViewOverview && <button onClick={() => router.push(`/user/projects/${params.id}`)} className="pb-3 px-1 text-sm font-medium border-b-2 border-transparent text-gray-500 hover:text-gray-700">Overview</button>}
            {canViewTasks && <button onClick={() => router.push(`/user/projects/${params.id}/tasks`)} className="pb-3 px-1 text-sm font-medium border-b-2 border-transparent text-gray-500 hover:text-gray-700">Tasks</button>}
            {canViewBudget && <button onClick={() => router.push(`/user/projects/${params.id}/budget`)} className="pb-3 px-1 text-sm font-medium border-b-2 border-transparent text-gray-500 hover:text-gray-700">Budget</button>}
            {canViewDocuments && <button onClick={() => router.push(`/user/projects/${params.id}/documents`)} className="pb-3 px-1 text-sm font-medium border-b-2 border-transparent text-gray-500 hover:text-gray-700">Documents</button>}
            <button className="pb-3 px-1 text-sm font-medium border-b-2 border-black text-black">Team</button>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Team Members ({teamMembers.length})</h2>
              {canAddMember && <button onClick={() => setIsAddModalOpen(true)} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"><UserCheck size={18} />Add Member</button>}
            </div>
          </div>

          {teamMembers.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {teamMembers.map((member) => (
                <div key={member._id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-lg">{member.userId.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}</div>
                      <div><p className="font-medium text-gray-900">{member.userId.name}</p><p className="text-sm text-gray-500 flex items-center gap-1"><Mail size={14} />{member.userId.email}</p></div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 px-3 py-1 bg-purple-50 border border-purple-200 rounded-lg"><Shield size={14} className="text-purple-600" /><span className="text-sm font-medium text-purple-700">{member.roleId.name}</span></div>
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${member.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}`}>{member.status === "active" ? <UserCheck size={14} /> : <UserX size={14} />}{member.status}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12"><UserCheck size={48} className="mx-auto text-gray-300 mb-4" /><h3 className="text-lg font-semibold text-gray-900 mb-2">No team members yet</h3><p className="text-gray-600">Contact administrator to add team members</p></div>
          )}
        </div>

        {canAddMember && isAddModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-bold mb-4">Add Team Member</h2>
              <div className="space-y-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label><input type="email" value={newMemberEmail} onChange={(e) => setNewMemberEmail(e.target.value)} placeholder="Enter email address" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-2">Role</label><select value={newMemberRoleId} onChange={(e) => setNewMemberRoleId(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"><option value="">Select a role</option>{roles.map((role) => <option key={role._id} value={role._id}>{role.name}</option>)}</select></div>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => { setIsAddModalOpen(false); setNewMemberEmail(""); setNewMemberRoleId(""); }} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
                <button onClick={handleAddMember} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Add Member</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}