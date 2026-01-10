'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, FileText, FolderOpen, Search, Filter } from 'lucide-react';
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
      
      const folder = folders.find(f => f._id === projectId);
      if (!folder?.documents) {
        await fetchProjectDocuments(projectId);
      }
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

      await fetchData();
      
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
    // For Cloudinary URLs
    if (doc.fileUrl.startsWith('http')) {
      // Handle PDF viewing
      if (doc.fileType === 'application/pdf') {
        // Open PDF in new tab - Cloudinary will handle it
        window.open(doc.fileUrl, '_blank');
      } else {
        // For other file types (images, docs, etc.)
        window.open(doc.fileUrl, '_blank');
      }
    } else {
      // For local files
      const fileUrl = `${API_URL}${doc.fileUrl}`;
      window.open(fileUrl, '_blank');
    }
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
    <div className="min-h-screen bg-gray-50">
      <AdminSidebar pathname={pathname} setPathname={setPathname} />
      <AdminHeader />

      <main className="lg:ml-64 mt-16 p-4 sm:p-6 lg:p-8">
        {/* Header - Matching Dashboard/Projects */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-6">
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Documents</h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">
              Global document library across all projects and entities
            </p>
          </div>
        <button
            onClick={() => setIsUploadModalOpen(true)}
            className="flex items-center justify-center gap-2 bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors whitespace-nowrap self-center sm:self-auto"
            >
            <Upload size={20} />
            <span>Upload</span>
        </button>

        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
            <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center mt-0.5">
              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-green-800">{successMessage}</p>
            </div>
            <button
              onClick={() => setSuccessMessage('')}
              className="text-green-600 hover:text-green-800"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* Stats Cards - Matching Dashboard */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Total Documents</h3>
            <p className="text-3xl font-bold text-gray-900 mb-2">{stats.totalDocuments}</p>
            <p className="text-sm text-gray-500">Across all projects</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Projects with Documents</h3>
            <p className="text-3xl font-bold text-gray-900 mb-2">
              {folders.filter(f => f.documentCount > 0).length}
            </p>
            <p className="text-sm text-gray-500">Out of {stats.totalProjects} total</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Total Storage</h3>
            <p className="text-3xl font-bold text-gray-900 mb-2">{formatFileSize(stats.totalSize)}</p>
            <p className="text-sm text-gray-500">Cloud storage used</p>
          </div>
        </div>

        {/* Search Bar - Matching Projects */}
       {/* Search Bar - Matching Projects */}
        <div className="flex flex-row gap-2 mb-6 sm:flex-row">
        {/* Search Input */}
        <div className="relative sm:ml-auto">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search projects..."
            className="w-full sm:w-auto pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>

        {/* Filter Button */}
        <button className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 whitespace-nowrap">
            <Filter size={20} />
            <span className="hidden sm:inline">Filters</span>
        </button>
        </div>

        {/* Document Library */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Document Library</h2>
          </div>

          {filteredFolders.length === 0 ? (
            <div className="text-center py-12">
              <FolderOpen size={48} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {searchQuery ? 'No projects found' : 'No projects yet'}
              </h3>
              <p className="text-gray-600 mb-4">
                {searchQuery
                  ? 'Try adjusting your search query'
                  : 'Create a project to start uploading documents'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredFolders.map((folder) => {
                const isExpanded = expandedFolders.has(folder._id);
                const documents = isExpanded ? folder.documents || [] : [];

                return (
                  <DocumentFolderCard
                    key={folder._id}
                    projectName={folder.projectName}
                    projectId={folder._id}
                    documentCount={folder.documentCount}
                    documents={documents}
                    isExpanded={isExpanded}
                    onFolderClick={handleFolderClick}
                    onViewDocument={handleViewDocument}
                    onDeleteDocument={handleDeleteDocument}
                  />
                );
              })}
            </div>
          )}
        </div>
      </main>

      <UploadDocumentModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onSuccess={handleUploadSuccess}
      />
    </div>
  );
}