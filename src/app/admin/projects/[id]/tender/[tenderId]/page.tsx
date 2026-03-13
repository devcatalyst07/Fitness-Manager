"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Edit, FileText, Download, Send } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { apiClient } from "@/lib/axios";
import AdminSidebar from "@/components/AdminSidebar";
import AdminHeader from "@/components/AdminHeader";
import FitoutLoadingSpinner from "@/components/FitoutLoadingSpinner";
import BidDetailModal from "@/components/BidDetailModal";

// ─── Types ──────────────────────────────────────────────────────

interface TenderDocument {
  _id: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize?: number;
  section: string;
}

interface Tender {
  _id: string;
  tenderNumber: string;
  title: string;
  description: string;
  category: string;
  status: string;
  budgetedAmount: number;
  issueDate?: string;
  submissionDeadline?: string;
  awardedAmount?: number;
  awardedContractorId?: string;
  awardedReason?: string;
  awardDate?: string;
  scopeOfWorks?: string;
  specifications?: string;
  complianceRequirements: string[];
  documents: TenderDocument[];
  shortlistedContractors: Array<{
    contractorId: string;
    name: string;
    email: string;
    phone?: string;
    status: string;
    invitedAt?: string;
  }>;
  budgetSynced?: boolean;
  budgetItemId?: string;
  createdBy: { name: string; email: string };
  createdAt: string;
}

interface BidAttachment {
  _id: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  category: string;
}

interface Bid {
  _id: string;
  contractorName: string;
  contractorEmail: string;
  bidAmount: number;
  breakdownItems: Array<{
    description: string;
    quantity: number;
    unitCost: number;
    total: number;
  }>;
  assumptions?: string;
  exclusions?: string;
  comments?: string;
  proposedDuration?: number;
  status: string;
  submittedAt?: string;
  evaluationScore?: number;
  evaluationNotes?: string;
  attachments?: BidAttachment[];
}

interface RFI {
  _id: string;
  contractorName: string;
  question: string;
  response?: string;
  status: string;
  askedAt: string;
  answeredAt?: string;
  answeredBy?: { name: string };
}

// ─── Component ──────────────────────────────────────────────────

export default function TenderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { user, loading: authLoading } = useAuth();

  const [pathname, setPathname] = useState("/admin/projects");
  const [loading, setLoading] = useState(true);
  const [tender, setTender] = useState<Tender | null>(null);
  const [bids, setBids] = useState<Bid[]>([]);
  const [rfis, setRfis] = useState<RFI[]>([]);
  const [activeTab, setActiveTab] = useState<"details" | "bids" | "rfis">(
    "details",
  );

  // ── Bid Detail Modal ──
  const [isBidDetailOpen, setIsBidDetailOpen] = useState(false);
  const [selectedBidId, setSelectedBidId] = useState<string | null>(null);

  // ── Award Modal ──
  const [isAwardModalOpen, setIsAwardModalOpen] = useState(false);
  const [selectedBidForAward, setSelectedBidForAward] = useState<Bid | null>(
    null,
  );
  const [awardReason, setAwardReason] = useState("");

  // ── RFI Response Modal ──
  const [isRFIResponseModalOpen, setIsRFIResponseModalOpen] = useState(false);
  const [selectedRFI, setSelectedRFI] = useState<RFI | null>(null);
  const [rfiResponse, setRfiResponse] = useState("");

  // ── Bid Evaluation Modal ──
  const [isBidEvalModalOpen, setIsBidEvalModalOpen] = useState(false);
  const [selectedBidForEval, setSelectedBidForEval] = useState<Bid | null>(
    null,
  );
  const [evalScore, setEvalScore] = useState(0);
  const [evalNotes, setEvalNotes] = useState("");

  const [saving, setSaving] = useState(false);

  // ── Auth ──
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
    if (user && user.role === "admin" && params.tenderId) {
      fetchTenderDetails();
    }
  }, [user, params.tenderId]);

  const fetchTenderDetails = async () => {
    setLoading(true);
    try {
      const data = await apiClient.get(`/api/tenders/${params.tenderId}`);
      setTender(data);
      setBids(data.bids || []);
      setRfis(data.rfis || []);
    } catch (error) {
      console.error("Error fetching tender:", error);
      alert("Failed to load tender details");
      router.back();
    } finally {
      setLoading(false);
    }
  };

  // ── Handlers ──

  const handleAnswerRFI = async () => {
    if (!selectedRFI || !rfiResponse.trim()) {
      alert("Please enter a response");
      return;
    }
    setSaving(true);
    try {
      await apiClient.put(`/api/rfis/${selectedRFI._id}/answer`, {
        response: rfiResponse,
      });
      await fetchTenderDetails();
      setIsRFIResponseModalOpen(false);
      setSelectedRFI(null);
      setRfiResponse("");
      alert("RFI answered!");
    } catch (error: any) {
      alert(error?.response?.data?.message || "Failed to answer RFI");
    } finally {
      setSaving(false);
    }
  };

  const handleEvaluateBid = async () => {
    if (!selectedBidForEval) return;
    setSaving(true);
    try {
      await apiClient.put(
        `/api/tenders/${params.tenderId}/bids/${selectedBidForEval._id}/evaluate`,
        {
          evaluationScore: evalScore,
          evaluationNotes: evalNotes,
          status: "Under Review",
        },
      );
      await fetchTenderDetails();
      setIsBidEvalModalOpen(false);
      setSelectedBidForEval(null);
      setEvalScore(0);
      setEvalNotes("");
      alert("Bid evaluated!");
    } catch (error: any) {
      alert(error?.response?.data?.message || "Failed to evaluate bid");
    } finally {
      setSaving(false);
    }
  };

  const handleAwardTender = async () => {
    if (!selectedBidForAward) return;
    if (
      !confirm(
        `Award to ${selectedBidForAward.contractorName} for ${formatCurrency(selectedBidForAward.bidAmount)}?`,
      )
    )
      return;

    setSaving(true);
    try {
      await apiClient.post(`/api/tenders/${params.tenderId}/award`, {
        bidId: selectedBidForAward._id,
        awardedReason: awardReason,
      });
      await fetchTenderDetails();
      setIsAwardModalOpen(false);
      setSelectedBidForAward(null);
      setAwardReason("");
      alert(
        "Tender awarded! The awarded amount has been automatically synced to the Budget tab.",
      );
    } catch (error: any) {
      alert(error?.response?.data?.message || "Failed to award tender");
    } finally {
      setSaving(false);
    }
  };

  // ── Formatters ──

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(amount);

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Not set";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "";
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      Draft: "bg-gray-100 text-gray-700",
      Submitted: "bg-blue-100 text-blue-700",
      "Under Review": "bg-yellow-100 text-yellow-700",
      Accepted: "bg-green-100 text-green-700",
      Rejected: "bg-red-100 text-red-700",
      Pending: "bg-orange-100 text-orange-700",
      Answered: "bg-green-100 text-green-700",
      Closed: "bg-gray-100 text-gray-700",
      Issued: "bg-blue-100 text-blue-700",
      RFI: "bg-yellow-100 text-yellow-700",
      "Bid Evaluation": "bg-purple-100 text-purple-700",
      Awarded: "bg-green-100 text-green-700",
      Cancelled: "bg-red-100 text-red-700",
      Invited: "bg-blue-100 text-blue-700",
      "Bid Submitted": "bg-indigo-100 text-indigo-700",
    };
    return badges[status] || "bg-gray-100 text-gray-700";
  };

  const getSectionDocs = (section: string) =>
    tender?.documents?.filter((d) => d.section === section) || [];

  if (authLoading || loading) return <FitoutLoadingSpinner />;
  if (!user || user.role !== "admin" || !tender)
    return <FitoutLoadingSpinner />;

  const lowestBid =
    bids.length > 0 ? Math.min(...bids.map((b) => b.bidAmount)) : 0;
  const averageBid =
    bids.length > 0
      ? bids.reduce((sum, b) => sum + b.bidAmount, 0) / bids.length
      : 0;

  // ═══════════════════════════════════════════════════════════
  // MAIN RENDER
  // ═══════════════════════════════════════════════════════════

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminSidebar pathname={pathname} setPathname={setPathname} />
      <AdminHeader />

      <main className="lg:ml-[var(--fm-sidebar-width)] mt-16 p-4 sm:p-6 lg:p-8 transition-all duration-300">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.push(`/admin/projects/${params.id}/tender`)}
            className="text-gray-600 hover:text-black mb-4 flex items-center gap-2 text-sm"
          >
            <ArrowLeft size={16} /> Back to Tenders
          </button>
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                  {tender.tenderNumber}
                </h1>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(tender.status)}`}
                >
                  {tender.status}
                </span>
              </div>
              <h2 className="text-xl font-semibold text-gray-700 mb-1">
                {tender.title}
              </h2>
              <p className="text-sm text-gray-600">{tender.description}</p>
            </div>
            <div className="flex gap-2">
              {/* Edit button for Draft and Issued tenders */}
              {["Draft", "Issued"].includes(tender.status) && (
                <button
                  onClick={() =>
                    router.push(`/admin/projects/${params.id}/tender`)
                  }
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
                >
                  <Edit size={16} />
                  Edit Tender
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Budget Sync Banner */}
        {tender.budgetSynced && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-green-800 text-sm">
              <span className="text-green-600">✓</span>
              <span className="font-medium">Budget Synced</span>
              <span className="text-green-700">
                — The awarded amount (
                {formatCurrency(tender.awardedAmount || 0)}) has been
                automatically added to the Budget tab.
              </span>
              <button
                onClick={() =>
                  router.push(`/admin/projects/${params.id}/budget`)
                }
                className="ml-auto text-green-700 hover:text-green-900 font-medium underline"
              >
                View Budget
              </button>
            </div>
          </div>
        )}

        {/* Key Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="text-sm text-gray-600 mb-1">Budgeted Amount</div>
            <div className="text-2xl font-bold text-gray-900">
              {formatCurrency(tender.budgetedAmount)}
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="text-sm text-gray-600 mb-1">Bids Received</div>
            <div className="text-2xl font-bold text-gray-900">
              {bids.length}
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="text-sm text-gray-600 mb-1">Lowest Bid</div>
            <div className="text-2xl font-bold text-green-600">
              {bids.length > 0 ? formatCurrency(lowestBid) : "N/A"}
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="text-sm text-gray-600 mb-1">Average Bid</div>
            <div className="text-2xl font-bold text-blue-600">
              {bids.length > 0 ? formatCurrency(averageBid) : "N/A"}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <div className="flex gap-6">
            {[
              { key: "details", label: "Tender Details" },
              { key: "bids", label: `Bids (${bids.length})` },
              {
                key: "rfis",
                label: `RFIs (${rfis.filter((r) => r.status === "Pending").length} pending)`,
              },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.key
                    ? "border-black text-black"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* ═══ DETAILS TAB ═══ */}
        {activeTab === "details" && (
          <div className="space-y-6">
            {/* Basic Info */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold mb-4">Tender Information</h3>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <div className="text-sm text-gray-600 mb-1">Category</div>
                  <div className="font-medium">{tender.category}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 mb-1">Issue Date</div>
                  <div className="font-medium">
                    {formatDate(tender.issueDate)}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 mb-1">
                    Submission Deadline
                  </div>
                  <div className="font-medium">
                    {formatDate(tender.submissionDeadline)}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 mb-1">Created By</div>
                  <div className="font-medium">{tender.createdBy.name}</div>
                </div>
              </div>
            </div>

            {/* Scope + Attachments */}
            {(tender.scopeOfWorks || getSectionDocs("scope").length > 0) && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold mb-4">Scope of Works</h3>
                {tender.scopeOfWorks && (
                  <p className="text-gray-700 whitespace-pre-wrap mb-4">
                    {tender.scopeOfWorks}
                  </p>
                )}
                {getSectionDocs("scope").length > 0 && (
                  <div>
                    <div className="text-sm font-medium text-gray-600 mb-2">
                      Attached Documents ({getSectionDocs("scope").length})
                    </div>
                    <div className="space-y-2">
                      {getSectionDocs("scope").map((doc) => (
                        <a
                          key={doc._id}
                          href={doc.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 group"
                        >
                          <div className="flex items-center gap-3">
                            <FileText size={18} className="text-blue-600" />
                            <div>
                              <div className="font-medium text-gray-900 text-sm">
                                {doc.fileName}
                              </div>
                              {doc.fileSize && (
                                <div className="text-xs text-gray-500">
                                  {formatFileSize(doc.fileSize)}
                                </div>
                              )}
                            </div>
                          </div>
                          <Download
                            size={16}
                            className="text-gray-400 group-hover:text-blue-600"
                          />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Specifications + Attachments */}
            {(tender.specifications ||
              getSectionDocs("specifications").length > 0) && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold mb-4">
                  Technical Specifications
                </h3>
                {tender.specifications && (
                  <p className="text-gray-700 whitespace-pre-wrap mb-4">
                    {tender.specifications}
                  </p>
                )}
                {getSectionDocs("specifications").length > 0 && (
                  <div>
                    <div className="text-sm font-medium text-gray-600 mb-2">
                      Attached Documents (
                      {getSectionDocs("specifications").length})
                    </div>
                    <div className="space-y-2">
                      {getSectionDocs("specifications").map((doc) => (
                        <a
                          key={doc._id}
                          href={doc.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 group"
                        >
                          <div className="flex items-center gap-3">
                            <FileText size={18} className="text-blue-600" />
                            <div>
                              <div className="font-medium text-gray-900 text-sm">
                                {doc.fileName}
                              </div>
                              {doc.fileSize && (
                                <div className="text-xs text-gray-500">
                                  {formatFileSize(doc.fileSize)}
                                </div>
                              )}
                            </div>
                          </div>
                          <Download
                            size={16}
                            className="text-gray-400 group-hover:text-blue-600"
                          />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* General Documents */}
            {getSectionDocs("general").length > 0 && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold mb-4">
                  Additional Documents ({getSectionDocs("general").length})
                </h3>
                <div className="space-y-2">
                  {getSectionDocs("general").map((doc) => (
                    <a
                      key={doc._id}
                      href={doc.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 group"
                    >
                      <div className="flex items-center gap-3">
                        <FileText size={18} className="text-blue-600" />
                        <div>
                          <div className="font-medium text-gray-900 text-sm">
                            {doc.fileName}
                          </div>
                          {doc.fileSize && (
                            <div className="text-xs text-gray-500">
                              {formatFileSize(doc.fileSize)}
                            </div>
                          )}
                        </div>
                      </div>
                      <Download
                        size={16}
                        className="text-gray-400 group-hover:text-blue-600"
                      />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Compliance */}
            {tender.complianceRequirements.length > 0 && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold mb-4">
                  Compliance Requirements
                </h3>
                <ul className="list-disc list-inside space-y-2">
                  {tender.complianceRequirements.map((req, i) => (
                    <li key={i} className="text-gray-700">
                      {req}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Shortlisted Contractors */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold mb-4">
                Shortlisted Contractors ({tender.shortlistedContractors.length})
              </h3>
              <div className="space-y-3">
                {tender.shortlistedContractors.map((c, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
                  >
                    <div>
                      <div className="font-medium text-gray-900">{c.name}</div>
                      <div className="text-sm text-gray-600">{c.email}</div>
                    </div>
                    <div className="text-right">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(c.status)}`}
                      >
                        {c.status}
                      </span>
                      {c.invitedAt && (
                        <div className="text-xs text-gray-500 mt-1">
                          Invited: {formatDate(c.invitedAt)}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Award Info */}
            {tender.status === "Awarded" && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4 text-green-900">
                  Award Information
                </h3>
                <div className="space-y-2">
                  <div>
                    <span className="text-sm text-green-700">
                      Awarded Amount:{" "}
                    </span>
                    <span className="font-bold text-green-900">
                      {formatCurrency(tender.awardedAmount || 0)}
                    </span>
                  </div>
                  <div>
                    <span className="text-sm text-green-700">Award Date: </span>
                    <span className="font-medium text-green-900">
                      {formatDate(tender.awardDate)}
                    </span>
                  </div>
                  {tender.awardedReason && (
                    <div>
                      <span className="text-sm text-green-700">Reason: </span>
                      <span className="text-green-900">
                        {tender.awardedReason}
                      </span>
                    </div>
                  )}
                  {tender.budgetSynced && (
                    <div className="mt-3 p-3 bg-green-100 rounded-lg text-sm text-green-800">
                      ✓ This amount has been automatically synced to the project
                      budget.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══ BIDS TAB ═══ */}
        {activeTab === "bids" && (
          <div className="bg-white rounded-lg border border-gray-200">
            {bids.length === 0 ? (
              <div className="p-12 text-center">
                <div className="text-gray-400 mb-4 text-4xl">📊</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No bids yet
                </h3>
                <p className="text-gray-600">
                  Waiting for contractors to submit their bids
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Contractor
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Bid Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Variance
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Duration
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Files
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Evaluation
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {bids.map((bid) => {
                      const variance = bid.bidAmount - tender.budgetedAmount;
                      const variancePercent =
                        (variance / tender.budgetedAmount) * 100;

                      return (
                        <tr key={bid._id} className="hover:bg-gray-50">
                          {/* ★ Clickable contractor name — opens BidDetailModal */}
                          <td className="px-6 py-4">
                            <button
                              onClick={() => {
                                setSelectedBidId(bid._id);
                                setIsBidDetailOpen(true);
                              }}
                              className="text-left group"
                            >
                              <div className="font-medium text-blue-600 group-hover:text-blue-800 group-hover:underline">
                                {bid.contractorName}
                              </div>
                              <div className="text-sm text-gray-600">
                                {bid.contractorEmail}
                              </div>
                              {bid.submittedAt && (
                                <div className="text-xs text-gray-500">
                                  Submitted: {formatDate(bid.submittedAt)}
                                </div>
                              )}
                            </button>
                          </td>
                          <td className="px-6 py-4">
                            <div className="font-bold text-gray-900">
                              {formatCurrency(bid.bidAmount)}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div
                              className={`text-sm font-medium ${variance < 0 ? "text-green-600" : variance > 0 ? "text-red-600" : "text-gray-600"}`}
                            >
                              {variance > 0 ? "+" : ""}
                              {formatCurrency(variance)}
                              <span className="text-xs ml-1">
                                ({variancePercent > 0 ? "+" : ""}
                                {variancePercent.toFixed(1)}%)
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {bid.proposedDuration
                              ? `${bid.proposedDuration} days`
                              : "N/A"}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {bid.attachments?.length || 0} file(s)
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(bid.status)}`}
                            >
                              {bid.status}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            {bid.evaluationScore !== undefined &&
                            bid.evaluationScore !== null ? (
                              <div>
                                <div className="font-medium text-gray-900">
                                  Score: {bid.evaluationScore}/100
                                </div>
                                {bid.evaluationNotes && (
                                  <div className="text-xs text-gray-600 mt-1 truncate max-w-[120px]">
                                    {bid.evaluationNotes}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-gray-400 text-sm">
                                Not evaluated
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {/* View full bid detail */}
                              <button
                                onClick={() => {
                                  setSelectedBidId(bid._id);
                                  setIsBidDetailOpen(true);
                                }}
                                className="text-blue-600 hover:text-blue-800 text-sm"
                              >
                                View
                              </button>
                              {tender.status !== "Awarded" && (
                                <>
                                  <button
                                    onClick={() => {
                                      setSelectedBidForEval(bid);
                                      setEvalScore(bid.evaluationScore || 0);
                                      setEvalNotes(bid.evaluationNotes || "");
                                      setIsBidEvalModalOpen(true);
                                    }}
                                    className="text-purple-600 hover:text-purple-800 text-sm"
                                  >
                                    Evaluate
                                  </button>
                                  <button
                                    onClick={() => {
                                      setSelectedBidForAward(bid);
                                      setIsAwardModalOpen(true);
                                    }}
                                    className="text-green-600 hover:text-green-800 text-sm"
                                  >
                                    Award
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ═══ RFIs TAB ═══ */}
        {activeTab === "rfis" && (
          <div className="bg-white rounded-lg border border-gray-200">
            {rfis.length === 0 ? (
              <div className="p-12 text-center">
                <div className="text-gray-400 mb-4 text-4xl">❓</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No RFIs yet
                </h3>
                <p className="text-gray-600">
                  No requests for information from contractors
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {rfis.map((rfi) => (
                  <div key={rfi._id} className="p-6">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-medium text-gray-900">
                        {rfi.contractorName}
                      </span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(rfi.status)}`}
                      >
                        {rfi.status}
                      </span>
                      <span className="text-xs text-gray-500">
                        Asked {formatDate(rfi.askedAt)}
                      </span>
                    </div>
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-3">
                      <div className="text-sm font-medium text-gray-700 mb-1">
                        Question:
                      </div>
                      <p className="text-gray-900">{rfi.question}</p>
                    </div>
                    {rfi.response ? (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="text-sm font-medium text-blue-700 mb-1">
                          Response:
                        </div>
                        <p className="text-blue-900">{rfi.response}</p>
                        {rfi.answeredAt && (
                          <div className="text-xs text-blue-600 mt-2">
                            Answered {formatDate(rfi.answeredAt)}{" "}
                            {rfi.answeredBy && `by ${rfi.answeredBy.name}`}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex justify-end">
                        <button
                          onClick={() => {
                            setSelectedRFI(rfi);
                            setRfiResponse("");
                            setIsRFIResponseModalOpen(true);
                          }}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                        >
                          Answer RFI
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ═══ BID DETAIL MODAL ═══ */}
        {isBidDetailOpen && selectedBidId && tender && (
          <BidDetailModal
            isOpen={isBidDetailOpen}
            onClose={() => {
              setIsBidDetailOpen(false);
              setSelectedBidId(null);
            }}
            tenderId={tender._id}
            bidId={selectedBidId}
            budgetedAmount={tender.budgetedAmount}
          />
        )}

        {/* ═══ AWARD MODAL ═══ */}
        {isAwardModalOpen && selectedBidForAward && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white w-full max-w-2xl rounded-lg p-8">
              <h2 className="text-2xl font-bold mb-6">Award Tender</h2>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <div className="font-semibold text-blue-900 mb-2">
                  Selected Contractor
                </div>
                <div className="text-blue-800">
                  {selectedBidForAward.contractorName}
                </div>
                <div className="text-sm text-blue-700">
                  Bid: {formatCurrency(selectedBidForAward.bidAmount)}
                </div>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-green-800">
                  <strong>Note:</strong> The awarded amount will be
                  automatically synced to the Budget tab as a "Committed" line
                  item.
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Award Reason / Justification
                </label>
                <textarea
                  value={awardReason}
                  onChange={(e) => setAwardReason(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-2 border rounded-lg"
                  placeholder="Explain why this bid was selected..."
                />
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setIsAwardModalOpen(false);
                    setSelectedBidForAward(null);
                    setAwardReason("");
                  }}
                  className="flex-1 px-4 py-3 border rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAwardTender}
                  disabled={saving}
                  className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400"
                >
                  {saving ? "Processing..." : "Confirm Award"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ═══ RFI RESPONSE MODAL ═══ */}
        {isRFIResponseModalOpen && selectedRFI && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white w-full max-w-2xl rounded-lg p-8">
              <h2 className="text-2xl font-bold mb-6">Answer RFI</h2>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                <div className="font-semibold text-gray-900 mb-2">
                  Question:
                </div>
                <p className="text-gray-700">{selectedRFI.question}</p>
                <div className="text-sm text-gray-500 mt-2">
                  From: {selectedRFI.contractorName}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Your Response *
                </label>
                <textarea
                  value={rfiResponse}
                  onChange={(e) => setRfiResponse(e.target.value)}
                  rows={6}
                  className="w-full px-4 py-2 border rounded-lg"
                  placeholder="Type your response..."
                />
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setIsRFIResponseModalOpen(false);
                    setSelectedRFI(null);
                    setRfiResponse("");
                  }}
                  className="flex-1 px-4 py-3 border rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAnswerRFI}
                  disabled={saving}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg disabled:bg-gray-400"
                >
                  {saving ? "Sending..." : "Send Response"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ═══ BID EVALUATION MODAL ═══ */}
        {isBidEvalModalOpen && selectedBidForEval && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white w-full max-w-2xl rounded-lg p-8">
              <h2 className="text-2xl font-bold mb-6">Evaluate Bid</h2>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                <div className="font-semibold text-gray-900 mb-2">
                  {selectedBidForEval.contractorName}
                </div>
                <div className="text-gray-700">
                  Bid: {formatCurrency(selectedBidForEval.bidAmount)}
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">
                  Score (0–100)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={evalScore}
                  onChange={(e) => setEvalScore(parseInt(e.target.value) || 0)}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Notes</label>
                <textarea
                  value={evalNotes}
                  onChange={(e) => setEvalNotes(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-2 border rounded-lg"
                  placeholder="Evaluation comments..."
                />
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setIsBidEvalModalOpen(false);
                    setSelectedBidForEval(null);
                  }}
                  className="flex-1 px-4 py-3 border rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEvaluateBid}
                  disabled={saving}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg disabled:bg-gray-400"
                >
                  {saving ? "Saving..." : "Save Evaluation"}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
