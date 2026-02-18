"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Upload, Search, FileText, Eye, Trash2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { apiClient } from "@/lib/axios";
import AdminSidebar from "@/components/AdminSidebar";
import AdminHeader from "@/components/AdminHeader";
import FitoutLoadingSpinner from "@/components/FitoutLoadingSpinner";
import { hasPermission } from "@/utils/permissions";

interface Document {
  _id: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  fileType: string;
  uploadedAt: string;
  uploadedBy?: { name: string; email: string };
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

export default function ProjectDocumentsPage() {
  const router = useRouter();
  const params = useParams();
  const { user, loading: authLoading } = useAuth();

  const [pathname, setPathname] = useState("/user/projects");
  const [loading, setLoading] = useState(true);
  const [roleData, setRoleData] = useState<RoleData | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [documents, setDocuments] = useState<Document[]>([]);
  const [projectName, setProjectName] = useState("");
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/");
      return;
    }
    if (!authLoading && user && user.role === "admin") {
      router.replace(`/admin/projects/${params.id}/documents`);
      return;
    }
  }, [user, authLoading, router, params.id]);

  useEffect(() => {
    if (user && user.role === "user" && params.id) fetchRolePermissions();
  }, [user, params.id]);

  const fetchRolePermissions = async () => {
    try {
      let roleId = (user as any)?.roleId;
      if (!roleId) {
        try {
          const p = await apiClient.get("/api/auth/me");
          roleId = p?.roleId;
        } catch {}
      }
      if (roleId) {
        const data = await apiClient.get(`/api/roles/${roleId}`);
        setRoleData(data);
        if (
          !hasPermission("projects-view-details-documents", data.permissions)
        ) {
          alert("You do not have permission to access Documents.");
          router.replace("/user/projects");
          return;
        }
      }
      fetchProject();
      fetchDocuments();
    } catch (error) {
      console.error("Error fetching permissions:", error);
      fetchProject();
      fetchDocuments();
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

  const fetchDocuments = async () => {
    try {
      const data = await apiClient.get(`/api/documents/project/${params.id}`);
      setDocuments(data);
    } catch (error) {
      console.error("Error fetching documents:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const allowedTypes = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "image/png",
        "image/jpeg",
        "image/jpg",
      ];
      if (!allowedTypes.includes(file.type)) {
        alert("Invalid file type.");
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        alert("File size must be less than 10MB");
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      alert("Please select a file");
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("projectId", params.id as string);
      await apiClient.post("/api/documents/upload", formData);
      await fetchDocuments();
      setSelectedFile(null);
      alert("Document uploaded successfully!");
    } catch (error: any) {
      alert(error?.response?.data?.message || "Failed to upload document");
    } finally {
      setUploading(false);
    }
  };

  const handleViewDocument = (doc: Document) => {
    window.open(doc.fileUrl, "_blank");
  };

  const handleDeleteDocument = async (docId: string) => {
    if (!confirm("Are you sure you want to delete this document?")) return;
    try {
      await apiClient.delete(`/api/documents/${docId}`);
      await fetchDocuments();
      alert("Document deleted successfully!");
    } catch (error: any) {
      alert(error?.response?.data?.message || "Failed to delete document");
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };
  const formatDate = (dateString: string): string =>
    new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  const filteredDocuments = documents.filter((doc) =>
    doc.fileName.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  if (authLoading || loading) return <FitoutLoadingSpinner />;
  if (!user || user.role !== "user") return <FitoutLoadingSpinner />;

  const permissions = roleData?.permissions || [];
  const hasRoleData = !!roleData;
  const canUpload =
    !hasRoleData || hasPermission("documents-upload", permissions);
  const canViewOverview =
    !hasRoleData ||
    hasPermission("projects-view-details-overview", permissions);
  const canViewTasks =
    !hasRoleData || hasPermission("projects-view-details-task", permissions);
  const canViewBudget =
    !hasRoleData || hasPermission("projects-view-details-budget", permissions);
  const canViewDocuments =
    !hasRoleData ||
    hasPermission("projects-view-details-documents", permissions);
  const canViewTeam =
    !hasRoleData || hasPermission("projects-view-details-team", permissions);

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminSidebar
        pathname={pathname}
        setPathname={setPathname}
        userRole="user"
        permissions={permissions}
      />
      <AdminHeader />
      <main className="lg:ml-64 mt-16 p-4 sm:p-6 lg:p-8">
        <div className="mb-6">
          <button
            onClick={() => router.push("/user/projects")}
            className="text-gray-600 hover:text-black mb-4 flex items-center gap-2"
          >
            <ArrowLeft size={20} />
            <span>{projectName || "Back to Project"}</span>
          </button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              Documents
            </h1>
            <p className="text-sm text-gray-600">
              Document library for this project
              {roleData ? ` - Role: ${roleData.name}` : ""}
            </p>
          </div>
        </div>

        <div className="mb-6 border-b border-gray-200 overflow-x-auto">
          <div className="flex gap-6 whitespace-nowrap">
            {canViewOverview && (
              <button
                onClick={() =>
                  router.push(`/user/projects/${params.id}/overview`)
                }
                className="pb-3 px-1 text-sm font-medium border-b-2 border-transparent text-gray-500 hover:text-gray-700"
              >
                Overview
              </button>
            )}
            {canViewTasks && (
              <button
                onClick={() => router.push(`/user/projects/${params.id}/tasks`)}
                className="pb-3 px-1 text-sm font-medium border-b-2 border-transparent text-gray-500 hover:text-gray-700"
              >
                Tasks
              </button>
            )}
            {canViewBudget && (
              <button
                onClick={() =>
                  router.push(`/user/projects/${params.id}/budget`)
                }
                className="pb-3 px-1 text-sm font-medium border-b-2 border-transparent text-gray-500 hover:text-gray-700"
              >
                Budget
              </button>
            )}
            {canViewDocuments && (
              <button className="pb-3 px-1 text-sm font-medium border-b-2 border-black text-black">
                Documents
              </button>
            )}
            {canViewTeam && (
              <button
                onClick={() => router.push(`/user/projects/${params.id}/team`)}
                className="pb-3 px-1 text-sm font-medium border-b-2 border-transparent text-gray-500 hover:text-gray-700"
              >
                Team
              </button>
            )}
          </div>
        </div>

        <div className="mb-6">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={20}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search project documents..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-500">
              {filteredDocuments.length} documents
            </span>
          </div>
        </div>

        {canUpload && (
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <Upload size={20} className="text-gray-600" />
              <h2 className="text-lg font-semibold text-gray-900">
                Upload Project Documents
              </h2>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Upload files specific to this project
            </p>
            <div className="mb-6">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <Upload size={48} className="mx-auto text-gray-400 mb-3" />
                <p className="text-gray-700 mb-2">
                  <label className="text-blue-600 hover:text-blue-800 underline cursor-pointer">
                    Browse files
                    <input
                      type="file"
                      onChange={handleFileSelect}
                      className="hidden"
                      accept=".pdf,.doc,.docx,.xlsx,.xls,.png,.jpg,.jpeg"
                    />
                  </label>
                </p>
                <p className="text-xs text-gray-500">
                  Max 10MB • .pdf, .doc, .xlsx, .png, .jpg, .jpeg
                </p>
              </div>
              {selectedFile && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText className="text-blue-600" size={24} />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {selectedFile.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSelectedFile(null)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      Remove
                    </button>
                    <button
                      onClick={handleUpload}
                      disabled={uploading}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                    >
                      {uploading ? "Uploading..." : "Upload"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <FileText size={20} className="text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">
              Document Library
            </h2>
          </div>
          {filteredDocuments.length === 0 ? (
            <div className="text-center py-12">
              <FileText size={64} className="mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {documents.length === 0
                  ? "No project documents yet"
                  : "No documents found"}
              </h3>
              <p className="text-gray-600 mb-4">
                {documents.length === 0
                  ? "Upload your first project document to get started"
                  : "Try adjusting your search query"}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredDocuments.map((doc) => (
                <div
                  key={doc._id}
                  className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <FileText className="text-blue-600" size={24} />
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">
                        {doc.fileName}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span>{formatFileSize(doc.fileSize)}</span>
                        <span>•</span>
                        <span>{formatDate(doc.uploadedAt)}</span>
                        {doc.uploadedBy && (
                          <>
                            <span>•</span>
                            <span>{doc.uploadedBy.name}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleViewDocument(doc)}
                      className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded"
                      title="View"
                    >
                      <Eye size={18} />
                    </button>
                    <button
                      onClick={() => handleDeleteDocument(doc._id)}
                      className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded"
                      title="Delete"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-2">
              <svg
                className="w-5 h-5 text-blue-600 mt-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div>
                <h4 className="font-medium text-blue-900 mb-1">
                  Project Document Storage
                </h4>
                <p className="text-sm text-blue-700">
                  These documents are specific to this project and are isolated
                  from other projects.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
