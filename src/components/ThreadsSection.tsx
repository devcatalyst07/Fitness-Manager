import React, { useState, useEffect } from 'react';
import { MessageSquare, Plus, Filter, Search, Users, FolderOpen } from 'lucide-react';
import CreateThreadModal from './CreateThreadModal';
import ThreadCard from './ThreadCard';
import ThreadDetailModal from './ThreadDetailModal';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://fitout-manager-api.vercel.app';

interface Thread {
  _id: string;
  title: string;
  content: string;
  brandId: string;
  projectId?: string;
  createdBy: string;
  createdByName: string;
  createdByEmail: string;
  attachments: Array<{
    fileName: string;
    fileUrl: string;
    fileType: string;
    fileSize: number;
    uploadedAt: string;
  }>;
  likes: string[];
  commentCount: number;
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Project {
  _id: string;
  projectName: string;
}

interface ThreadsSectionProps {
  brandId: string;
  brandName: string;
}

export default function ThreadsSection({ brandId, brandName }: ThreadsSectionProps) {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [filteredThreads, setFilteredThreads] = useState<Thread[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedThread, setSelectedThread] = useState<Thread | null>(null);
  const [selectedProjectFilter, setSelectedProjectFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchThreads();
    fetchProjects();
  }, [brandId]);

  useEffect(() => {
    filterThreads();
  }, [threads, selectedProjectFilter, searchQuery]);

  const fetchThreads = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/brands/${brandId}/threads`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setThreads(data);
      } else {
        console.error('Failed to fetch threads:', response.status);
      }
    } catch (error) {
      console.error('Error fetching threads:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/brands/${brandId}/projects`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setProjects(data);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const filterThreads = () => {
    let filtered = [...threads];

    // Filter by project
    if (selectedProjectFilter !== 'all') {
      if (selectedProjectFilter === 'general') {
        // Show only threads without a project (general brand threads)
        filtered = filtered.filter(t => !t.projectId);
      } else {
        // Show only threads for the selected project
        filtered = filtered.filter(t => t.projectId === selectedProjectFilter);
      }
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(t =>
        t.title.toLowerCase().includes(query) ||
        t.content.toLowerCase().includes(query) ||
        t.createdByName.toLowerCase().includes(query)
      );
    }

    setFilteredThreads(filtered);
  };

  const handleThreadCreated = () => {
    fetchThreads();
    setIsCreateModalOpen(false);
  };

  const handleThreadUpdated = () => {
    fetchThreads();
  };

  const handleThreadDeleted = (threadId: string) => {
    setThreads(threads.filter(t => t._id !== threadId));
    setSelectedThread(null);
  };

  // Calculate stats
  const generalThreadsCount = threads.filter(t => !t.projectId).length;
  const projectThreadsCount = threads.filter(t => t.projectId).length;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <MessageSquare size={20} className="text-gray-700" />
            <h2 className="text-xl font-semibold text-gray-900">Threads</h2>
          </div>
          <p className="text-sm text-gray-500">
            Collaborate and share updates for <span className="font-medium text-gray-700">{brandName}</span>
          </p>
          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <Users size={14} />
              <span>{generalThreadsCount} General</span>
            </div>
            <div className="flex items-center gap-1">
              <FolderOpen size={14} />
              <span>{projectThreadsCount} Project-specific</span>
            </div>
          </div>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={18} />
          <span>New Thread</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        {/* Search */}
        <div className="flex-1 relative">
          <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search threads..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Project Filter */}
        <div className="flex items-center gap-2 bg-white border border-gray-300 rounded-lg px-3 py-2 min-w-[200px]">
          <Filter size={16} className="text-gray-500" />
          <select
            value={selectedProjectFilter}
            onChange={(e) => setSelectedProjectFilter(e.target.value)}
            className="flex-1 text-sm border-none outline-none bg-transparent"
          >
            <option value="all">All Threads ({threads.length})</option>
            <option value="general">General Threads ({generalThreadsCount})</option>
            {projects.map((project) => {
              const projectThreads = threads.filter(t => t.projectId === project._id);
              return (
                <option key={project._id} value={project._id}>
                  {project.projectName} ({projectThreads.length})
                </option>
              );
            })}
          </select>
        </div>
      </div>

      {/* Filter Info Banner */}
      {selectedProjectFilter !== 'all' && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-2">
            <Filter size={16} className="text-blue-600 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-blue-900 font-medium">
                {selectedProjectFilter === 'general' ? (
                  <>Showing general threads visible to all brand members</>
                ) : (
                  <>Showing threads for {projects.find(p => p._id === selectedProjectFilter)?.projectName || 'selected project'}</>
                )}
              </p>
              <p className="text-xs text-blue-700 mt-1">
                {selectedProjectFilter === 'general' 
                  ? 'These threads are not associated with any specific project'
                  : 'Only members of this project can see these threads'}
              </p>
            </div>
            <button
              onClick={() => setSelectedProjectFilter('all')}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Threads List */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2">Loading threads...</p>
        </div>
      ) : filteredThreads.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <MessageSquare size={48} className="mx-auto mb-4 text-gray-300" />
          <p className="font-semibold mb-2">
            {searchQuery 
              ? 'No threads match your search' 
              : selectedProjectFilter !== 'all'
              ? 'No threads in this category yet'
              : 'No threads yet'}
          </p>
          <p className="text-sm mb-4">
            {searchQuery
              ? 'Try adjusting your search terms'
              : selectedProjectFilter === 'general'
              ? 'Create a general thread to start a brand-wide conversation'
              : selectedProjectFilter !== 'all'
              ? 'Create a thread for this project to get started'
              : 'Start a conversation by creating a new thread'}
          </p>
          {!searchQuery && (
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              <Plus size={18} />
              <span>Create First Thread</span>
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredThreads.map((thread) => (
            <ThreadCard
              key={thread._id}
              thread={thread}
              onClick={() => setSelectedThread(thread)}
              onUpdate={handleThreadUpdated}
              onDelete={handleThreadDeleted}
            />
          ))}
        </div>
      )}

      {/* Create Thread Modal */}
      {isCreateModalOpen && (
        <CreateThreadModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          brandId={brandId}
          projects={projects}
          onSuccess={handleThreadCreated}
        />
      )}

      {/* Thread Detail Modal */}
      {selectedThread && (
        <ThreadDetailModal
          thread={selectedThread}
          onClose={() => setSelectedThread(null)}
          onUpdate={handleThreadUpdated}
          onDelete={handleThreadDeleted}
        />
      )}
    </div>
  );
}