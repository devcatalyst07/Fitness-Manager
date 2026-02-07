import React, { useState, useEffect, useRef } from "react";
import { X, Upload, FileText, AlertCircle } from "lucide-react";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://fitout-manager-api.vercel.app";

interface Project {
  _id: string;
  projectName: string;
}

interface UploadDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (fileName: string, projectName: string) => void;
  allowMultiple?: boolean;
}

export function UploadDocumentModal({
  isOpen,
  onClose,
  onSuccess,
  allowMultiple = false,
}: UploadDocumentModalProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const maxFiles = allowMultiple ? 5 : 1;

  useEffect(() => {
    if (isOpen) {
      fetchProjects();
    }
  }, [isOpen]);

  const fetchProjects = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/api/documents/projects`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error("Failed to fetch projects");

      const data = await response.json();
      setProjects(data);
    } catch (error) {
      console.error("Error fetching projects:", error);
      setError("Failed to load projects");
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files);
    }
  };

  const handleFileSelect = (files: FileList | File[]) => {
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

    const incomingFiles = Array.from(files);

    if (!allowMultiple) {
      const file = incomingFiles[0];
      if (!file) return;
      if (!allowedTypes.includes(file.type)) {
        setError(
          "Invalid file type. Only PDF, DOC, DOCX, XLS, XLSX, PNG, JPG, JPEG are allowed",
        );
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        setError("File size must be less than 10MB");
        return;
      }

      setSelectedFiles([file]);
      setError("");
      return;
    }

    if (incomingFiles.length + selectedFiles.length > maxFiles) {
      setError(`You can upload up to ${maxFiles} files at once`);
      return;
    }

    for (const file of incomingFiles) {
      if (!allowedTypes.includes(file.type)) {
        setError(
          "Invalid file type. Only PDF, DOC, DOCX, XLS, XLSX, PNG, JPG, JPEG are allowed",
        );
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        setError("File size must be less than 10MB");
        return;
      }
    }

    setSelectedFiles((prev) => [...prev, ...incomingFiles]);
    setError("");
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelect(e.target.files);
    }
  };

  const handleUpload = async () => {
    if (!selectedProject) {
      setError("Please select a project");
      return;
    }

    if (selectedFiles.length === 0) {
      setError("Please select at least one file");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("token");

      for (const file of selectedFiles) {
        // Debug: Log the request details
        console.log("Upload Request Details:", {
          url: `${API_URL}/api/documents/upload`,
          projectId: selectedProject,
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
          hasToken: !!token,
        });

        const formData = new FormData();
        formData.append("file", file);
        formData.append("projectId", selectedProject);

        const response = await fetch(`${API_URL}/api/documents/upload`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });

        // Debug: Log response details
        console.log("Upload Response:", {
          status: response.status,
          statusText: response.statusText,
          ok: response.ok,
        });

        // Try to get error details
        if (!response.ok) {
          let errorMessage = "Upload failed";
          try {
            const errorData = await response.json();
            console.error("Server Error Response:", errorData);
            errorMessage = errorData.message || errorData.error || errorMessage;
          } catch (e) {
            // If response is not JSON, try to get text
            const errorText = await response.text();
            console.error("Server Error Text:", errorText);
            errorMessage = errorText || `Server error: ${response.status}`;
          }
          throw new Error(errorMessage);
        }

        const data = await response.json();
        console.log("Upload Success:", data);
      }

      const projectName =
        projects.find((p) => p._id === selectedProject)?.projectName ||
        "Project";
      const successLabel = allowMultiple
        ? `${selectedFiles.length} files`
        : selectedFiles[0]?.name || "File";

      onSuccess(successLabel, projectName);
      handleClose();
    } catch (error: any) {
      console.error("Upload error:", error);

      // More detailed error messages
      let errorMsg = "Failed to upload document";

      if (error.message.includes("Failed to fetch")) {
        errorMsg =
          "Network error - Cannot connect to server. Check if API is running.";
      } else if (error.message.includes("NetworkError")) {
        errorMsg = "Network error - Check your internet connection";
      } else if (error.message) {
        errorMsg = error.message;
      }

      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedProject("");
    setSelectedFiles([]);
    setError("");
    setDragActive(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-2xl rounded-lg relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={handleClose}
          className="absolute right-4 top-4 text-gray-400 hover:text-black transition-colors z-10"
        >
          <X size={24} />
        </button>

        <div className="p-8">
          <div className="flex items-center mb-2">
            <Upload size={24} className="mr-2" />
            <h2 className="text-2xl font-bold text-black">Upload Documents</h2>
          </div>
          <p className="text-sm text-gray-600 mb-6">
            Upload files to the global document library (tenant-scoped)
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <AlertCircle className="text-red-600 mt-0.5" size={18} />
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {/* Select Project */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Project <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Choose a project...</option>
              {projects.map((project) => (
                <option key={project._id} value={project._id}>
                  {project.projectName}
                </option>
              ))}
            </select>
          </div>

          {/* File Upload Area */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Attachments
            </label>
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragActive
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-300 hover:border-gray-400"
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <Upload size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-700 mb-2">
                Drag & drop files here, or{" "}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-blue-600 hover:text-blue-800 underline"
                >
                  browse
                </button>
              </p>
              <p className="text-xs text-gray-500">
                Max 10MB • .pdf, .doc, .docx, .xlsx, .png, .jpg, .jpeg •{" "}
                {allowMultiple
                  ? `Up to ${maxFiles} files at once`
                  : "Single file"}
              </p>
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileInputChange}
                className="hidden"
                accept=".pdf,.doc,.docx,.xlsx,.xls,.png,.jpg,.jpeg"
                multiple={allowMultiple}
              />
            </div>

            {/* Selected Files Display */}
            {selectedFiles.length > 0 && (
              <div className="mt-4 space-y-2">
                {selectedFiles.map((file, index) => (
                  <div
                    key={`${file.name}-${index}`}
                    className="p-4 bg-gray-50 rounded-lg border border-gray-200 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="text-blue-600" size={24} />
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {file.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() =>
                        setSelectedFiles((prev) =>
                          prev.filter((_, i) => i !== index),
                        )
                      }
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <X size={20} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3">
            <button
              onClick={handleClose}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              onClick={handleUpload}
              disabled={
                loading || !selectedProject || selectedFiles.length === 0
              }
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload size={18} />
                  Upload
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
