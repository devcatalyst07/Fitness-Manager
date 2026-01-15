'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, UserPlus, Search } from 'lucide-react';
import AdminSidebar from '@/components/AdminSidebar';
import AdminHeader from '@/components/AdminHeader';
import FitoutLoadingSpinner from '@/components/FitoutLoadingSpinner';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://fitout-manager-api.vercel.app';

interface TeamMember {
  id: string;
  initials: string;
  name: string;
  role: string;
  email: string;
  status: 'active' | 'pending';
  joined: string;
}

export default function ProjectTeamPage() {
  const router = useRouter();
  const params = useParams();
  const [pathname, setPathname] = useState('/admin/projects');
  const [loading, setLoading] = useState(true);
  const [isVerified, setIsVerified] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [teamMembers] = useState<TeamMember[]>([
    {
      id: '1',
      initials: 'SJ',
      name: 'Sarah Johnson',
      role: 'ProjectManager',
      email: 'sarah.johnson@demo.com',
      status: 'active',
      joined: '1/15/2024'
    },
    {
      id: '2',
      initials: 'MC',
      name: 'Mike Chen',
      role: 'Finance',
      email: 'mike.chen@demo.com',
      status: 'active',
      joined: '1/20/2024'
    },
    {
      id: '3',
      initials: 'ED',
      name: 'Emily Davis',
      role: 'Vendor',
      email: 'emily.davis@demo.com',
      status: 'pending',
      joined: '2/1/2024'
    }
  ]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('userRole');

    if (!token || role !== 'admin') {
      localStorage.clear();
      router.replace('/');
    } else {
      setIsVerified(true);
      setLoading(false);
    }
  }, [router]);

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ProjectManager':
        return 'bg-blue-100 text-blue-700 border border-blue-300';
      case 'Finance':
        return 'bg-green-100 text-green-700 border border-green-300';
      case 'Vendor':
        return 'bg-orange-100 text-orange-700 border border-orange-300';
      default:
        return 'bg-gray-100 text-gray-700 border border-gray-300';
    }
  };

  const getStatusColor = (status: string) => {
    return status === 'active' 
      ? 'bg-green-100 text-green-700' 
      : 'bg-yellow-100 text-yellow-700';
  };

  const filteredMembers = teamMembers.filter(member =>
    member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isVerified || loading) {
    return <FitoutLoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminSidebar pathname={pathname} setPathname={setPathname} />
      <AdminHeader />

      <main className="lg:ml-64 mt-16 p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.push(`/admin/projects/${params.id}`)}
            className="text-gray-600 hover:text-black mb-4 flex items-center gap-2 transition-colors"
          >
            <ArrowLeft size={20} />
            <span>Westfield Mall Renovation</span>
          </button>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Team</h1>
              <p className="text-sm text-gray-600">Team members for Westfield Mall Renovation (WMR2024)</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">👥 {teamMembers.length} Members</span>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
                <UserPlus size={18} />
                <span>Invite to Project</span>
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <div className="flex gap-6">
            {['Overview', 'Tasks', 'Budget', 'RFQs', 'Documents', 'Team'].map((tab) => (
              <button
                key={tab}
                className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
                  tab === 'Team'
                    ? 'border-black text-black'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => {
                  if (tab === 'Overview') router.push(`/admin/projects/${params.id}`);
                  if (tab === 'Tasks') router.push(`/admin/projects/${params.id}/tasks`);
                  if (tab === 'Budget') router.push(`/admin/projects/${params.id}/budget`);
                  if (tab === 'Documents') router.push(`/admin/projects/${params.id}/documents`);
                }}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search team members..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-500">
              {filteredMembers.length} members
            </span>
          </div>
        </div>

        {/* Team Members */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <h2 className="text-lg font-semibold text-gray-900">Team Members</h2>
            </div>
            <p className="text-sm text-gray-600 mt-1">Users assigned to this project with their roles and status</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredMembers.map((member) => (
                  <tr key={member.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                          {member.initials}
                        </div>
                        <span className="font-medium text-gray-900">{member.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getRoleColor(member.role)}`}>
                        {member.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        {member.email}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(member.status)}`}>
                        {member.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{member.joined}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Project Team Features Info */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-2">
            <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h4 className="font-medium text-blue-900 mb-1">Project Team Features</h4>
              <p className="text-sm text-blue-700">
                If team membership isn't fully modeled yet, this serves as a placeholder. 
                For comprehensive user management, visit <span className="font-semibold">Admin → Users</span> to manage all system users.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}