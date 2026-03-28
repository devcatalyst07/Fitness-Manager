"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft,
  FileDown,
  ChevronDown,
  ChevronUp,
  Plus,
  X,
  Edit,
  Trash2,
  TrendingUp,
  TrendingDown,
  DollarSign,
  BarChart3,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { apiClient } from "@/lib/axios";
import AdminSidebar from "@/components/AdminSidebar";
import AdminHeader from "@/components/AdminHeader";
import FitoutLoadingSpinner from "@/components/FitoutLoadingSpinner";
import { hasPermission } from "@/utils/permissions";

// ─── Types ──────────────────────────────────────────────────────

interface BudgetItem {
  _id: string;
  description: string;
  vendor: string;
  quantity: number;
  unitCost: number;
  committedStatus: "Paid" | "Invoiced" | "Committed" | "Planned";
  category: string;
}

interface CategoryData {
  category: string;
  items: BudgetItem[];
  totalSpent: number;
  itemCount: number;
  expanded: boolean;
}

interface BudgetStats {
  totalBudget: number;
  totalCommitted: number;
  eac: number;
  variance: number;
  percentUsed: number;
}

interface Permission {
  id: string;
  label: string;
  checked: boolean;
  children?: Permission[];
}

interface RoleData {
  _id: string;
  name: string;
  permissions: Permission[];
}

// ─── Utilities ──────────────────────────────────────────────────

const safeNum = (val: unknown): number => {
  const n = Number(val);
  return isFinite(n) ? n : 0;
};

const itemTotal = (item: BudgetItem): number =>
  safeNum(item.quantity) * safeNum(item.unitCost);

const formatCurrency = (amount: unknown): string =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(safeNum(amount));

// ─── Status config ───────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { dot: string; bg: string; text: string }> = {
  Planned: { dot: "bg-slate-400", bg: "bg-slate-50 border border-slate-200", text: "text-slate-700" },
  Committed: { dot: "bg-orange-400", bg: "bg-orange-50 border border-orange-200", text: "text-orange-700" },
  Invoiced: { dot: "bg-blue-500", bg: "bg-blue-50 border border-blue-200", text: "text-blue-700" },
  Paid: { dot: "bg-emerald-500", bg: "bg-emerald-50 border border-emerald-200", text: "text-emerald-700" },
};

const StatusBadge = ({ status }: { status: string }) => {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG["Planned"];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium ${cfg.bg} ${cfg.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {status}
    </span>
  );
};

// ─── Stat Card ───────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: number;
  subtitle?: string;
  colorClass: string;
  borderClass: string;
  textClass: string;
  icon: React.ReactNode;
  isNegative?: boolean;
}

const StatCard = ({ label, value, subtitle, colorClass, borderClass, textClass, icon, isNegative }: StatCardProps) => (
  <div className={`${colorClass} ${borderClass} border-2 rounded-xl p-5 shadow-sm`}>
    <div className="flex items-start justify-between mb-3">
      <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">{label}</span>
      <div className={`p-2 rounded-lg bg-white/60`}>{icon}</div>
    </div>
    <div className={`text-2xl sm:text-3xl font-bold tracking-tight ${isNegative && value < 0 ? "text-red-700" : textClass}`}>
      {formatCurrency(value)}
    </div>
    {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
  </div>
);

// ─── Component ──────────────────────────────────────────────────

export default function ProjectBudgetPage() {
  const router = useRouter();
  const params = useParams();
  const { user, loading: authLoading } = useAuth();

  const [pathname, setPathname] = useState("/user/projects");
  const [loading, setLoading] = useState(true);
  const [roleData, setRoleData] = useState<RoleData | null>(null);
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [stats, setStats] = useState<BudgetStats | null>(null);
  const [projectName, setProjectName] = useState("");

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<BudgetItem | null>(null);

  const defaultForm = {
    description: "",
    vendor: "",
    quantity: 1,
    unitCost: 0,
    committedStatus: "Planned",
    category: "Design",
  };

  const [formData, setFormData] = useState(defaultForm);
  const [saving, setSaving] = useState(false);

  // ── Auth ──

  useEffect(() => {
    if (!authLoading && !user) { router.replace("/"); return; }
    if (!authLoading && user && user.role === "admin") {
      router.replace(`/admin/projects/${params.id}/budget`);
      return;
    }
  }, [user, authLoading, router, params.id]);

  useEffect(() => {
    if (user?.role === "user" && params.id) fetchRolePermissions();
  }, [user, params.id]);

  // ── Data ──

  const fetchRolePermissions = async () => {
    try {
      let roleId = (user as any)?.roleId;
      if (!roleId) {
        try {
          const profile = await apiClient.get("/api/auth/me");
          roleId = profile?.roleId;
        } catch {}
      }
      if (roleId) {
        const data = await apiClient.get(`/api/roles/${roleId}`);
        setRoleData(data);
        if (!hasPermission("projects-view-details-budget", data.permissions)) {
          alert("You do not have permission to access Budget.");
          router.replace("/user/projects");
          return;
        }
      }
      fetchProject();
      fetchBudget();
      fetchStats();
    } catch (error) {
      console.error("Error fetching permissions:", error);
      fetchProject();
      fetchBudget();
      fetchStats();
    } finally {
      setLoading(false);
    }
  };

  const fetchProject = async () => {
    try {
      const data = await apiClient.get(`/api/projects/${params.id}`);
      setProjectName(data.projectName);
    } catch (error) {
      console.error("Error fetching project:", error);
    }
  };

  const fetchBudget = async () => {
    try {
      const data = await apiClient.get(`/api/projects/${params.id}/budget`);
      const items = Array.isArray(data) ? data : [];
      setCategories(items.map((cat: any) => ({
        ...cat,
        totalSpent: safeNum(cat.totalSpent),
        itemCount: safeNum(cat.itemCount),
        items: Array.isArray(cat.items) ? cat.items.map((item: any) => ({
          ...item,
          quantity: safeNum(item.quantity),
          unitCost: safeNum(item.unitCost),
        })) : [],
        expanded: false,
      })));
    } catch (error) {
      console.error("Error fetching budget:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const data = await apiClient.get(`/api/projects/${params.id}/budget/stats`);
      setStats({
        totalBudget: safeNum(data.totalBudget),
        totalCommitted: safeNum(data.totalCommitted),
        eac: safeNum(data.eac),
        variance: safeNum(data.variance),
        percentUsed: safeNum(data.percentUsed),
      });
    } catch (error) {
      console.error("Error fetching budget stats:", error);
    }
  };

  // ── CRUD ──

  const handleCreateBudgetItem = async () => {
    if (!formData.description || !formData.vendor) {
      alert("Please fill in all required fields");
      return;
    }
    setSaving(true);
    try {
      await apiClient.post(`/api/projects/${params.id}/budget`, {
        ...formData,
        quantity: safeNum(formData.quantity) || 1,
        unitCost: safeNum(formData.unitCost),
      });
      await fetchBudget();
      await fetchStats();
      setIsCreateModalOpen(false);
      setFormData(defaultForm);
    } catch (error: any) {
      alert(error?.response?.data?.message || "Failed to create budget item");
    } finally {
      setSaving(false);
    }
  };

  const handleEditItem = (item: BudgetItem) => {
    setSelectedItem({
      ...item,
      quantity: safeNum(item.quantity),
      unitCost: safeNum(item.unitCost),
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateBudgetItem = async () => {
    if (!selectedItem) return;
    setSaving(true);
    try {
      await apiClient.put(
        `/api/projects/${params.id}/budget/${selectedItem._id}`,
        {
          ...selectedItem,
          quantity: safeNum(selectedItem.quantity) || 1,
          unitCost: safeNum(selectedItem.unitCost),
        },
      );
      await fetchBudget();
      await fetchStats();
      setIsEditModalOpen(false);
      setSelectedItem(null);
    } catch (error: any) {
      alert(error?.response?.data?.message || "Failed to update budget item");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteBudgetItem = async (itemId: string) => {
    if (!confirm("Are you sure you want to delete this budget item?")) return;
    try {
      await apiClient.delete(`/api/projects/${params.id}/budget/${itemId}`);
      await fetchBudget();
      await fetchStats();
    } catch {
      alert("Failed to delete budget item");
    }
  };

  const toggleCategory = (index: number) => {
    const n = [...categories];
    n[index].expanded = !n[index].expanded;
    setCategories(n);
  };

  const expandAll = () => setCategories(categories.map((cat) => ({ ...cat, expanded: true })));
  const collapseAll = () => setCategories(categories.map((cat) => ({ ...cat, expanded: false })));

  if (authLoading || loading) return <FitoutLoadingSpinner />;
  if (!user || user.role !== "user") return <FitoutLoadingSpinner />;

  // ── Permissions ──

  const permissions = roleData?.permissions || [];
  const hasRoleData = !!roleData;
  const canAddItem = !hasRoleData || hasPermission("projects-budget-add", permissions);
  const canExport = !hasRoleData || hasPermission("projects-budget-export", permissions);
  const canViewOverview = !hasRoleData || hasPermission("projects-view-details-overview", permissions);
  const canViewTasks = !hasRoleData || hasPermission("projects-view-details-task", permissions);
  const canViewBudget = !hasRoleData || hasPermission("projects-view-details-budget", permissions);
  const canViewTender = !hasRoleData || hasPermission("projects-view-details-tender", permissions);
  const canViewDocuments = !hasRoleData || hasPermission("projects-view-details-documents", permissions);
  const canViewTeam = !hasRoleData || hasPermission("projects-view-details-team", permissions);

  // ── Derived ──

  const ITEM_CATEGORIES = ["Design", "Approvals", "Construction", "Joinery", "MEP", "Fixtures", "Contingency", "Misc"];
  const isOverBudget = stats ? stats.variance < 0 : false;
  const percentBar = stats ? Math.min(safeNum(stats.percentUsed), 100) : 0;

  // ─── Render ───────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50/80">
      <AdminSidebar
        pathname={pathname}
        setPathname={setPathname}
        userRole="user"
        permissions={permissions}
      />
      <AdminHeader />

      <main className="lg:ml-[var(--fm-sidebar-width)] mt-16 p-4 sm:p-6 lg:p-8 transition-all duration-300">

        {/* ── Header ── */}
        <div className="mb-8">
          <button
            onClick={() => router.push("/user/projects")}
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors mb-4 group"
          >
            <ArrowLeft size={15} className="group-hover:-translate-x-0.5 transition-transform" />
            {projectName || "Back to Projects"}
          </button>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">Budget</h1>
              <p className="text-sm text-gray-500 mt-1">Budget management and tracking</p>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-auto">
              {canAddItem && (
                <button
                  onClick={() => { setFormData(defaultForm); setIsCreateModalOpen(true); }}
                  className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 active:scale-95 transition-all text-sm font-medium shadow-sm"
                >
                  <Plus size={15} />
                  Add Item
                </button>
              )}
              {canExport && (
                <button className="inline-flex items-center gap-2 px-4 py-2.5 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 text-sm font-medium transition-colors">
                  <FileDown size={15} />
                  Export CSV
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="mb-8 border-b border-gray-200 overflow-x-auto -mx-1 px-1">
          <div className="flex min-w-max gap-1 whitespace-nowrap">
            {canViewOverview && (
              <button
                onClick={() => router.push(`/user/projects/${params.id}/overview`)}
                className="px-4 py-3 text-sm font-medium border-b-2 border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300 transition-colors"
              >
                Overview
              </button>
            )}
            {canViewTasks && (
              <button
                onClick={() => router.push(`/user/projects/${params.id}/tasks`)}
                className="px-4 py-3 text-sm font-medium border-b-2 border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300 transition-colors"
              >
                Tasks
              </button>
            )}
            {canViewBudget && (
              <button className="px-4 py-3 text-sm font-medium border-b-2 border-blue-600 text-blue-600">
                Budget
              </button>
            )}
            {canViewTender && (
              <button
                onClick={() => router.push(`/user/projects/${params.id}/tender`)}
                className="px-4 py-3 text-sm font-medium border-b-2 border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300 transition-colors"
              >
                Tender
              </button>
            )}
            {canViewDocuments && (
              <button
                onClick={() => router.push(`/user/projects/${params.id}/documents`)}
                className="px-4 py-3 text-sm font-medium border-b-2 border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300 transition-colors"
              >
                Documents
              </button>
            )}
            {canViewTeam && (
              <button
                onClick={() => router.push(`/user/projects/${params.id}/team`)}
                className="px-4 py-3 text-sm font-medium border-b-2 border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300 transition-colors"
              >
                Team
              </button>
            )}
          </div>
        </div>

        {/* ── Stats Cards ── */}
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
            <StatCard
              label="Budget Cap"
              value={stats.totalBudget}
              colorClass="bg-blue-50"
              borderClass="border-blue-200"
              textClass="text-blue-800"
              icon={<BarChart3 size={15} className="text-blue-500" />}
            />
            <StatCard
              label="Committed"
              value={stats.totalCommitted}
              subtitle={`${safeNum(stats.percentUsed).toFixed(1)}% utilized`}
              colorClass="bg-emerald-50"
              borderClass="border-emerald-200"
              textClass="text-emerald-800"
              icon={<DollarSign size={15} className="text-emerald-500" />}
            />
            <StatCard
              label="EAC"
              value={stats.eac}
              subtitle="Estimated at Completion"
              colorClass="bg-amber-50"
              borderClass="border-amber-200"
              textClass="text-amber-800"
              icon={<TrendingUp size={15} className="text-amber-500" />}
            />
            <StatCard
              label="Variance"
              value={stats.variance}
              subtitle={isOverBudget ? "Over Budget" : "Under Budget"}
              colorClass={isOverBudget ? "bg-red-50" : "bg-violet-50"}
              borderClass={isOverBudget ? "border-red-200" : "border-violet-200"}
              textClass={isOverBudget ? "text-red-700" : "text-violet-800"}
              icon={
                isOverBudget
                  ? <TrendingDown size={15} className="text-red-500" />
                  : <TrendingUp size={15} className="text-violet-500" />
              }
              isNegative={isOverBudget}
            />
          </div>
        )}

        {/* ── Budget Utilization Bar ── */}
        {stats && (
          <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-700">Budget Utilization</span>
                {isOverBudget && (
                  <span className="inline-flex items-center gap-1 text-xs text-red-600 font-medium bg-red-50 border border-red-100 px-2 py-0.5 rounded-full">
                    <AlertCircle size={10} /> Over Budget
                  </span>
                )}
              </div>
              <span className={`text-sm font-bold ${isOverBudget ? "text-red-600" : "text-gray-700"}`}>
                {safeNum(stats.percentUsed).toFixed(1)}%
              </span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
              <div
                className={`h-2.5 rounded-full transition-all duration-700 ${
                  percentBar > 90 ? "bg-red-500" : percentBar > 70 ? "bg-amber-500" : "bg-blue-600"
                }`}
                style={{ width: `${percentBar}%` }}
              />
            </div>
            <div className="flex items-center justify-between mt-2 text-xs text-gray-400 font-medium">
              <span>$0</span>
              <span>{formatCurrency(stats.totalBudget)}</span>
            </div>
          </div>
        )}

        {/* ── Expand / Collapse Controls ── */}
        <div className="flex items-center gap-2 mb-4">
          <button
            onClick={expandAll}
            className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors font-medium"
          >
            Expand All
          </button>
          <button
            onClick={collapseAll}
            className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors font-medium"
          >
            Collapse All
          </button>
        </div>

        {/* ── Budget Table ── */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  {["Description", "Vendor", "Qty", "Unit Cost", "Total", "Status", "Actions"].map((col) => (
                    <th
                      key={col}
                      className={`px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-400 ${
                        ["Qty", "Unit Cost", "Total"].includes(col) ? "text-right" : "text-left"
                      }`}
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {categories.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-20 text-center">
                      <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <BarChart3 size={24} className="text-gray-400" />
                      </div>
                      <p className="text-base font-semibold text-gray-800 mb-1">No budget items yet</p>
                      <p className="text-sm text-gray-500">Start by adding your first budget item</p>
                    </td>
                  </tr>
                ) : (
                  categories.map((category, ci) => (
                    <React.Fragment key={category.category}>
                      {/* Category Row */}
                      <tr className="bg-gray-50 border-t-2 border-gray-200">
                        <td colSpan={7} className="px-4 py-3">
                          <button
                            onClick={() => toggleCategory(ci)}
                            className="flex items-center justify-between w-full group"
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center bg-gray-200 group-hover:bg-gray-300 transition-colors`}>
                                {category.expanded
                                  ? <ChevronDown size={14} className="text-gray-600" />
                                  : <ChevronUp size={14} className="text-gray-600" />}
                              </div>
                              <span className="font-bold text-gray-800 text-sm">{category.category}</span>
                              <span className="text-xs text-gray-400 font-medium bg-gray-200 px-2 py-0.5 rounded-full">
                                {category.itemCount} items
                              </span>
                            </div>
                            <span className="text-sm font-bold text-gray-900">
                              {formatCurrency(category.totalSpent)}
                            </span>
                          </button>
                        </td>
                      </tr>

                      {/* Category items */}
                      {category.expanded && category.items.length === 0 && (
                        <tr className="border-b border-gray-100">
                          <td colSpan={7} className="px-4 py-6 text-center text-sm text-gray-400">
                            No items in this category
                          </td>
                        </tr>
                      )}

                      {category.expanded &&
                        category.items.map((item, itemIndex) => (
                          <tr
                            key={`${item._id || `${item.description}-${item.vendor}`}-${itemIndex}`}
                            className="border-b border-gray-100 hover:bg-gray-50/80 transition-colors"
                          >
                            <td className="px-4 py-3.5 text-gray-900 font-medium">
                              {item.description}
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
                              {formatCurrency(itemTotal(item))}
                            </td>
                            <td className="px-4 py-3.5 whitespace-nowrap">
                              <StatusBadge status={item.committedStatus} />
                            </td>
                            <td className="px-4 py-3.5">
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => handleEditItem(item)}
                                  className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                                  title="Edit"
                                >
                                  <Edit size={14} />
                                </button>
                                <button
                                  onClick={() => handleDeleteBudgetItem(item._id)}
                                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                  title="Delete"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                    </React.Fragment>
                  ))
                )}
              </tbody>

              {/* Footer total */}
              {stats && categories.length > 0 && (
                <tfoot>
                  <tr className="bg-gray-50 border-t-2 border-gray-200">
                    <td colSpan={4} className="px-4 py-3 text-sm font-bold text-gray-800">
                      Project Total
                    </td>
                    <td className="px-4 py-3 text-sm font-bold text-gray-900 text-right whitespace-nowrap">
                      {formatCurrency(stats.totalCommitted)}
                    </td>
                    <td colSpan={2} />
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>

        {/* ═══ CREATE MODAL ═══ */}
        {isCreateModalOpen && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white w-full max-w-xl rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto">
              <div className="p-6 sm:p-8">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Add Budget Item</h2>
                    <p className="text-sm text-gray-500 mt-0.5">Fill in the details below</p>
                  </div>
                  <button
                    onClick={() => { setIsCreateModalOpen(false); setFormData(defaultForm); }}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Category */}
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
                      Category <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {ITEM_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
                      Description <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., Interior Design Consultation"
                    />
                  </div>

                  {/* Vendor */}
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
                      Vendor <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.vendor}
                      onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                      className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Contractor / vendor name"
                    />
                  </div>

                  {/* Qty + Unit Cost */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">Quantity</label>
                      <input
                        type="number"
                        min="1"
                        value={formData.quantity}
                        onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
                        className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">Unit Cost ($)</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                        <input
                          type="number"
                          min="0"
                          value={formData.unitCost || ""}
                          onChange={(e) => setFormData({ ...formData, unitCost: parseFloat(e.target.value) || 0 })}
                          className="w-full pl-7 pr-3.5 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Status */}
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">Status</label>
                    <select
                      value={formData.committedStatus}
                      onChange={(e) => setFormData({ ...formData, committedStatus: e.target.value })}
                      className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {["Planned", "Committed", "Invoiced", "Paid"].map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>

                  {/* Total preview */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-4 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-wider text-blue-500">Total Cost</div>
                      <div className="text-2xl font-bold text-blue-900 mt-0.5">
                        {formatCurrency((safeNum(formData.quantity) || 1) * safeNum(formData.unitCost))}
                      </div>
                    </div>
                    <DollarSign size={28} className="text-blue-200" />
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => { setIsCreateModalOpen(false); setFormData(defaultForm); }}
                    className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateBudgetItem}
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
        {isEditModalOpen && selectedItem && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white w-full max-w-xl rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto">
              <div className="p-6 sm:p-8">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Edit Budget Item</h2>
                    <p className="text-sm text-gray-500 mt-0.5">Update the details below</p>
                  </div>
                  <button
                    onClick={() => { setIsEditModalOpen(false); setSelectedItem(null); }}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
                      Category <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={selectedItem.category}
                      onChange={(e) => setSelectedItem({ ...selectedItem, category: e.target.value })}
                      className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {ITEM_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
                      Description <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={selectedItem.description}
                      onChange={(e) => setSelectedItem({ ...selectedItem, description: e.target.value })}
                      className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
                      Vendor <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={selectedItem.vendor}
                      onChange={(e) => setSelectedItem({ ...selectedItem, vendor: e.target.value })}
                      className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">Quantity</label>
                      <input
                        type="number"
                        min="1"
                        value={selectedItem.quantity}
                        onChange={(e) => setSelectedItem({ ...selectedItem, quantity: parseInt(e.target.value) || 1 })}
                        className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">Unit Cost ($)</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                        <input
                          type="number"
                          min="0"
                          value={selectedItem.unitCost || ""}
                          onChange={(e) => setSelectedItem({ ...selectedItem, unitCost: parseFloat(e.target.value) || 0 })}
                          className="w-full pl-7 pr-3.5 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">Status</label>
                    <select
                      value={selectedItem.committedStatus}
                      onChange={(e) => setSelectedItem({ ...selectedItem, committedStatus: e.target.value as any })}
                      className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {["Planned", "Committed", "Invoiced", "Paid"].map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>

                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-4 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-wider text-blue-500">Total Cost</div>
                      <div className="text-2xl font-bold text-blue-900 mt-0.5">
                        {formatCurrency(itemTotal(selectedItem))}
                      </div>
                    </div>
                    <DollarSign size={28} className="text-blue-200" />
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => { setIsEditModalOpen(false); setSelectedItem(null); }}
                    className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpdateBudgetItem}
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