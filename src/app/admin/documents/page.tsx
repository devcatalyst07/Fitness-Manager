'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, FileText, FolderOpen, Download, Trash2, Search, Filter } from 'lucide-react';
import { UploadDocumentModal } from '@/components/UploadDocumentModal';
import { DocumentFolderCard } from '@/components/DocumentFolderCard';
import AdminSidebar from '@/components/AdminSidebar';
import FitoutLoadingSpinner from '@/components/FitoutLoadingSpinner';
import AdminHeader from '@/components/AdminHeader';
import { Document } from '@/types/document';


const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://fitout-manager-api.vercel.app';

interface ProjectFolder {
  _id: string;
  projectName: string;
  documentCount: number;
  documents?: Document[];
}

interface Stats {
  totalDocuments: number;
  totalProjects: number;
  totalSize: number;
}

export default function AdminDocuments() {
  const router = useRouter();
  const [pathname, setPathname] = useState('/admin/documents');
  const [isVerified, setIsVerified] = useState(false);
  const [folders, setFolders] = useState<ProjectFolder[]>([]);
  const [stats, setStats] = useState<Stats>({ totalDocuments: 0, totalProjects: 0, totalSize: 0 });
  const [loading, setLoading] = useState(true);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('userRole');

    if (!token || role !== 'admin') {
      localStorage.clear();
      router.replace('/');
    } else {
      setIsVerified(true);
      fetchData();
    }
  }, [router]);

  const fetchData = async () => {
    setLoading(true);
    try {
      await Promise.all([fetchFolders(), fetchStats()]);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFolders = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/documents/folders`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to fetch folders');

      const data = await response.json();
      setFolders(data);
    } catch (error) {
      console.error('Error fetching folders:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/documents/stats/overview`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to fetch stats');

      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchProjectDocuments = async (projectId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/documents/project/${projectId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to fetch documents');

      const documents = await response.json();
      
      setFolders(prevFolders =>
        prevFolders.map(folder =>
          folder._id === projectId
            ? { ...folder, documents }
            : folder
        )
      );
    } catch (error) {
      console.error('Error fetching project documents:', error);
    }
  };

  const handleFolderClick = async (projectId: string) => {
    const isExpanded = expandedFolders.has(projectId);
    
    if (isExpanded) {
      setExpandedFolders(prev => {
        const newSet = new Set(prev);
        newSet.delete(projectId);
        return newSet;
      });
    } else {
      setExpandedFolders(prev => new Set(prev).add(projectId));
      
      // Fetch documents if not already loaded
      const folder = folders.find(f => f._id === projectId);
      if (!folder?.documents) {
        await fetchProjectDocuments(projectId);
      }
    }
  };

  const handleDownloadDocument = async (doc: Document) => {
    try {
      // Check if it's a Cloudinary URL or local file
      const fileUrl = doc.fileUrl.startsWith('http') 
        ? doc.fileUrl 
        : `${API_URL}${doc.fileUrl}`;

      const token = localStorage.getItem('token');
      
      // For Cloudinary URLs, download directly without auth
      if (doc.fileUrl.startsWith('http')) {
        const link = document.createElement('a');
        link.href = fileUrl;
        link.download = doc.fileName;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        // For local files, use auth
        const response = await fetch(fileUrl, {
          headers: { 'Authorization': `Bearer ${token}` },
        });

        if (!response.ok) throw new Error('Download failed');

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = doc.fileName;
        document.body.appendChild(link);
        link.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(link);
      }
    } catch (error) {
      console.error('Error downloading document:', error);
      alert('Failed to download document');
    }
  };

  const handleDeleteDocument = async (doc: Document) => {
    if (!confirm(`Are you sure you want to delete "${doc.fileName}"?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/documents/${doc._id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Delete failed');

      // Refresh data
      await fetchData();
      
      // Reload documents for the affected project if it's expanded
     if (doc.projectId && expandedFolders.has(doc.projectId._id)) {
  await fetchProjectDocuments(doc.projectId._id);
}


      showSuccessMessage('Document deleted successfully');
    } catch (error) {
      console.error('Error deleting document:', error);
      alert('Failed to delete document');
    }
  };

  const handleViewDocument = (doc: Document) => {
    // Check if it's a Cloudinary URL (starts with http/https) or local path
    let fileUrl = doc.fileUrl.startsWith('http') 
      ? doc.fileUrl 
      : `${API_URL}${doc.fileUrl}`;
    
    // Special handling for PDFs on Cloudinary
    if (doc.fileUrl.startsWith('http') && doc.fileType === 'application/pdf') {
      // Convert Cloudinary raw URL to image URL for inline PDF viewing
      // From: https://res.cloudinary.com/.../raw/upload/...
      // To: https://res.cloudinary.com/.../image/upload/fl_attachment/...
      fileUrl = fileUrl.replace('/raw/upload/', '/image/upload/fl_attachment:inline/');
    }
    
    window.open(fileUrl, '_blank');
  };

  const handleUploadSuccess = (fileName: string, projectName: string) => {
    showSuccessMessage(`"${fileName}" uploaded to ${projectName} successfully`);
    fetchData();
  };

  const showSuccessMessage = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(''), 5000);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const filteredFolders = folders.filter(folder =>
    folder.projectName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isVerified || loading) {
    return <FitoutLoadingSpinner />;
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <AdminSidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminHeader />
        
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Document Library</h1>
              <p className="text-gray-600">Manage project documents and files</p>
            </div>

            {/* Success Message */}
            {successMessage && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
                <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                <p className="text-green-700 font-medium">{successMessage}</p>
              </div>
            )}

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Total Documents</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.totalDocuments}</p>
                  </div>
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <FileText className="text-blue-600" size={24} />
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Projects</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.totalProjects}</p>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg">
                    <FolderOpen className="text-green-600" size={24} />
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Total Storage</p>
                    <p className="text-3xl font-bold text-gray-900">{formatFileSize(stats.totalSize)}</p>
                  </div>
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <Upload className="text-purple-600" size={24} />
                  </div>
                </div>
              </div>
            </div>

            {/* Actions Bar */}
            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm mb-6">
              <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative flex-1 w-full md:max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    placeholder="Search projects..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <button
                  onClick={() => setIsUploadModalOpen(true)}
                  className="w-full md:w-auto px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Upload size={20} />
                  Upload Document
                </button>
              </div>
            </div>

            {/* Document Folders */}
            <div className="space-y-4">
              {filteredFolders.length === 0 ? (
                <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                  <FolderOpen className="mx-auto text-gray-300 mb-4" size={64} />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {searchQuery ? 'No projects found' : 'No projects yet'}
                  </h3>
                  <p className="text-gray-600 mb-6">
                    {searchQuery
                      ? 'Try adjusting your search query'
                      : 'Create a project to start uploading documents'}
                  </p>
                </div>
              ) : (
                filteredFolders.map((folder) => {
                  const isExpanded = expandedFolders.has(folder._id);
                  const documents = isExpanded ? folder.documents || [] : [];

                  return (
                    <DocumentFolderCard
                      key={folder._id}
                      projectName={folder.projectName}
                      projectId={folder._id}
                      documents={documents}
                      onFolderClick={handleFolderClick}
                      onViewDocument={handleViewDocument}
                      onDownloadDocument={handleDownloadDocument}
                      onDeleteDocument={handleDeleteDocument}
                    />
                  );
                })
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Upload Modal */}
      <UploadDocumentModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onSuccess={handleUploadSuccess}
      />
    </div>
  );
}