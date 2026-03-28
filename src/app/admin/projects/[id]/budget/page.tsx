"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  Plus,
  X,
  Edit,
  Trash2,
  Link2,
  ArrowUpDown,
  TrendingUp,
  TrendingDown,
  DollarSign,
  BarChart3,
  AlertCircle,
  ChevronRight,
  RefreshCw,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { apiClient } from "@/lib/axios";
import AdminSidebar from "@/components/AdminSidebar";
import AdminHeader from "@/components/AdminHeader";
import FitoutLoadingSpinner from "@/components/FitoutLoadingSpinner";

// ─── Types ──────────────────────────────────────────────────────

interface BudgetItem {
  _id: string;
  description: string;
  category: string;
  vendor?: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
  committedStatus: string;
  invoicedAmount?: number;
  paidAmount?: number;
  notes?: string;
  tenderId?: string;
  tenderNumber?: string;
  awardedBidId?: string;
  isTenderSynced?: boolean;
  createdAt: string;
  updatedAt: string;
}

interface BudgetStats {
  totalBudget: number;
  totalCommitted: number;
  eac: number;
  variance: number;
  percentUsed: number;
  breakdown: {
    paid: number;
    invoiced: number;
    committed: number;
    planned: number;
  };
  categoryBreakdown: Array<{
    category: string;
    spent: number;
    itemCount: number;
  }>;
}

// ─── Utility ────────────────────────────────────────────────────

const safeNum = (val: unknown): number => {
  const n = Number(val);
  return isFinite(n) ? n : 0;
};

const itemTotal = (item: BudgetItem): number =>
  safeNum(item.totalCost) || safeNum(item.quantity) * safeNum(item.unitCost);

const formatCurrency = (amount: unknown): string =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(safeNum(amount));

// ─── Status config ───────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { dot: string; bg: string; text: string }> = {
  Pending: {
    dot: "bg-slate-400",
    bg: "bg-slate-50 border border-slate-200",
    text: "text-slate-700",
  },
  Committed: {
    dot: "bg-blue-500",
    bg: "bg-blue-50 border border-blue-200",
    text: "text-blue-700",
  },
  Invoiced: {
    dot: "bg-amber-500",
    bg: "bg-amber-50 border border-amber-200",
    text: "text-amber-700",
  },
  Paid: {
    dot: "bg-emerald-500",
    bg: "bg-emerald-50 border border-emerald-200",
    text: "text-emerald-700",
  },
  Cancelled: {
    dot: "bg-red-400",
    bg: "bg-red-50 border border-red-200",
    text: "text-red-700",
  },
};

const StatusBadge = ({ status }: { status: string }) => {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG["Pending"];
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium ${cfg.bg} ${cfg.text}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {status}
    </span>
  );
};

// ─── Finance Card ────────────────────────────────────────────────

interface FinanceCardProps {
  label: string;
  value: number;
  subtitle?: string;
  accent: string;
  icon: React.ReactNode;
  alert?: boolean;
}

const FinanceCard = ({ label, value, subtitle, accent, icon, alert }: FinanceCardProps) => (
  <div
    className={`bg-white rounded-xl border ${
      alert && value < 0 ? "border-red-200 shadow-red-50" : "border-gray-200"
    } p-5 shadow-sm`}
  >
    <div className="flex items-start justify-between mb-3">
      <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
        {label}
      </span>
      <div className={`p-2 rounded-lg ${accent}`}>{icon}</div>
    </div>
    <div
      className={`text-2xl font-bold tracking-tight ${
        alert && value < 0 ? "text-red-600" : "text-gray-900"
      }`}
    >
      {formatCurrency(value)}
    </div>
    {subtitle && <p className="text-xs text-gray-500 mt-1 font-medium">{subtitle}</p>}
  </div>
);

// ─── TABS ────────────────────────────────────────────────────────

const TABS = ["Overview", "Tasks", "Budget", "Tender", "Documents", "Team"];

// ─── Component ──────────────────────────────────────────────────

export default function AdminProjectBudgetPage() {
  const router = useRouter();
  const params = useParams();
  const { user, loading: authLoading } = useAuth();

  const [pathname] = useState("/admin/projects");
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [budgetItems, setBudgetItems] = useState<BudgetItem[]>([]);
  const [stats, setStats] = useState<BudgetStats | null>(null);
  const [projectName, setProjectName] = useState("");
  const [totalBudget, setTotalBudget] = useState(0);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<BudgetItem | null>(null);

  const defaultForm = {
    description: "",
    category: "Construction",
    vendor: "",
    quantity: 1,
    unitCost: 0,
    committedStatus: "Pending",
    invoicedAmount: 0,
    paidAmount: 0,
    notes: "",
  };

  const [formData, setFormData] = useState(defaultForm);
  const [sortField, setSortField] = useState<string>("category");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [filterCategory, setFilterCategory] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [saving, setSaving] = useState(false);

  const CATEGORIES = [
    "Construction", "Design", "Joinery", "MEP", "Fixtures",
    "Contingency", "Professional Fees", "Other",
  ];
  const STATUSES = ["All", "Pending", "Committed", "Invoiced", "Paid", "Cancelled"];

  // ── Auth ──

  useEffect(() => {
    if (!authLoading && !user) { router.replace("/"); return; }
    if (!authLoading && user && user.role !== "admin") {
      router.replace("/user/projects"); return;
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user?.role === "admin" && params.id) {
      loadAll();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, params.id]);

  // ── Data loading ──

  /**
   * loadAll: fetches project info, budget items, and stats in parallel.
   * Call this on mount and after every CRUD operation to guarantee the UI
   * always reflects the latest server state.
   */
  const loadAll = useCallback(
    async (showSpinner = true) => {
      if (showSpinner) setInitialLoading(true);
      else setRefreshing(true);

      try {
        const [projectData, itemsData, statsData] = await Promise.all([
          apiClient.get(`/api/projects/${params.id}`),
          apiClient.get(`/api/projects/${params.id}/budget`),
          apiClient.get(`/api/projects/${params.id}/budget/stats`),
        ]);

        // Project
        setProjectName(projectData.projectName);
        setTotalBudget(safeNum(projectData.totalBudget ?? projectData.budget));

        // Budget items (flat array)
        const items: BudgetItem[] = Array.isArray(itemsData) ? itemsData : [];
        setBudgetItems(items);

        // Stats
        setStats({
          totalBudget: safeNum(statsData.totalBudget),
          totalCommitted: safeNum(statsData.totalCommitted),
          eac: safeNum(statsData.eac),
          variance: safeNum(statsData.variance),
          percentUsed: safeNum(statsData.percentUsed),
          breakdown: {
            paid: safeNum(statsData.breakdown?.paid),
            invoiced: safeNum(statsData.breakdown?.invoiced),
            committed: safeNum(statsData.breakdown?.committed),
            planned: safeNum(statsData.breakdown?.planned),
          },
          categoryBreakdown: Array.isArray(statsData.categoryBreakdown)
            ? statsData.categoryBreakdown
            : [],
        });
      } catch (error) {
        console.error("Error loading budget data:", error);
      } finally {
        setInitialLoading(false);
        setRefreshing(false);
      }
    },
    [params.id],
  );

  // ── CRUD ──

  const handleAddItem = async () => {
    if (!formData.description.trim()) {
      alert("Please fill in Description");
      return;
    }
    if (!formData.unitCost || safeNum(formData.unitCost) <= 0) {
      alert("Please enter a Unit Cost greater than 0");
      return;
    }
    setSaving(true);
    try {
      const qty = safeNum(formData.quantity) || 1;
      const cost = safeNum(formData.unitCost);
      await apiClient.post(`/api/projects/${params.id}/budget`, {
        ...formData,
        quantity: qty,
        unitCost: cost,
        invoicedAmount: safeNum(formData.invoicedAmount),
        paidAmount: safeNum(formData.paidAmount),
        totalCost: qty * cost,
      });
      // Refresh everything from server so totals are accurate
      await loadAll(false);
      closeAddModal();
    } catch (error: any) {
      alert(error?.response?.data?.message || "Failed to add budget item");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateItem = async () => {
    if (!editingItem) return;
    if (!formData.description.trim()) {
      alert("Please fill in Description");
      return;
    }
    if (!formData.unitCost || safeNum(formData.unitCost) <= 0) {
      alert("Please enter a Unit Cost greater than 0");
      return;
    }
    setSaving(true);
    try {
      const qty = safeNum(formData.quantity) || 1;
      const cost = safeNum(formData.unitCost);
      await apiClient.put(`/api/budget/${editingItem._id}`, {
        ...formData,
        quantity: qty,
        unitCost: cost,
        invoicedAmount: safeNum(formData.invoicedAmount),
        paidAmount: safeNum(formData.paidAmount),
        totalCost: qty * cost,
      });
      await loadAll(false);
      closeEditModal();
    } catch (error: any) {
      alert(error?.response?.data?.message || "Failed to update budget item");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteItem = async (itemId: string, isTenderSynced?: boolean) => {
    if (isTenderSynced) {
      alert(
        "This item was auto-created from a Tender award and cannot be deleted. To remove it, cancel the tender award first.",
      );
      return;
    }
    if (!confirm("Delete this budget item?")) return;
    try {
      await apiClient.delete(`/api/budget/${itemId}`);
      await loadAll(false);
    } catch (error: any) {
      alert(error?.response?.data?.message || "Failed to delete");
    }
  };

  // ── Modal helpers ──

  const openEditModal = (item: BudgetItem) => {
    setEditingItem(item);
    setFormData({
      description: item.description,
      category: item.category,
      vendor: item.vendor || "",
      quantity: safeNum(item.quantity) || 1,
      unitCost: safeNum(item.unitCost),
      committedStatus: item.committedStatus,
      invoicedAmount: safeNum(item.invoicedAmount),
      paidAmount: safeNum(item.paidAmount),
      notes: item.notes || "",
    });
    setIsEditModalOpen(true);
  };

  const closeAddModal = () => { setIsAddModalOpen(false); setFormData(defaultForm); };
  const closeEditModal = () => { setIsEditModalOpen(false); setEditingItem(null); setFormData(defaultForm); };

  // ── Sort ──

  const handleSort = (field: string) => {
    setSortField(field);
    setSortDirection(sortField === field && sortDirection === "asc" ? "desc" : "asc");
  };

  // ── Derived values ──

  const categoryOptions = ["All", ...new Set(budgetItems.map((i) => i.category))];

  const filteredItems = budgetItems
    .filter((item) => {
      if (filterCategory !== "All" && item.category !== filterCategory) return false;
      if (filterStatus !== "All" && item.committedStatus !== filterStatus) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (
          !item.description.toLowerCase().includes(q) &&
          !(item.vendor || "").toLowerCase().includes(q)
        )
          return false;
      }
      return true;
    })
    .sort((a, b) => {
      let aVal: any = (a as any)[sortField];
      let bVal: any = (b as any)[sortField];
      if (typeof aVal === "string") aVal = aVal.toLowerCase();
      if (typeof bVal === "string") bVal = bVal.toLowerCase();
      if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });

  const filteredTotal = filteredItems.reduce((sum, i) => sum + itemTotal(i), 0);
  const tenderSyncedItems = budgetItems.filter((i) => i.isTenderSynced);
  const tenderSyncedTotal = tenderSyncedItems.reduce((sum, i) => sum + itemTotal(i), 0);

  const activeTotalBudget = stats?.totalBudget ?? totalBudget;
  const committed = stats?.totalCommitted ?? 0;
  const utilization =
    activeTotalBudget > 0
      ? Math.min((committed / activeTotalBudget) * 100, 100)
      : 0;
  const utilizationDisplay = safeNum(utilization).toFixed(1);
  const isOverBudget = stats ? stats.variance < 0 : false;
  const remaining = activeTotalBudget - committed;

  // ── Tab routes ──

  const TAB_ROUTES: Record<string, string> = {
    Overview: `/admin/projects/${params.id}`,
    Tasks: `/admin/projects/${params.id}/tasks`,
    Tender: `/admin/projects/${params.id}/tender`,
    Documents: `/admin/projects/${params.id}/documents`,
    Team: `/admin/projects/${params.id}/team`,
  };

  if (authLoading || initialLoading) return <FitoutLoadingSpinner />;
  if (!user || user.role !== "admin") return <FitoutLoadingSpinner />;

  // ── Shared form fields ──

  const renderForm = (isTenderSynced = false) => (
    <div className="space-y-5">
      {/* Description */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
          Description <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          disabled={isTenderSynced}
          className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
          placeholder="e.g., Main Construction Works"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Category */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
            Category
          </label>
          <select
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            disabled={isTenderSynced}
            className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {/* Status */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
            Status
          </label>
          <select
            value={formData.committedStatus}
            onChange={(e) => setFormData({ ...formData, committedStatus: e.target.value })}
            className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {["Pending", "Committed", "Invoiced", "Paid", "Cancelled"].map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Vendor */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
          Vendor
        </label>
        <input
          type="text"
          value={formData.vendor}
          onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
          disabled={isTenderSynced}
          className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
          placeholder="Contractor / vendor name"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Quantity */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
            Quantity
          </label>
          <input
            type="number"
            min="1"
            value={formData.quantity}
            onChange={(e) =>
              setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })
            }
            disabled={isTenderSynced}
            className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
          />
        </div>

        {/* Unit Cost */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
            Unit Cost <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
            <input
              type="number"
              min="0"
              value={formData.unitCost || ""}
              onChange={(e) =>
                setFormData({ ...formData, unitCost: parseFloat(e.target.value) || 0 })
              }
              disabled={isTenderSynced}
              className="w-full pl-7 pr-3.5 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
              placeholder="0"
            />
          </div>
        </div>
      </div>

      {/* Total Cost preview */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-4 flex items-center justify-between">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-blue-500">
            Total Cost
          </div>
          <div className="text-2xl font-bold text-blue-900 mt-0.5">
            {formatCurrency((safeNum(formData.quantity) || 1) * safeNum(formData.unitCost))}
          </div>
        </div>
        <DollarSign size={32} className="text-blue-200" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Invoiced Amount */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
            Invoiced Amount
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
            <input
              type="number"
              min="0"
              value={formData.invoicedAmount || ""}
              onChange={(e) =>
                setFormData({ ...formData, invoicedAmount: parseFloat(e.target.value) || 0 })
              }
              className="w-full pl-7 pr-3.5 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Paid Amount */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
            Paid Amount
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
            <input
              type="number"
              min="0"
              value={formData.paidAmount || ""}
              onChange={(e) =>
                setFormData({ ...formData, paidAmount: parseFloat(e.target.value) || 0 })
              }
              className="w-full pl-7 pr-3.5 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
          Notes
        </label>
        <textarea
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          rows={2}
          className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          placeholder="Optional notes or remarks"
        />
      </div>
    </div>
  );

  // ─── Render ───────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50/80">
      <AdminSidebar pathname={pathname} setPathname={() => {}} />
      <AdminHeader />

      <main className="lg:ml-[var(--fm-sidebar-width)] mt-16 p-4 sm:p-6 lg:p-8 transition-all duration-300">

        {/* ── Breadcrumb & Header ── */}
        <div className="mb-8">
          <button
            onClick={() => router.push(`/admin/projects/${params.id}`)}
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors mb-4 group"
          >
            <ChevronRight
              size={14}
              className="rotate-180 group-hover:-translate-x-0.5 transition-transform"
            />
            {projectName || "Back to Project"}
          </button>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
                Budget Management
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Track costs, commitments, and tender-synced items
              </p>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-auto">
              {/* Manual refresh button */}
              <button
                onClick={() => loadAll(false)}
                disabled={refreshing}
                title="Refresh budget data"
                className="p-2.5 border border-gray-200 text-gray-500 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
              </button>
              <button
                onClick={() => { setFormData(defaultForm); setIsAddModalOpen(true); }}
                className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 active:scale-95 transition-all text-sm font-medium shadow-sm"
              >
                <Plus size={16} />
                Add Budget Item
              </button>
            </div>
          </div>
        </div>

        {/* ── Tab Navigation ── */}
        <div className="mb-8 border-b border-gray-200 overflow-x-auto -mx-1 px-1">
          <div className="flex min-w-max gap-1 whitespace-nowrap">
            {TABS.map((tab) => (
              <button
                key={tab}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  tab === "Budget"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300"
                }`}
                onClick={() => { if (TAB_ROUTES[tab]) router.push(TAB_ROUTES[tab]); }}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* ── Financial Summary Cards ── */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mb-6">
          <FinanceCard
            label="Total Budget"
            value={activeTotalBudget}
            accent="bg-gray-100"
            icon={<BarChart3 size={16} className="text-gray-500" />}
          />
          <FinanceCard
            label="Committed"
            value={committed}
            subtitle={`${utilizationDisplay}% of budget`}
            accent="bg-blue-100"
            icon={<DollarSign size={16} className="text-blue-500" />}
          />
          <FinanceCard
            label="Invoiced"
            value={stats?.breakdown.invoiced ?? 0}
            accent="bg-amber-100"
            icon={<TrendingUp size={16} className="text-amber-500" />}
          />
          <FinanceCard
            label="Paid"
            value={stats?.breakdown.paid ?? 0}
            accent="bg-emerald-100"
            icon={<TrendingUp size={16} className="text-emerald-500" />}
          />
          <FinanceCard
            label="Remaining"
            value={remaining}
            alert
            accent={isOverBudget ? "bg-red-100" : "bg-gray-100"}
            icon={
              isOverBudget ? (
                <TrendingDown size={16} className="text-red-500" />
              ) : (
                <TrendingUp size={16} className="text-gray-500" />
              )
            }
          />
        </div>

        {/* ── Budget Utilization Bar ── */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div>
              <span className="text-sm font-semibold text-gray-700">Budget Utilization</span>
              {isOverBudget && (
                <span className="ml-2 inline-flex items-center gap-1 text-xs text-red-600 font-medium">
                  <AlertCircle size={12} /> Over budget
                </span>
              )}
            </div>
            <span
              className={`text-sm font-bold ${isOverBudget ? "text-red-600" : "text-gray-700"}`}
            >
              {utilizationDisplay}%
            </span>
          </div>

          <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
            <div
              className={`h-2.5 rounded-full transition-all duration-700 ${
                parseFloat(utilizationDisplay) > 90
                  ? "bg-red-500"
                  : parseFloat(utilizationDisplay) > 70
                  ? "bg-amber-500"
                  : "bg-blue-600"
              }`}
              style={{ width: `${utilization}%` }}
            />
          </div>

          <div className="flex items-center justify-between mt-3 text-xs text-gray-400 font-medium">
            <span>$0</span>
            <span>{formatCurrency(activeTotalBudget)}</span>
          </div>

          {tenderSyncedItems.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-2 bg-blue-50 border border-blue-100 rounded-lg px-4 py-2.5">
              <Link2 size={13} className="text-blue-600 shrink-0" />
              <span className="text-xs text-blue-700 font-medium">
                {tenderSyncedItems.length} item
                {tenderSyncedItems.length > 1 ? "s" : ""} auto-synced from tender awards (
                {formatCurrency(tenderSyncedTotal)})
              </span>
              <button
                onClick={() => setFilterStatus("Committed")}
                className="ml-auto text-xs text-blue-600 hover:text-blue-800 font-semibold underline underline-offset-2"
              >
                View
              </button>
            </div>
          )}
        </div>

        {/* ── Filters & Search ── */}
        <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="relative flex-1 min-w-0">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                  <path
                    d="M10 6.5a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0Zm-.889 3.818a4.5 4.5 0 1 1 .707-.707l2.786 2.785-.707.707-2.786-2.785Z"
                    fill="currentColor"
                  />
                </svg>
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Search by description or vendor..."
              />
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {categoryOptions.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div className="text-xs text-gray-500 font-medium shrink-0">
              {filteredItems.length} items · {formatCurrency(filteredTotal)}
            </div>
          </div>
        </div>

        {/* ── Budget Table ── */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm mb-6">
          {filteredItems.length === 0 ? (
            <div className="py-20 text-center">
              <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <BarChart3 size={24} className="text-gray-400" />
              </div>
              <h3 className="text-base font-semibold text-gray-800 mb-1">
                {budgetItems.length === 0
                  ? "No budget items yet"
                  : "No items match your filters"}
              </h3>
              <p className="text-sm text-gray-500 mb-6 max-w-sm mx-auto">
                {budgetItems.length === 0
                  ? "Add budget items manually or award tenders to auto-populate."
                  : "Try adjusting your filters or search query."}
              </p>
              {budgetItems.length === 0 && (
                <button
                  onClick={() => { setFormData(defaultForm); setIsAddModalOpen(true); }}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  <Plus size={16} />
                  Add First Budget Item
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    {[
                      { label: "Description", field: "description", align: "left" },
                      { label: "Category", field: "category", align: "left" },
                      { label: "Vendor", field: null, align: "left" },
                      { label: "Qty", field: null, align: "right" },
                      { label: "Unit Cost", field: "unitCost", align: "right" },
                      { label: "Total", field: "totalCost", align: "right" },
                      { label: "Status", field: null, align: "left" },
                      { label: "Invoiced", field: null, align: "right" },
                      { label: "Paid", field: null, align: "right" },
                      { label: "Source", field: null, align: "left" },
                      { label: "Actions", field: null, align: "right" },
                    ].map(({ label, field, align }) => (
                      <th
                        key={label}
                        className={`px-4 py-3 text-${align} text-xs font-semibold uppercase tracking-wider text-gray-400 ${
                          field ? "cursor-pointer hover:text-gray-600 select-none" : ""
                        }`}
                        onClick={() => field && handleSort(field)}
                      >
                        <div
                          className={`flex items-center gap-1 ${
                            align === "right" ? "justify-end" : ""
                          }`}
                        >
                          {label}
                          {field && <ArrowUpDown size={11} className="opacity-50" />}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredItems.map((item, index) => {
                    const total = itemTotal(item);
                    return (
                      <tr
                        key={item._id || `${item.description}-${index}`}
                        className="hover:bg-gray-50/80 transition-colors"
                      >
                        <td className="px-4 py-3.5">
                          <div className="font-medium text-gray-900 truncate max-w-[200px]">
                            {item.description}
                          </div>
                          {item.notes && (
                            <div className="text-xs text-gray-400 truncate max-w-[200px] mt-0.5">
                              {item.notes}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-gray-600 whitespace-nowrap">
                          {item.category}
                        </td>
                        <td className="px-4 py-3.5 text-gray-600 whitespace-nowrap">
                          {item.vendor || "—"}
                        </td>
                        <td className="px-4 py-3.5 text-gray-600 text-right">
                          {safeNum(item.quantity)}
                        </td>
                        <td className="px-4 py-3.5 text-gray-600 text-right whitespace-nowrap">
                          {formatCurrency(item.unitCost)}
                        </td>
                        <td className="px-4 py-3.5 font-semibold text-gray-900 text-right whitespace-nowrap">
                          {formatCurrency(total)}
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <StatusBadge status={item.committedStatus} />
                        </td>
                        <td className="px-4 py-3.5 text-gray-600 text-right whitespace-nowrap">
                          {formatCurrency(item.invoicedAmount)}
                        </td>
                        <td className="px-4 py-3.5 text-gray-600 text-right whitespace-nowrap">
                          {formatCurrency(item.paidAmount)}
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          {item.isTenderSynced ? (
                            <button
                              onClick={() =>
                                router.push(`/admin/projects/${params.id}/tender`)
                              }
                              className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 border border-blue-100 rounded-md text-xs font-medium hover:bg-blue-100 transition-colors"
                            >
                              <Link2 size={11} />
                              {item.tenderNumber || "Tender"}
                            </button>
                          ) : (
                            <span className="text-xs text-gray-400 font-medium">
                              Manual
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => openEditModal(item)}
                              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                              title="Edit"
                            >
                              <Edit size={15} />
                            </button>
                            <button
                              onClick={() => handleDeleteItem(item._id, item.isTenderSynced)}
                              disabled={item.isTenderSynced}
                              className={`p-1.5 rounded-md transition-colors ${
                                item.isTenderSynced
                                  ? "text-gray-200 cursor-not-allowed"
                                  : "text-gray-400 hover:text-red-600 hover:bg-red-50"
                              }`}
                              title={
                                item.isTenderSynced
                                  ? "Tender-synced items cannot be deleted"
                                  : "Delete"
                              }
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-50 border-t-2 border-gray-200">
                    <td
                      colSpan={5}
                      className="px-4 py-3 text-sm font-bold text-gray-700"
                    >
                      Total ({filteredItems.length} items)
                    </td>
                    <td className="px-4 py-3 text-sm font-bold text-gray-900 text-right whitespace-nowrap">
                      {formatCurrency(filteredTotal)}
                    </td>
                    <td className="px-4 py-3" />
                    <td className="px-4 py-3 text-sm font-bold text-gray-900 text-right whitespace-nowrap">
                      {formatCurrency(
                        filteredItems.reduce(
                          (sum, i) => sum + safeNum(i.invoicedAmount),
                          0,
                        ),
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm font-bold text-gray-900 text-right whitespace-nowrap">
                      {formatCurrency(
                        filteredItems.reduce(
                          (sum, i) => sum + safeNum(i.paidAmount),
                          0,
                        ),
                      )}
                    </td>
                    <td colSpan={2} />
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>

        {/* ── Category Summary ── */}
        {stats && stats.categoryBreakdown.filter((c) => c.spent > 0).length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h3 className="text-base font-semibold text-gray-900 mb-5">
              Category Breakdown
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {stats.categoryBreakdown
                .filter((c) => c.spent > 0)
                .map((cat) => {
                  const catPercent =
                    activeTotalBudget > 0
                      ? Math.min((cat.spent / activeTotalBudget) * 100, 100)
                      : 0;
                  const catTenderCount = budgetItems.filter(
                    (i) => i.category === cat.category && i.isTenderSynced,
                  ).length;

                  return (
                    <div
                      key={cat.category}
                      className="border border-gray-100 rounded-xl p-4 bg-gray-50/50"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <span className="text-xs font-bold text-gray-600 uppercase tracking-wide">
                          {cat.category}
                        </span>
                        <span className="text-xs text-gray-400 font-medium">
                          {cat.itemCount}
                        </span>
                      </div>
                      <div className="text-lg font-bold text-gray-900">
                        {formatCurrency(cat.spent)}
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        {catPercent.toFixed(1)}% of budget
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1 mt-3">
                        <div
                          className="bg-blue-500 h-1 rounded-full transition-all"
                          style={{ width: `${catPercent}%` }}
                        />
                      </div>
                      {catTenderCount > 0 && (
                        <div className="text-xs text-blue-500 mt-2 flex items-center gap-1">
                          <Link2 size={10} /> {catTenderCount} from tender
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* ═══ ADD MODAL ═══ */}
        {isAddModalOpen && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white w-full max-w-xl rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto">
              <div className="p-6 sm:p-8">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Add Budget Item</h2>
                    <p className="text-sm text-gray-500 mt-0.5">Fill in the details below</p>
                  </div>
                  <button
                    onClick={closeAddModal}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>

                {renderForm(false)}

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={closeAddModal}
                    className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddItem}
                    disabled={saving}
                    className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-300 text-sm font-medium transition-colors"
                  >
                    {saving ? "Adding…" : "Add Item"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═══ EDIT MODAL ═══ */}
        {isEditModalOpen && editingItem && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white w-full max-w-xl rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto">
              <div className="p-6 sm:p-8">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Edit Budget Item</h2>
                    {editingItem.isTenderSynced && (
                      <div className="flex items-center gap-1.5 mt-1 text-xs text-blue-600 font-medium">
                        <Link2 size={12} />
                        Auto-synced from Tender {editingItem.tenderNumber}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={closeEditModal}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>

                {editingItem.isTenderSynced && (
                  <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-5 flex gap-3">
                    <AlertCircle size={16} className="text-blue-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-blue-800 leading-relaxed">
                      This item was automatically created from a tender award. You can
                      update invoiced/paid amounts and notes, but description, vendor, and
                      total amount are linked to the awarded tender.
                    </p>
                  </div>
                )}

                {renderForm(editingItem.isTenderSynced)}

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={closeEditModal}
                    className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpdateItem}
                    disabled={saving}
                    className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-300 text-sm font-medium transition-colors"
                  >
                    {saving ? "Saving…" : "Save Changes"}
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