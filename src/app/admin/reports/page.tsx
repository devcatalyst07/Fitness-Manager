'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FileDown, FileText, Folder, Download, Info } from 'lucide-react';
import AdminSidebar from '@/components/AdminSidebar';
import AdminHeader from '@/components/AdminHeader';
import FitoutLoadingSpinner from '@/components/FitoutLoadingSpinner';
import {
  generatePortfolioPDF,
  generateProjectPDF,
  generateBrandPDF,
  type PortfolioReportData,
  type ProjectReportData,
  type BrandReportData,
} from '@/utils/pdfGenerator';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://fitout-manager-api.vercel.app';

interface Project {
  _id: string;
  projectName: string;
  projectCode?: string;
  brand: string;
}

interface Brand {
  _id: string;
  name: string;
}

export default function ReportsPage() {
  const router = useRouter();
  const [pathname, setPathname] = useState('/admin/reports');
  const [isVerified, setIsVerified] = useState(false);
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [generatingReport, setGeneratingReport] = useState<string | null>(null);

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
    try {
      const token = localStorage.getItem('token');
      
      const [projectsRes, brandsRes] = await Promise.all([
        fetch(`${API_URL}/api/admin/reports/projects`, {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
        fetch(`${API_URL}/api/admin/reports/brands`, {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
      ]);

      if (projectsRes.ok) {
        const projectsData = await projectsRes.json();
        setProjects(projectsData);
      }

      if (brandsRes.ok) {
        const brandsData = await brandsRes.json();
        setBrands(brandsData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const downloadPortfolioCSV = async () => {
    setGeneratingReport('portfolio-csv');
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/admin/reports/portfolio/csv`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `portfolio-report-${Date.now()}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
      } else {
        alert('Failed to generate CSV report');
      }
    } catch (error) {
      console.error('Download CSV error:', error);
      alert('Failed to download CSV report');
    } finally {
      setGeneratingReport(null);
    }
  };

  const generatePortfolioPDFReport = async () => {
    setGeneratingReport('portfolio-pdf');
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/admin/reports/portfolio/pdf-data`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const data: PortfolioReportData = await response.json();
        generatePortfolioPDF(data);
      } else {
        alert('Failed to generate PDF report');
      }
    } catch (error) {
      console.error('Generate PDF error:', error);
      alert('Failed to generate PDF report');
    } finally {
      setGeneratingReport(null);
    }
  };

  const downloadProjectCSV = async (projectId: string, projectName: string) => {
    setGeneratingReport(`project-csv-${projectId}`);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/admin/reports/project/${projectId}/csv`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${projectName}-report-${Date.now()}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
      } else {
        alert('Failed to generate CSV report');
      }
    } catch (error) {
      console.error('Download CSV error:', error);
      alert('Failed to download CSV report');
    } finally {
      setGeneratingReport(null);
    }
  };

  const generateProjectPDFReport = async (projectId: string) => {
    setGeneratingReport(`project-pdf-${projectId}`);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/admin/reports/project/${projectId}/pdf-data`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const data: ProjectReportData = await response.json();
        generateProjectPDF(data);
      } else {
        alert('Failed to generate PDF report');
      }
    } catch (error) {
      console.error('Generate PDF error:', error);
      alert('Failed to generate PDF report');
    } finally {
      setGeneratingReport(null);
    }
  };

  const downloadBrandCSV = async (brandName: string) => {
    setGeneratingReport(`brand-csv-${brandName}`);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/admin/reports/brand/${encodeURIComponent(brandName)}/csv`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${brandName}-report-${Date.now()}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
      } else {
        alert('Failed to generate CSV report');
      }
    } catch (error) {
      console.error('Download CSV error:', error);
      alert('Failed to download CSV report');
    } finally {
      setGeneratingReport(null);
    }
  };

  const generateBrandPDFReport = async (brandName: string) => {
    setGeneratingReport(`brand-pdf-${brandName}`);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/admin/reports/brand/${encodeURIComponent(brandName)}/pdf-data`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const data: BrandReportData = await response.json();
        generateBrandPDF(data);
      } else {
        alert('Failed to generate PDF report');
      }
    } catch (error) {
      console.error('Generate PDF error:', error);
      alert('Failed to generate PDF report');
    } finally {
      setGeneratingReport(null);
    }
  };

  if (!isVerified || loading) {
    return <FitoutLoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminSidebar pathname={pathname} setPathname={setPathname} />
      <AdminHeader />

      <main className="lg:ml-64 mt-16 p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Reports</h1>
              <p className="text-sm text-gray-600">
                Export portfolio and project data for analysis and reporting
              </p>
            </div>
            <button
              onClick={() => router.push('/admin/dashboard')}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <Folder size={18} />
              <span className="hidden sm:inline">Portfolio Hub</span>
            </button>
          </div>
        </div>

        {/* Portfolio Reports */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-8">
          {/* Portfolio CSV Export */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <FileText size={24} className="text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  Portfolio CSV Export
                </h3>
                <p className="text-sm text-gray-600">
                  Complete portfolio data with budgets, RFQs, and approvals
                </p>
              </div>
            </div>
            <button
              onClick={downloadPortfolioCSV}
              disabled={generatingReport === 'portfolio-csv'}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
            >
              <Download size={18} />
              <span>{generatingReport === 'portfolio-csv' ? 'Generating...' : 'Download CSV'}</span>
            </button>
          </div>

          {/* Portfolio PDF Report */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                <FileText size={24} className="text-gray-700" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  Portfolio PDF Report
                </h3>
                <p className="text-sm text-gray-600">
                  Executive summary with charts and key metrics
                </p>
              </div>
            </div>
            <button
              onClick={generatePortfolioPDFReport}
              disabled={generatingReport === 'portfolio-pdf'}
              className="w-full flex items-center justify-center gap-2 bg-white border border-gray-300 text-gray-700 px-4 py-3 rounded-lg hover:bg-gray-50 disabled:bg-gray-100 transition-colors"
            >
              <Download size={18} />
              <span>{generatingReport === 'portfolio-pdf' ? 'Generating...' : 'Generate PDF'}</span>
            </button>
          </div>
        </div>

        {/* Brand Reports Section */}
        {brands.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Folder size={20} className="text-gray-700" />
              <h2 className="text-xl font-semibold text-gray-900">Brand Reports</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {brands.map((brand) => (
                <div key={brand._id} className="bg-white border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">{brand.name}</h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => downloadBrandCSV(brand.name)}
                      disabled={generatingReport === `brand-csv-${brand.name}`}
                      className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:bg-gray-100"
                    >
                      {generatingReport === `brand-csv-${brand.name}` ? 'Loading...' : 'CSV'}
                    </button>
                    <button
                      onClick={() => generateBrandPDFReport(brand.name)}
                      disabled={generatingReport === `brand-pdf-${brand.name}`}
                      className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:bg-gray-100"
                    >
                      {generatingReport === `brand-pdf-${brand.name}` ? 'Loading...' : 'PDF'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Project Reports */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Folder size={20} className="text-gray-700" />
            <h2 className="text-xl font-semibold text-gray-900">Project Reports</h2>
          </div>

          {projects.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
              <p className="text-gray-500">No projects available for reporting</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map((project) => (
                <div key={project._id} className="bg-white border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-1">{project.projectName}</h3>
                  <p className="text-sm text-gray-500 mb-3">{project.projectCode || project.brand}</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => downloadProjectCSV(project._id, project.projectName)}
                      disabled={generatingReport === `project-csv-${project._id}`}
                      className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:bg-gray-100 transition-colors"
                    >
                      {generatingReport === `project-csv-${project._id}` ? 'Loading...' : 'CSV'}
                    </button>
                    <button
                      onClick={() => generateProjectPDFReport(project._id)}
                      disabled={generatingReport === `project-pdf-${project._id}`}
                      className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:bg-gray-100 transition-colors"
                    >
                      {generatingReport === `project-pdf-${project._id}` ? 'Loading...' : 'PDF'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Report Generation Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Info size={20} className="text-blue-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-900 mb-1">Report Generation</h3>
              <p className="text-sm text-blue-800">
                Reports are generated on-demand and include the latest data from your projects. 
                Large datasets may take a few moments to process.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}