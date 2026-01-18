import React from "react";
import { CheckCircle, XCircle, Clock } from "lucide-react";

// ========================================
// APPROVAL CARD COMPONENT
// ========================================
interface ApprovalCardProps {
  approval: {
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
  };
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}

export function ApprovalCard({
  approval,
  onApprove,
  onReject,
}: ApprovalCardProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Approved":
        return <CheckCircle className="text-green-600" size={20} />;
      case "Rejected":
        return <XCircle className="text-red-600" size={20} />;
      default:
        return <Clock className="text-yellow-600" size={20} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Approved":
        return "bg-green-100 text-green-700 border-green-300";
      case "Rejected":
        return "bg-red-100 text-red-700 border-red-300";
      default:
        return "bg-yellow-100 text-yellow-700 border-yellow-300";
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="p-6 hover:bg-gray-50 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            {getStatusIcon(approval.status)}
            <h3 className="font-semibold text-gray-900">
              {approval.itemDescription}
            </h3>
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(
                approval.status,
              )}`}
            >
              {approval.status}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-3">
            <div>
              <p className="text-sm text-gray-600">Requested by:</p>
              <p className="font-medium text-gray-900">
                {approval.requestedBy.name}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Requested at:</p>
              <p className="font-medium text-gray-900">
                {formatDate(approval.createdAt)}
              </p>
            </div>
            {approval.metadata.amount && (
              <div>
                <p className="text-sm text-gray-600">Amount:</p>
                <p className="font-medium text-gray-900">
                  {formatCurrency(approval.metadata.amount)}
                </p>
              </div>
            )}
            {approval.metadata.category && (
              <div>
                <p className="text-sm text-gray-600">Category:</p>
                <p className="font-medium text-gray-900">
                  {approval.metadata.category}
                </p>
              </div>
            )}
            {approval.metadata.vendor && (
              <div>
                <p className="text-sm text-gray-600">Vendor:</p>
                <p className="font-medium text-gray-900">
                  {approval.metadata.vendor}
                </p>
              </div>
            )}
          </div>

          {approval.status === "Approved" && approval.approvedBy && (
            <div className="mt-3 p-3 bg-green-50 rounded-lg">
              <p className="text-sm text-green-800">
                Approved by {approval.approvedBy.name} on{" "}
                {formatDate(approval.approvedAt!)}
              </p>
            </div>
          )}

          {approval.status === "Rejected" && (
            <div className="mt-3 p-3 bg-red-50 rounded-lg">
              <p className="text-sm text-red-800 font-medium mb-1">
                Rejected by {approval.approvedBy?.name || "Admin"}
              </p>
              {approval.rejectionReason && (
                <p className="text-sm text-red-700">
                  Reason: {approval.rejectionReason}
                </p>
              )}
            </div>
          )}
        </div>

        {approval.status === "Pending" && (
          <div className="flex gap-2 ml-4">
            <button
              onClick={() => onApprove(approval._id)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
            >
              <CheckCircle size={16} />
              Approve
            </button>
            <button
              onClick={() => onReject(approval._id)}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
            >
              <XCircle size={16} />
              Reject
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ========================================
// APPROVAL STATS CARDS
// ========================================
interface ApprovalStatsProps {
  pendingCount: number;
  approvedCount: number;
  rejectedCount: number;
}

export function ApprovalStats({
  pendingCount,
  approvedCount,
  rejectedCount,
}: ApprovalStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-6">
        <h3 className="text-sm font-medium text-gray-600 mb-2">
          Pending Approvals
        </h3>
        <p className="text-3xl font-bold text-yellow-700">{pendingCount}</p>
      </div>
      <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6">
        <h3 className="text-sm font-medium text-gray-600 mb-2">Approved</h3>
        <p className="text-3xl font-bold text-green-700">{approvedCount}</p>
      </div>
      <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6">
        <h3 className="text-sm font-medium text-gray-600 mb-2">Rejected</h3>
        <p className="text-3xl font-bold text-red-700">{rejectedCount}</p>
      </div>
    </div>
  );
}

// ========================================
// FILTER TABS
// ========================================
interface FilterTabsProps {
  currentFilter: "all" | "Pending" | "Approved" | "Rejected";
  onFilterChange: (filter: "all" | "Pending" | "Approved" | "Rejected") => void;
}

export function FilterTabs({ currentFilter, onFilterChange }: FilterTabsProps) {
  const filters: ("all" | "Pending" | "Approved" | "Rejected")[] = [
    "all",
    "Pending",
    "Approved",
    "Rejected",
  ];

  return (
    <div className="flex gap-2">
      {filters.map((filter) => (
        <button
          key={filter}
          onClick={() => onFilterChange(filter)}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            currentFilter === filter
              ? "bg-blue-600 text-white"
              : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
          }`}
        >
          {filter === "all" ? "All" : filter}
        </button>
      ))}
    </div>
  );
}

// ========================================
// EMPTY STATE
// ========================================
interface EmptyStateProps {
  filter: string;
}

export function EmptyState({ filter }: EmptyStateProps) {
  return (
    <div className="p-12 text-center">
      <Clock size={48} className="mx-auto text-gray-300 mb-4" />
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        No approvals found
      </h3>
      <p className="text-gray-600">
        {filter === "Pending"
          ? "No pending approval requests at the moment"
          : `No ${filter.toLowerCase()} approvals found`}
      </p>
    </div>
  );
}
