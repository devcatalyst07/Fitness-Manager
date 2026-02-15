"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { apiClient } from "@/lib/axios";
import AdminSidebar from "@/components/AdminSidebar";
import AdminHeader from "@/components/AdminHeader";
import FitoutLoadingSpinner from "@/components/FitoutLoadingSpinner";
import {
  ApprovalCard,
  ApprovalStats,
  FilterTabs,
  EmptyState,
} from "@/components/ApprovalsComponents";

interface Approval {
  _id: string;
  itemType: "BudgetItem" | "Task" | "Document";
  itemDescription: string;
  requestedBy: {
    name: string;
    email: string;
  };
  status: "Pending" | "Approved" | "Rejected";
  approvedBy?: {
    name: string;
    email: string;
  };
  approvedAt?: string;
  rejectionReason?: string;
  metadata: {
    amount?: number;
    category?: string;
    vendor?: string;
  };
  createdAt: string;
}

export default function ProjectApprovalsPage() {
  const router = useRouter();
  const params = useParams();
  const { user, loading: authLoading } = useAuth();

  const [pathname, setPathname] = useState("/admin/projects");
  const [loading, setLoading] = useState(true);
  const [projectName, setProjectName] = useState("");
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [filter, setFilter] = useState<"all" | "Pending" | "Approved" | "Rejected">("Pending");

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/");
      return;
    }
    if (!authLoading && user && user.role !== "admin") {
      router.replace("/user/projects");
      return;
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user && user.role === "admin" && params.id) {
      fetchProject();
      fetchApprovals();
    }
  }, [user, params.id, filter]);

  const fetchProject = async () => {
    try {
      const data = await apiClient.get(`/api/projects/${params.id}`);
      setProjectName(data.projectName);
    } catch (error) {
      console.error("Error fetching project:", error);
    }
  };

  const fetchApprovals = async () => {
    try {
      const statusParam = filter === "all" ? "" : `?status=${filter}`;
      const data = await apiClient.get(`/api/projects/${params.id}/approvals${statusParam}`);
      setApprovals(data);
    } catch (error) {
      console.error("Error fetching approvals:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (approvalId: string) => {
    if (!confirm("Are you sure you want to approve this request?")) return;
    try {
      await apiClient.put(`/api/projects/${params.id}/approvals/${approvalId}/approve`);
      await fetchApprovals();
      alert("Approval granted successfully!");
    } catch (error: any) {
      console.error("Approve error:", error);
      alert(error?.response?.data?.message || "Failed to approve");
    }
  };

  const handleReject = async (approvalId: string) => {
    const reason = prompt("Please provide a reason for rejection:");
    if (!reason) return;
    try {
      await apiClient.put(`/api/projects/${params.id}/approvals/${approvalId}/reject`, { reason });
      await fetchApprovals();
      alert("Approval rejected successfully!");
    } catch (error: any) {
      console.error("Reject error:", error);
      alert(error?.response?.data?.message || "Failed to reject");
    }
  };

  if (authLoading || loading) return <FitoutLoadingSpinner />;
  if (!user || user.role !== "admin") return <FitoutLoadingSpinner />;

  const pendingCount = approvals.filter((a) => a.status === "Pending").length;
  const approvedCount = approvals.filter((a) => a.status === "Approved").length;
  const rejectedCount = approvals.filter((a) => a.status === "Rejected").length;

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminSidebar pathname={pathname} setPathname={setPathname} />
      <AdminHeader />

      <main className="lg:ml-64 mt-16 p-4 sm:p-6 lg:p-8">
        <div className="mb-6">
          <button
            onClick={() => router.push(`/admin/projects/${params.id}/overview`)}
            className="text-gray-600 hover:text-black mb-4 flex items-center gap-2"
          >
            <ArrowLeft size={20} />
            <span>Back to Overview</span>
          </button>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Approvals</h1>
          <p className="text-sm text-gray-600">Manage approval requests for {projectName}</p>
        </div>

        <div className="mb-6 border-b border-gray-200">
          <div className="flex gap-6">
            {["Overview", "Tasks", "Budget", "Documents", "Team"].map((tab) => (
              <button
                key={tab}
                className="pb-3 px-1 text-sm font-medium border-b-2 border-transparent text-gray-500 hover:text-gray-700"
                onClick={() => {
                  if (tab === "Overview") router.push(`/admin/projects/${params.id}/overview`);
                  if (tab === "Tasks") router.push(`/admin/projects/${params.id}/tasks`);
                  if (tab === "Budget") router.push(`/admin/projects/${params.id}/budget`);
                  if (tab === "Documents") router.push(`/admin/projects/${params.id}/documents`);
                  if (tab === "Team") router.push(`/admin/projects/${params.id}/team`);
                }}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <ApprovalStats pendingCount={pendingCount} approvedCount={approvedCount} rejectedCount={rejectedCount} />
        </div>

        <div className="mb-6">
          <FilterTabs currentFilter={filter} onFilterChange={setFilter} />
        </div>

        <div className="bg-white rounded-lg border border-gray-200">
          {approvals.length === 0 ? (
            <EmptyState filter={filter} />
          ) : (
            <div className="divide-y divide-gray-200">
              {approvals.map((approval) => (
                <ApprovalCard key={approval._id} approval={approval} onApprove={handleApprove} onReject={handleReject} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}