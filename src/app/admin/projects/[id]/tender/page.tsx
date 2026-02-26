'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Upload, X, FileText, Plus, Trash2, Send, Sparkles } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { apiClient } from '@/lib/axios';
import api from '@/lib/axios';
import AdminSidebar from '@/components/AdminSidebar';
import AdminHeader from '@/components/AdminHeader';
import FitoutLoadingSpinner from '@/components/FitoutLoadingSpinner';
import FileUploadSection from '@/components/FileUploadSection';

// ─── Types ──────────────────────────────────────────────────────

interface TenderDocument {
  _id: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize?: number;
  section: string;
  uploadedAt: string;
}

interface Tender {
  _id: string;
  tenderNumber: string;
  title: string;
  description: string;
  category: string;
  status: string;
  budgetedAmount: number;
  issueDate?: string;
  submissionDeadline?: string;
  awardedAmount?: number;
  awardedContractorId?: string;
  scopeOfWorks?: string;
  specifications?: string;
  complianceRequirements: string[];
  documents: TenderDocument[];
  shortlistedContractors: Array<{
    contractorId: string;
    name: string;
    email: string;
    phone?: string;
    status: string;
  }>;
  createdBy: { name: string; email: string };
  createdAt: string;
}

interface Contractor {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  companyName: string;
  categories: string[];
  performance: {
    projectsCompleted: number;
    averageRating: number;
    onTimeDelivery: number;
    budgetCompliance: number;
    qualityScore: number;
  };
}

// ─── FormData helpers using the shared axios instance ────────────
// Automatically includes CSRF token, auth cookies, and refresh logic

async function apiPostFormData(url: string, formData: FormData) {
  const res = await api.post(url, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
}

async function apiPutFormData(url: string, formData: FormData) {
  const res = await api.put(url, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
}

// ─── Component ──────────────────────────────────────────────────

export default function AdminProjectTenderPage() {
  const router = useRouter();
  const params = useParams();
  const { user, loading: authLoading } = useAuth();

  const [pathname, setPathname] = useState('/admin/projects');
  const [loading, setLoading] = useState(true);
  const [tenders, setTenders] = useState<Tender[]>([]);
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [projectName, setProjectName] = useState('');

  // ── Modal state ──
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isContractorModalOpen, setIsContractorModalOpen] = useState(false);
  const [editingTender, setEditingTender] = useState<Tender | null>(null);

  // ── Create / Edit form state ──
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Construction',
    budgetedAmount: 0,
    submissionDeadline: '',
    scopeOfWorks: '',
    specifications: '',
    complianceRequirements: [] as string[],
    shortlistedContractors: [] as any[],
  });
  const [newComplianceItem, setNewComplianceItem] = useState('');

  // ── File upload state ──
  const [scopeFiles, setScopeFiles] = useState<File[]>([]);
  const [specFiles, setSpecFiles] = useState<File[]>([]);
  const [generalFiles, setGeneralFiles] = useState<File[]>([]);
  const [removedDocumentIds, setRemovedDocumentIds] = useState<string[]>([]);

  // ── Contractor form ──
  const [contractorFormData, setContractorFormData] = useState({
    name: '',
    email: '',
    phone: '',
    companyName: '',
    companyAddress: '',
    registrationNumber: '',
    categories: [] as string[],
  });

  const [saving, setSaving] = useState(false);
  const [aiRecommendations, setAiRecommendations] = useState<any>(null);
  const [loadingAI, setLoadingAI] = useState(false);

  // ── Auth guards ──
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/');
      return;
    }
    if (!authLoading && user && user.role !== 'admin') {
      router.replace('/user/projects');
      return;
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user && user.role === 'admin' && params.id) {
      fetchProject();
      fetchTenders();
      fetchContractors();
    }
  }, [user, params.id]);

  // ── Data fetching ──

  const fetchProject = async () => {
    try {
      const data = await apiClient.get(`/api/projects/${params.id}`);
      setProjectName(data.projectName);
    } catch (error) {
      console.error('Error fetching project:', error);
    }
  };

  const fetchTenders = async () => {
    setLoading(true);
    try {
      const data = await apiClient.get(`/api/projects/${params.id}/tenders`);
      setTenders(data);
    } catch (error) {
      console.error('Error fetching tenders:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchContractors = async () => {
    try {
      const data = await apiClient.get('/api/contractors');
      setContractors(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching contractors:', error);
      setContractors([]);
    }
  };

  // ── Create tender (with files) ──

  const handleCreateTender = async () => {
    if (!formData.title || !formData.budgetedAmount) {
      alert('Please fill in Title and Budgeted Amount');
      return;
    }

    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('title', formData.title);
      fd.append('description', formData.description);
      fd.append('category', formData.category);
      fd.append('budgetedAmount', String(formData.budgetedAmount));
      if (formData.submissionDeadline) {
        fd.append('submissionDeadline', formData.submissionDeadline);
      }
      fd.append('scopeOfWorks', formData.scopeOfWorks);
      fd.append('specifications', formData.specifications);
      fd.append('complianceRequirements', JSON.stringify(formData.complianceRequirements));
      fd.append('shortlistedContractors', JSON.stringify(formData.shortlistedContractors));

      scopeFiles.forEach((f) => fd.append('scope_files', f));
      specFiles.forEach((f) => fd.append('spec_files', f));
      generalFiles.forEach((f) => fd.append('general_files', f));

      await apiPostFormData(`/api/projects/${params.id}/tenders`, fd);
      await fetchTenders();
      closeCreateModal();
      alert('Tender created successfully!');
    } catch (error: any) {
      console.error('Create tender error:', error);
      const message =
        error?.response?.data?.message ||
        error?.message ||
        'Failed to create tender';
      alert(message);
    } finally {
      setSaving(false);
    }
  };

  // ── Edit tender (with files — works for Draft AND Issued) ──

  const openEditModal = (tender: Tender) => {
    setEditingTender(tender);
    setFormData({
      title: tender.title,
      description: tender.description || '',
      category: tender.category,
      budgetedAmount: tender.budgetedAmount,
      submissionDeadline: tender.submissionDeadline
        ? new Date(tender.submissionDeadline).toISOString().split('T')[0]
        : '',
      scopeOfWorks: tender.scopeOfWorks || '',
      specifications: tender.specifications || '',
      complianceRequirements: tender.complianceRequirements || [],
      shortlistedContractors: tender.shortlistedContractors || [],
    });
    setScopeFiles([]);
    setSpecFiles([]);
    setGeneralFiles([]);
    setRemovedDocumentIds([]);
    setIsEditModalOpen(true);
  };

  const handleUpdateTender = async () => {
    if (!editingTender) return;
    if (!formData.title || !formData.budgetedAmount) {
      alert('Please fill in Title and Budgeted Amount');
      return;
    }

    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('title', formData.title);
      fd.append('description', formData.description);
      fd.append('category', formData.category);
      fd.append('budgetedAmount', String(formData.budgetedAmount));
      if (formData.submissionDeadline) {
        fd.append('submissionDeadline', formData.submissionDeadline);
      }
      fd.append('scopeOfWorks', formData.scopeOfWorks);
      fd.append('specifications', formData.specifications);
      fd.append('complianceRequirements', JSON.stringify(formData.complianceRequirements));
      fd.append('shortlistedContractors', JSON.stringify(formData.shortlistedContractors));
      fd.append('removedDocumentIds', JSON.stringify(removedDocumentIds));

      if (editingTender.status === 'Issued') {
        fd.append('changeDescription', 'Tender details updated after issuance');
      }

      scopeFiles.forEach((f) => fd.append('scope_files', f));
      specFiles.forEach((f) => fd.append('spec_files', f));
      generalFiles.forEach((f) => fd.append('general_files', f));

      await apiPutFormData(`/api/tenders/${editingTender._id}`, fd);
      await fetchTenders();
      closeEditModal();

      if (editingTender.status === 'Issued') {
        alert('Tender updated successfully! All contractors have been notified of the changes.');
      } else {
        alert('Tender updated successfully!');
      }
    } catch (error: any) {
      console.error('Update tender error:', error);
      const message =
        error?.response?.data?.message ||
        error?.message ||
        'Failed to update tender';
      alert(message);
    } finally {
      setSaving(false);
    }
  };

  // ── Issue tender ──

  const handleIssueTender = async (tenderId: string) => {
    if (!confirm('Issue this tender? Invitations will be sent to all shortlisted contractors.'))
      return;
    try {
      await apiClient.post(`/api/tenders/${tenderId}/issue`);
      await fetchTenders();
      alert('Tender issued successfully! Invitations sent.');
    } catch (error: any) {
      alert(error?.response?.data?.message || 'Failed to issue tender');
    }
  };

  // ── Delete tender ──

  const handleDeleteTender = async (tenderId: string) => {
    if (!confirm('Delete this tender? This cannot be undone.')) return;
    try {
      await apiClient.delete(`/api/tenders/${tenderId}`);
      await fetchTenders();
      alert('Tender deleted.');
    } catch (error: any) {
      alert(error?.response?.data?.message || 'Failed to delete tender');
    }
  };

  // ── Create contractor ──

  const handleCreateContractor = async () => {
    if (
      !contractorFormData.name ||
      !contractorFormData.email ||
      !contractorFormData.companyName
    ) {
      alert('Please fill in required fields');
      return;
    }
    setSaving(true);
    try {
      await apiClient.post('/api/contractors', contractorFormData);
      await fetchContractors();
      setIsContractorModalOpen(false);
      setContractorFormData({
        name: '',
        email: '',
        phone: '',
        companyName: '',
        companyAddress: '',
        registrationNumber: '',
        categories: [],
      });
      alert('Contractor added!');
    } catch (error: any) {
      alert(error?.response?.data?.message || 'Failed to create contractor');
    } finally {
      setSaving(false);
    }
  };

  // ── AI recommendations ──

  const handleGetAIRecommendations = async () => {
    setLoadingAI(true);
    try {
      const data = await apiClient.post(`/api/tenders/ai-recommendations`, {
        category: formData.category,
        budgetedAmount: formData.budgetedAmount,
      });
      setAiRecommendations(data);
      const recommendedIds =
        data.suggestedContractors?.map((c: any) => c.contractorId) || [];
      const selected = contractors
        .filter((c) => recommendedIds.includes(c._id))
        .map((c) => ({
          contractorId: c._id,
          name: c.name,
          email: c.email,
          phone: c.phone || '',
          status: 'Invited',
        }));
      setFormData({ ...formData, shortlistedContractors: selected });
    } catch {
      alert('Failed to get AI recommendations');
    } finally {
      setLoadingAI(false);
    }
  };

  // ── Contractor selection ──

  const toggleContractorSelection = (contractor: Contractor) => {
    const exists = formData.shortlistedContractors.find(
      (c) => c.contractorId === contractor._id
    );
    if (exists) {
      setFormData({
        ...formData,
        shortlistedContractors: formData.shortlistedContractors.filter(
          (c) => c.contractorId !== contractor._id
        ),
      });
    } else {
      setFormData({
        ...formData,
        shortlistedContractors: [
          ...formData.shortlistedContractors,
          {
            contractorId: contractor._id,
            name: contractor.name,
            email: contractor.email,
            phone: contractor.phone || '',
            status: 'Invited',
          },
        ],
      });
    }
  };

  // ── Compliance requirements ──

  const addComplianceItem = () => {
    if (!newComplianceItem.trim()) return;
    setFormData({
      ...formData,
      complianceRequirements: [
        ...formData.complianceRequirements,
        newComplianceItem.trim(),
      ],
    });
    setNewComplianceItem('');
  };

  const removeComplianceItem = (index: number) => {
    setFormData({
      ...formData,
      complianceRequirements: formData.complianceRequirements.filter(
        (_, i) => i !== index
      ),
    });
  };

  // ── Helpers ──

  const closeCreateModal = () => {
    setIsCreateModalOpen(false);
    resetForm();
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setEditingTender(null);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      category: 'Construction',
      budgetedAmount: 0,
      submissionDeadline: '',
      scopeOfWorks: '',
      specifications: '',
      complianceRequirements: [],
      shortlistedContractors: [],
    });
    setScopeFiles([]);
    setSpecFiles([]);
    setGeneralFiles([]);
    setRemovedDocumentIds([]);
    setAiRecommendations(null);
    setNewComplianceItem('');
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      Draft: 'bg-gray-100 text-gray-700',
      Issued: 'bg-blue-100 text-blue-700',
      RFI: 'bg-yellow-100 text-yellow-700',
      'Bid Evaluation': 'bg-purple-100 text-purple-700',
      Awarded: 'bg-green-100 text-green-700',
      Cancelled: 'bg-red-100 text-red-700',
    };
    return badges[status] || 'bg-gray-100 text-gray-700';
  };

  const handleRemoveExistingDoc = (docId: string) => {
    setRemovedDocumentIds([...removedDocumentIds, docId]);
  };

  const getExistingDocs = (section: string) =>
    (editingTender?.documents || []).filter(
      (d) => d.section === section && !removedDocumentIds.includes(d._id)
    );

  if (authLoading || loading) return <FitoutLoadingSpinner />;
  if (!user || user.role !== 'admin') return <FitoutLoadingSpinner />;

  // ═══════════════════════════════════════════════════════════
  // RENDER — Tender Form (shared between Create & Edit modals)
  // ═══════════════════════════════════════════════════════════

  const renderTenderForm = (isEdit: boolean) => (
    <div className="space-y-6">
      {/* Issued notice */}
      {isEdit && editingTender?.status === 'Issued' && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <Send size={18} className="text-amber-600 mt-0.5" />
            <div>
              <h4 className="font-semibold text-amber-900 text-sm">
                Editing an Issued Tender
              </h4>
              <p className="text-xs text-amber-700 mt-1">
                Changes will be saved and all shortlisted contractors will be automatically
                notified via email.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Basic Info */}
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="block text-sm font-medium mb-1">Tender Title *</label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full px-4 py-2 border rounded-lg"
            placeholder="e.g., Main Construction Works"
          />
        </div>

        <div className="col-span-2">
          <label className="block text-sm font-medium mb-1">Description</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={3}
            className="w-full px-4 py-2 border rounded-lg"
            placeholder="Brief description of the tender scope"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Category *</label>
          <select
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            className="w-full px-4 py-2 border rounded-lg"
          >
            {['Construction', 'Design', 'Joinery', 'MEP', 'Fixtures', 'Other'].map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Budgeted Amount *</label>
          <input
            type="number"
            min="0"
            value={formData.budgetedAmount || ''}
            onChange={(e) =>
              setFormData({
                ...formData,
                budgetedAmount: parseFloat(e.target.value) || 0,
              })
            }
            className="w-full px-4 py-2 border rounded-lg"
            placeholder="0"
          />
        </div>

        <div className="col-span-2">
          <label className="block text-sm font-medium mb-1">Submission Deadline</label>
          <input
            type="date"
            value={formData.submissionDeadline}
            onChange={(e) =>
              setFormData({ ...formData, submissionDeadline: e.target.value })
            }
            className="w-full px-4 py-2 border rounded-lg"
          />
        </div>
      </div>

      {/* Scope of Works + File Uploads */}
      <div>
        <label className="block text-sm font-medium mb-1">Scope of Works</label>
        <textarea
          value={formData.scopeOfWorks}
          onChange={(e) => setFormData({ ...formData, scopeOfWorks: e.target.value })}
          rows={4}
          className="w-full px-4 py-2 border rounded-lg"
          placeholder="Detailed scope of works for this tender"
        />
        <div className="mt-3">
          <FileUploadSection
            label="Scope of Works — Attachments"
            fieldName="scope_files"
            files={scopeFiles}
            existingFiles={isEdit ? getExistingDocs('scope') : []}
            onFilesChange={setScopeFiles}
            onRemoveExisting={isEdit ? handleRemoveExistingDoc : undefined}
            helpText="Drawings, BOQs, scope documents (PDF, DOC, DWG, XLS, etc.)"
          />
        </div>
      </div>

      {/* Technical Specifications + File Uploads */}
      <div>
        <label className="block text-sm font-medium mb-1">Technical Specifications</label>
        <textarea
          value={formData.specifications}
          onChange={(e) =>
            setFormData({ ...formData, specifications: e.target.value })
          }
          rows={4}
          className="w-full px-4 py-2 border rounded-lg"
          placeholder="Technical requirements and specifications"
        />
        <div className="mt-3">
          <FileUploadSection
            label="Technical Specifications — Attachments"
            fieldName="spec_files"
            files={specFiles}
            existingFiles={isEdit ? getExistingDocs('specifications') : []}
            onFilesChange={setSpecFiles}
            onRemoveExisting={isEdit ? handleRemoveExistingDoc : undefined}
            helpText="Specs, compliance docs, technical drawings"
          />
        </div>
      </div>

      {/* General File Attachments */}
      <FileUploadSection
        label="Additional Documents"
        fieldName="general_files"
        files={generalFiles}
        existingFiles={isEdit ? getExistingDocs('general') : []}
        onFilesChange={setGeneralFiles}
        onRemoveExisting={isEdit ? handleRemoveExistingDoc : undefined}
        helpText="Any other supporting documents"
      />

      {/* Compliance Requirements */}
      <div>
        <label className="block text-sm font-medium mb-2">Compliance Requirements</label>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={newComplianceItem}
            onChange={(e) => setNewComplianceItem(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addComplianceItem();
              }
            }}
            className="flex-1 px-4 py-2 border rounded-lg text-sm"
            placeholder="e.g., Must hold valid trade license"
          />
          <button
            type="button"
            onClick={addComplianceItem}
            className="px-4 py-2 bg-gray-100 border rounded-lg hover:bg-gray-200 text-sm"
          >
            Add
          </button>
        </div>
        {formData.complianceRequirements.length > 0 && (
          <div className="space-y-1.5">
            {formData.complianceRequirements.map((req, i) => (
              <div
                key={i}
                className="flex items-center justify-between px-3 py-2 bg-gray-50 border rounded-lg"
              >
                <span className="text-sm text-gray-700">{req}</span>
                <button
                  type="button"
                  onClick={() => removeComplianceItem(i)}
                  className="text-gray-400 hover:text-red-500"
                >
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Contractor Shortlist */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="block text-sm font-medium">Shortlist Contractors</label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setIsContractorModalOpen(true)}
              className="text-sm px-3 py-1 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 border"
            >
              <Plus size={14} className="inline mr-1" />
              New Contractor
            </button>
            <button
              type="button"
              onClick={handleGetAIRecommendations}
              disabled={loadingAI}
              className="text-sm px-3 py-1 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 border border-purple-200"
            >
              <Sparkles size={14} className="inline mr-1" />
              {loadingAI ? 'Loading...' : 'AI Recommendations'}
            </button>
          </div>
        </div>

        {aiRecommendations && (
          <div className="mb-4 p-4 bg-purple-50 border border-purple-200 rounded-lg">
            <h4 className="font-semibold text-purple-900 mb-2 text-sm">
              AI Recommendations
            </h4>
            <p className="text-sm text-purple-700 mb-3">
              {aiRecommendations.riskAssessment}
            </p>
            <div className="space-y-2">
              {aiRecommendations.suggestedContractors?.map(
                (rec: any, index: number) => (
                  <div
                    key={index}
                    className="text-sm bg-white p-2 rounded border border-purple-200"
                  >
                    <div className="font-medium">{rec.name}</div>
                    <div className="text-xs text-gray-600">
                      Score: {rec.score}/100 — {rec.reasoning}
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        )}

        <div className="border border-gray-200 rounded-lg max-h-64 overflow-y-auto">
          {contractors.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <p>No contractors available.</p>
              <button
                type="button"
                onClick={() => setIsContractorModalOpen(true)}
                className="mt-2 text-blue-600 hover:text-blue-700 text-sm"
              >
                Add Contractor
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {contractors.map((contractor) => {
                const isSelected = formData.shortlistedContractors.some(
                  (c) => c.contractorId === contractor._id
                );
                return (
                  <div
                    key={contractor._id}
                    className={`p-4 cursor-pointer hover:bg-gray-50 transition ${
                      isSelected ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                    }`}
                    onClick={() => toggleContractorSelection(contractor)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-gray-900">
                          {contractor.name}
                        </div>
                        <div className="text-sm text-gray-600">
                          {contractor.companyName}
                        </div>
                        <div className="text-xs text-gray-500">
                          {contractor.email}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-900">
                          {contractor.performance?.projectsCompleted || 0} projects
                        </div>
                        <div className="text-xs text-gray-500">
                          Rating: {contractor.performance?.averageRating || 0}/5
                        </div>
                        {isSelected && (
                          <span className="text-xs text-blue-600 font-medium">
                            ✓ Selected
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <p className="text-xs text-gray-500 mt-2">
          {formData.shortlistedContractors.length} contractor(s) selected
        </p>
      </div>
    </div>
  );

  // ═══════════════════════════════════════════════════════════
  // MAIN RENDER
  // ═══════════════════════════════════════════════════════════

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminSidebar pathname={pathname} setPathname={setPathname} />
      <AdminHeader />

      <main className="lg:ml-64 mt-16 p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.push(`/admin/projects/${params.id}`)}
            className="text-gray-600 hover:text-black mb-4 flex items-center gap-2 text-sm"
          >
            ← {projectName || 'Back to Project'}
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                Tender & Procurement
              </h1>
              <p className="text-sm text-gray-600">
                Manage tenders, contractors, and procurement workflow
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setIsContractorModalOpen(true)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm"
              >
                Add Contractor
              </button>
              <button
                onClick={() => {
                  resetForm();
                  setIsCreateModalOpen(true);
                }}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm"
              >
                <Plus size={18} />
                Create Tender
              </button>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6 border-b border-gray-200">
          <div className="flex gap-6">
            {['Overview', 'Tasks', 'Budget', 'Tender', 'Documents', 'Team'].map(
              (tab) => (
                <button
                  key={tab}
                  className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
                    tab === 'Tender'
                      ? 'border-black text-black'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                  onClick={() => {
                    if (tab === 'Overview')
                      router.push(`/admin/projects/${params.id}`);
                    if (tab === 'Tasks')
                      router.push(`/admin/projects/${params.id}/tasks`);
                    if (tab === 'Budget')
                      router.push(`/admin/projects/${params.id}/budget`);
                    if (tab === 'Documents')
                      router.push(`/admin/projects/${params.id}/documents`);
                    if (tab === 'Team')
                      router.push(`/admin/projects/${params.id}/team`);
                  }}
                >
                  {tab}
                </button>
              )
            )}
          </div>
        </div>

        {/* Tenders List */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Active Tenders ({tenders.length})
            </h2>
          </div>

          {tenders.length === 0 ? (
            <div className="p-12 text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No tenders yet
              </h3>
              <p className="text-gray-600 mb-6">
                Create your first tender to start the procurement process
              </p>
              <button
                onClick={() => {
                  resetForm();
                  setIsCreateModalOpen(true);
                }}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Create First Tender
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Tender #
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Title
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Budget
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Deadline
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Contractors
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Docs
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {tenders.map((tender) => (
                    <tr key={tender._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {tender.tenderNumber}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {tender.title}
                        </div>
                        {tender.description && (
                          <div className="text-xs text-gray-500 truncate max-w-[200px]">
                            {tender.description}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {tender.category}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {formatCurrency(tender.budgetedAmount)}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(
                            tender.status
                          )}`}
                        >
                          {tender.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {formatDate(tender.submissionDeadline)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {tender.shortlistedContractors?.length || 0} shortlisted
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {tender.documents?.length || 0} files
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() =>
                              router.push(
                                `/admin/projects/${params.id}/tender/${tender._id}`
                              )
                            }
                            className="text-blue-600 hover:text-blue-800 text-sm"
                          >
                            View
                          </button>

                          {['Draft', 'Issued'].includes(tender.status) && (
                            <button
                              onClick={() => openEditModal(tender)}
                              className="text-gray-600 hover:text-gray-800 text-sm"
                            >
                              Edit
                            </button>
                          )}

                          {tender.status === 'Draft' && (
                            <button
                              onClick={() => handleIssueTender(tender._id)}
                              className="text-green-600 hover:text-green-800 text-sm"
                            >
                              Issue
                            </button>
                          )}

                          {tender.status === 'Draft' && (
                            <button
                              onClick={() => handleDeleteTender(tender._id)}
                              className="text-red-600 hover:text-red-800 text-sm"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ═══ CREATE TENDER MODAL ═══ */}
        {isCreateModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white w-full max-w-4xl rounded-lg max-h-[90vh] overflow-y-auto">
              <div className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold">Create New Tender</h2>
                  <button
                    onClick={closeCreateModal}
                    className="text-gray-400 hover:text-black"
                  >
                    <X size={24} />
                  </button>
                </div>

                {renderTenderForm(false)}

                <div className="flex gap-3 mt-8">
                  <button
                    onClick={closeCreateModal}
                    className="flex-1 px-4 py-3 border rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateTender}
                    disabled={saving}
                    className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                  >
                    {saving ? 'Creating...' : 'Create Tender'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═══ EDIT TENDER MODAL ═══ */}
        {isEditModalOpen && editingTender && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white w-full max-w-4xl rounded-lg max-h-[90vh] overflow-y-auto">
              <div className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold">Edit Tender</h2>
                    <p className="text-sm text-gray-500 mt-1">
                      {editingTender.tenderNumber} — Status: {editingTender.status}
                    </p>
                  </div>
                  <button
                    onClick={closeEditModal}
                    className="text-gray-400 hover:text-black"
                  >
                    <X size={24} />
                  </button>
                </div>

                {renderTenderForm(true)}

                <div className="flex gap-3 mt-8">
                  <button
                    onClick={closeEditModal}
                    className="flex-1 px-4 py-3 border rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpdateTender}
                    disabled={saving}
                    className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                  >
                    {saving
                      ? 'Saving...'
                      : editingTender.status === 'Issued'
                        ? 'Save & Notify Contractors'
                        : 'Save Changes'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═══ ADD CONTRACTOR MODAL ═══ */}
        {isContractorModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white w-full max-w-2xl rounded-lg max-h-[90vh] overflow-y-auto">
              <div className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold">Add Contractor</h2>
                  <button
                    onClick={() => setIsContractorModalOpen(false)}
                    className="text-gray-400 hover:text-black"
                  >
                    <X size={24} />
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Contact Name *
                      </label>
                      <input
                        type="text"
                        value={contractorFormData.name}
                        onChange={(e) =>
                          setContractorFormData({
                            ...contractorFormData,
                            name: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2 border rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Email *</label>
                      <input
                        type="email"
                        value={contractorFormData.email}
                        onChange={(e) =>
                          setContractorFormData({
                            ...contractorFormData,
                            email: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2 border rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Phone</label>
                      <input
                        type="text"
                        value={contractorFormData.phone}
                        onChange={(e) =>
                          setContractorFormData({
                            ...contractorFormData,
                            phone: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2 border rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Company Name *
                      </label>
                      <input
                        type="text"
                        value={contractorFormData.companyName}
                        onChange={(e) =>
                          setContractorFormData({
                            ...contractorFormData,
                            companyName: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2 border rounded-lg"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium mb-1">
                        Company Address
                      </label>
                      <input
                        type="text"
                        value={contractorFormData.companyAddress}
                        onChange={(e) =>
                          setContractorFormData({
                            ...contractorFormData,
                            companyAddress: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2 border rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Registration Number
                      </label>
                      <input
                        type="text"
                        value={contractorFormData.registrationNumber}
                        onChange={(e) =>
                          setContractorFormData({
                            ...contractorFormData,
                            registrationNumber: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2 border rounded-lg"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setIsContractorModalOpen(false)}
                    className="flex-1 px-4 py-3 border rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateContractor}
                    disabled={saving}
                    className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg disabled:bg-gray-400"
                  >
                    {saving ? 'Adding...' : 'Add Contractor'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}