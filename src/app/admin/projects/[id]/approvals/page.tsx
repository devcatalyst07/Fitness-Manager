"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import AdminSidebar from "@/components/AdminSidebar";
import AdminHeader from "@/components/AdminHeader";
import FitoutLoadingSpinner from "@/components/FitoutLoadingSpinner";
import {
  ApprovalCard,
  ApprovalStats,
  FilterTabs,
  EmptyState,
} from "@/components/ApprovalsComponents";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://fitout-manager-api.vercel.app";

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
  const [pathname, setPathname] = useState("/admin/projects");
  const [loading, setLoading] = useState(true);
  const [isVerified, setIsVerified] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [filter, setFilter] = useState<
    "all" | "Pending" | "Approved" | "Rejected"
  >("Pending");

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("userRole");

    if (!token || role !== "admin") {
      localStorage.clear();
      router.replace("/");
    } else {
      setIsVerified(true);
      fetchProject();
      fetchApprovals();
    }
  }, [params.id, router, filter]);

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

  const fetchApprovals = async () => {
    try {
      const token = localStorage.getItem("token");
      const statusParam = filter === "all" ? "" : `?status=${filter}`;
      const response = await fetch(
        `${API_URL}/api/projects/${params.id}/approvals${statusParam}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (response.ok) {
        const data = await response.json();
        setApprovals(data);
      }
    } catch (error) {
      console.error("Error fetching approvals:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (approvalId: string) => {
    if (!confirm("Are you sure you want to approve this request?")) return;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${API_URL}/api/projects/${params.id}/approvals/${approvalId}/approve`,
        {
          method: "PUT",
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (response.ok) {
        await fetchApprovals();
        alert("Approval granted successfully!");
      } else {
        const error = await response.json();
        alert(error.message || "Failed to approve");
      }
    } catch (error) {
      console.error("Approve error:", error);
      alert("Failed to approve");
    }
  };

  const handleReject = async (approvalId: string) => {
    const reason = prompt("Please provide a reason for rejection:");
    if (!reason) return;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${API_URL}/api/projects/${params.id}/approvals/${approvalId}/reject`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ reason }),
        },
      );

      if (response.ok) {
        await fetchApprovals();
        alert("Approval rejected successfully!");
      } else {
        const error = await response.json();
        alert(error.message || "Failed to reject");
      }
    } catch (error) {
      console.error("Reject error:", error);
      alert("Failed to reject");
    }
  };

  if (!isVerified || loading) {
    return <FitoutLoadingSpinner />;
  }

  const pendingCount = approvals.filter((a) => a.status === "Pending").length;
  const approvedCount = approvals.filter((a) => a.status === "Approved").length;
  const rejectedCount = approvals.filter((a) => a.status === "Rejected").length;

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminSidebar pathname={pathname} setPathname={setPathname} />
      <AdminHeader />

      <main className="lg:ml-64 mt-16 p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.push(`/admin/projects/${params.id}/overview`)}
            className="text-gray-600 hover:text-black mb-4 flex items-center gap-2"
          >
            <ArrowLeft size={20} />
            <span>Back to Overview</span>
          </button>

          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            Approvals
          </h1>
          <p className="text-sm text-gray-600">
            Manage approval requests for {projectName}
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6 border-b border-gray-200">
          <div className="flex gap-6">
            {["Overview", "Tasks", "Budget", "Documents", "Team"].map((tab) => (
              <button
                key={tab}
                className="pb-3 px-1 text-sm font-medium border-b-2 border-transparent text-gray-500 hover:text-gray-700"
                onClick={() => {
                  if (tab === "Overview")
                    router.push(`/admin/projects/${params.id}/overview`);
                  if (tab === "Tasks")
                    router.push(`/admin/projects/${params.id}/tasks`);
                  if (tab === "Budget")
                    router.push(`/admin/projects/${params.id}/budget`);
                  if (tab === "Documents")
                    router.push(`/admin/projects/${params.id}/documents`);
                  if (tab === "Team")
                    router.push(`/admin/projects/${params.id}/team`);
                }}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="mb-6">
          <ApprovalStats
            pendingCount={pendingCount}
            approvedCount={approvedCount}
            rejectedCount={rejectedCount}
          />
        </div>

        {/* Filter Tabs */}
        <div className="mb-6">
          <FilterTabs currentFilter={filter} onFilterChange={setFilter} />
        </div>

        {/* Approvals List */}
        <div className="bg-white rounded-lg border border-gray-200">
          {approvals.length === 0 ? (
            <EmptyState filter={filter} />
          ) : (
            <div className="divide-y divide-gray-200">
              {approvals.map((approval) => (
                <ApprovalCard
                  key={approval._id}
                  approval={approval}
                  onApprove={handleApprove}
                  onReject={handleReject}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
