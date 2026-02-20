"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CornerUpLeft, Trash2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import SessionGuard from "@/components/SessionGuard";
import AdminSidebar from "@/components/AdminSidebar";
import AdminHeader from "@/components/AdminHeader";
import FitoutLoadingSpinner from "@/components/FitoutLoadingSpinner";
import { apiClient } from "@/lib/axios";

interface UserAccount {
  id: string;
  name: string;
  email: string;
  username?: string;
  isActive?: boolean;
  emailVerified?: boolean;
  createdAt?: string;
}

type StatusType = "Active" | "Inactive" | "Pending";

const statusStyles: Record<StatusType, string> = {
  Active: "bg-green-100 text-green-700",
  Inactive: "bg-gray-100 text-gray-700",
  Pending: "bg-amber-100 text-amber-700",
};

export default function AdminUsersPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [error, setError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<UserAccount | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!authLoading && user && user.role !== "admin") {
      router.replace("/user/dashboard");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user && user.role === "admin") {
      fetchUsers();
    }
  }, [user]);

  const fetchUsers = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await apiClient.get<UserAccount[]>("/api/admin/users");
      setUsers(data);
    } catch (err) {
      console.error("Error fetching users:", err);
      setError("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const getStatus = (account: UserAccount): StatusType => {
    if (account.emailVerified === false) return "Pending";
    if (account.isActive === false) return "Inactive";
    return "Active";
  };

  const rows = useMemo(() => {
    return users.map((account) => {
      const displayName = account.username || account.name || account.email;
      const status = getStatus(account);
      return {
        ...account,
        displayName,
        status,
      };
    });
  }, [users]);

  const handleDelete = async () => {
    if (!deleteTarget) return;

    setDeleting(true);
    try {
      await apiClient.delete(`/api/admin/users/${deleteTarget.id}`);
      setUsers((prev) => prev.filter((u) => u.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      console.error("Error deleting user:", err);
      setError("Failed to delete user");
    } finally {
      setDeleting(false);
    }
  };

  if (authLoading || (loading && user?.role === "admin")) {
    return <FitoutLoadingSpinner />;
  }

  return (
    <SessionGuard>
      <div className="min-h-screen bg-gray-50">
        <AdminSidebar userRole="admin" />
        <AdminHeader />

        <main className="lg:ml-64 mt-16 p-4 sm:p-6 lg:p-8">
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              User Accounts
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Manage and monitor all user accounts
            </p>
          </div>

          {error && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-white border-b border-gray-200 text-xs uppercase tracking-wide text-gray-500">
                  <tr>
                    <th className="text-left px-6 py-4">Username</th>
                    <th className="text-left px-6 py-4">Email</th>
                    <th className="text-center px-6 py-4">Status</th>
                    <th className="text-right px-6 py-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {rows.length === 0 ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-6 py-10 text-center text-gray-500"
                      >
                        No users found
                      </td>
                    </tr>
                  ) : (
                    rows.map((account) => (
                      <tr key={account.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 font-medium text-gray-900">
                          {account.displayName}
                        </td>
                        <td className="px-6 py-4 text-gray-600">
                          {account.email}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span
                            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
                              statusStyles[account.status]
                            }`}
                          >
                            {account.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-3">
                            <button
                              type="button"
                              className="p-2 text-gray-400 hover:text-gray-500"
                              aria-label="Undo"
                              disabled
                            >
                              <CornerUpLeft size={16} />
                            </button>
                            <button
                              type="button"
                              className="p-2 text-gray-500 hover:text-red-600"
                              aria-label={`Delete ${account.displayName}`}
                              onClick={() => setDeleteTarget(account)}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>

        {deleteTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md rounded-lg bg-white shadow-lg">
              <div className="p-6">
                <h2 className="text-lg font-semibold text-gray-900">
                  Delete User?
                </h2>
                <p className="mt-2 text-sm text-gray-600">
                  This will permanently delete {deleteTarget.email} from the
                  database.
                </p>
              </div>
              <div className="flex items-center justify-end gap-3 border-t border-gray-100 px-6 py-4">
                <button
                  type="button"
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
                  onClick={() => setDeleteTarget(null)}
                  disabled={deleting}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
                  onClick={handleDelete}
                  disabled={deleting}
                >
                  {deleting ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </SessionGuard>
  );
}
