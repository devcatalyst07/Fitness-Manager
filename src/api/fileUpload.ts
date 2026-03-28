const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

// ─── Upload a single file (task attachment, document, etc.) ─────────────────

export interface UploadedFile {
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  publicId: string; // R2 key — keep this if you need to delete later
}

/**
 * Upload one or more files to the backend → R2.
 * Returns array of uploaded file metadata.
 */
export async function uploadFiles(files: File[]): Promise<UploadedFile[]> {
  const formData = new FormData();
  files.forEach((file) => formData.append("files", file));

  const response = await fetch(`${API_BASE}/upload`, {
    method: "POST",
    credentials: "include", // send cookies for auth
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Upload failed");
  }

  const data = await response.json();
  return data.files as UploadedFile[];
}

/**
 * Upload a single file.
 */
export async function uploadFile(file: File): Promise<UploadedFile> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_BASE}/upload`, {
    method: "POST",
    credentials: "include",
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Upload failed");
  }

  const data = await response.json();
  return data.file as UploadedFile;
}

// ─── Upload a project document ───────────────────────────────────────────────

export async function uploadDocument(
  file: File,
  projectId: string
): Promise<any> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("projectId", projectId);

  const response = await fetch(`${API_BASE}/documents/upload`, {
    method: "POST",
    credentials: "include",
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Document upload failed");
  }

  return response.json();
}

// ─── Delete a file ───────────────────────────────────────────────────────────

export async function deleteFile(publicId: string): Promise<void> {
  const encodedKey = encodeURIComponent(publicId);

  const response = await fetch(`${API_BASE}/upload/${encodedKey}`, {
    method: "DELETE",
    credentials: "include",
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Delete failed");
  }
}

// ─── Upload profile photo ────────────────────────────────────────────────────

export async function uploadProfilePhoto(
  file: File,
  profileData: {
    firstName: string;
    lastName: string;
    username: string;
    email: string;
  }
): Promise<any> {
  const formData = new FormData();
  formData.append("profilePhoto", file);
  formData.append("firstName", profileData.firstName);
  formData.append("lastName", profileData.lastName);
  formData.append("username", profileData.username);
  formData.append("email", profileData.email);

  const response = await fetch(`${API_BASE}/profile`, {
    method: "PUT",
    credentials: "include",
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Profile photo upload failed");
  }

  return response.json();
}

// ─── React hook for file uploads (optional) ──────────────────────────────────

import { useState, useCallback } from "react";

export function useFileUpload() {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const upload = useCallback(
    async (files: File[], projectId?: string): Promise<UploadedFile[]> => {
      setUploading(true);
      setError(null);
      setProgress(0);

      try {
        let result: UploadedFile[];

        if (projectId) {
          // Upload as project documents
          const uploads = await Promise.all(
            files.map((f) => uploadDocument(f, projectId))
          );
          result = uploads.map((u) => u.document);
        } else {
          // Upload as general attachments
          result = await uploadFiles(files);
        }

        setProgress(100);
        return result;
      } catch (err: any) {
        setError(err.message);
        throw err;
      } finally {
        setUploading(false);
      }
    },
    []
  );

  return { upload, uploading, progress, error };
}