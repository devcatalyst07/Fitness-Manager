'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Search, Filter, FolderKanban, Bell, User, LogOut, ChevronDown } from 'lucide-react';
import AdminSidebar from '@/components/AdminSidebar';
import { StatsCard } from '@/components/StatsCard';
import { ProjectCard } from '@/components/ProjectCard';
import { CreateProjectModal } from '@/components/CreateProjectModal';
import FitoutLoadingSpinner from '@/components/FitoutLoadingSpinner';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://fitout-manager-api.vercel.app';

interface Project {
  _id: string;
  projectName: string;
  brand: string;
  scope: string;
  workflow: string;
  projectCode?: string;
  description?: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  budget: number;
  spent: number;
  status: 'Planning' | 'In Progress' | 'Completed' | 'On Hold';
  userId: {
    name: string;
    email: string;
  };
  createdBy: 'user' | 'admin';
  createdAt: string;
}

interface ProjectStats {
  total: number;
  active: number;
  completed: number;
  planning: number;
}

// ==================== AdminHeader (SAME AS DASHBOARD) ====================
function AdminHeader() {
  const router = useRouter();
  const [userName, setUserName] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const name = localStorage.getItem('userName') || 'Admin';
    setUserName(name);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    router.push('/');
  };

  return (
    <header className="fixed top-0 right-0 left-0 lg:left-64 bg-white border-b border-gray-200 z-20 px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
      <div className="flex-auto max-w-xs sm:ml-0 ml-12 mt-2 sm:mt-0">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <div className="hidden sm:block text-gray-700 text-sm font-medium whitespace-nowrap">
          <strong>{`Welcome, ${userName}. You are now signed in.`}</strong>
        </div>

        <button className="p-2 hover:bg-gray-100 rounded-lg relative">
          <Bell size={20} />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>

        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center space-x-1 p-2 hover:bg-gray-100 rounded-lg"
          >
            <User size={20} />
            <ChevronDown size={16} className={`${dropdownOpen ? 'rotate-180' : ''} transition-transform`} />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center space-x-2"
              >
                <LogOut size={16} />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="sm:hidden absolute right-4 top-16 text-gray-700 text-sm font-medium">
        <strong>{`Welcome, ${userName}.`}</strong>
      </div>
    </header>
  );
}

export default function AdminProjects() {
  const router = useRouter();
  const [pathname, setPathname] = useState('/admin/projects');
  const [isVerified, setIsVerified] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [stats, setStats] = useState<ProjectStats>({ total: 0, active: 0, completed: 0, planning: 0 });
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('userRole');

    if (!token || role !== 'admin') {
      localStorage.clear();
      router.replace('/');
    } else {
      setIsVerified(true);
      fetchProjects();
      fetchStats();
    }
  }, [router]);

  const fetchProjects = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/projects`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch projects');
      }

      const data = await response.json();
      setProjects(data);
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/projects/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch stats');
      }

      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleProjectCreated = () => {
    fetchProjects();
    fetchStats();
  };

  const filteredProjects = projects.filter(project =>
    project.projectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.brand.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isVerified || loading) {
  return <FitoutLoadingSpinner />;
}

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminSidebar pathname={pathname} setPathname={setPathname} />
      <AdminHeader />

      <main className="lg:ml-64 mt-16 p-4 sm:p-6 lg:p-8">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-6">
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Projects</h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">Manage your fitout projects and track progress</p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center justify-center gap-2 bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors whitespace-nowrap self-start sm:self-auto"
          >
            <Plus size={20} />
            <span>New Project</span>
          </button>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search projects..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 whitespace-nowrap">
            <Filter size={20} />
            <span className="hidden sm:inline">Filters</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard title="Total Projects" value={stats.total} color="blue" />
          <StatsCard title="Active" value={stats.active} color="green" />
          <StatsCard title="Completed" value={stats.completed} color="purple" />
          <StatsCard title="Planning" value={stats.planning} color="orange" />
        </div>

        {filteredProjects.length === 0 ? (
          <div className="bg-white border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
            <FolderKanban size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No projects yet</h3>
            <p className="text-gray-600 mb-4">Get started by creating your first project</p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors"
            >
              <Plus size={20} />
              <span>Create Project</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredProjects.map((project) => (
              <ProjectCard key={project._id} project={project} onUpdate={fetchProjects} />
            ))}
          </div>
        )}
      </main>

      <CreateProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleProjectCreated}
      />
    </div>
  );
}