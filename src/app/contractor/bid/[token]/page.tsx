'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import { Upload, X, FileText, Download } from 'lucide-react';

interface TenderInfo {
  _id: string;
  tenderNumber: string;
  title: string;
  description: string;
  category: string;
  status: string;
  budgetedAmount: number;
  submissionDeadline?: string;
  scopeOfWorks?: string;
  specifications?: string;
  complianceRequirements: string[];
  documents: Array<{ _id: string; fileName: string; fileUrl: string; fileType: string; fileSize?: number; section: string }>;
}

interface ContractorInfo {
  contractorId: string;
  name: string;
  email: string;
  phone?: string;
}

interface BidAttachment {
  _id: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize?: number;
  category: string;
}

interface ExistingBid {
  _id: string;
  bidAmount: number;
  breakdownItems: Array<{ description: string; quantity: number; unitCost: number; total: number }>;
  assumptions?: string;
  exclusions?: string;
  comments?: string;
  proposedDuration?: number;
  status: string;
  submittedAt?: string;
  attachments?: BidAttachment[];
}

interface BreakdownItem {
  description: string;
  quantity: number;
  unitCost: number;
  total: number;
}

interface RFI {
  _id: string;
  question: string;
  response?: string;
  status: string;
  askedAt: string;
  answeredAt?: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

const categoryLabels: Record<string, string> = {
  proposal: 'Proposal',
  cost_breakdown: 'Cost Breakdown',
  technical_compliance: 'Technical Compliance',
  certification: 'Certification',
  other: 'Other Documents',
};

export default function ContractorBidPage() {
  const params = useParams();
  const token = params.token as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tender, setTender] = useState<TenderInfo | null>(null);
  const [contractor, setContractor] = useState<ContractorInfo | null>(null);
  const [existingBid, setExistingBid] = useState<ExistingBid | null>(null);
  const [isOverdue, setIsOverdue] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Bid form state
  const [bidAmount, setBidAmount] = useState<number>(0);
  const [breakdownItems, setBreakdownItems] = useState<BreakdownItem[]>([
    { description: '', quantity: 1, unitCost: 0, total: 0 },
  ]);
  const [assumptions, setAssumptions] = useState('');
  const [exclusions, setExclusions] = useState('');
  const [comments, setComments] = useState('');
  const [proposedDuration, setProposedDuration] = useState<number | ''>('');
  const [submitting, setSubmitting] = useState(false);

  // ★ File upload state
  const [bidFiles, setBidFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // RFI state
  const [rfis, setRfis] = useState<RFI[]>([]);
  const [newQuestion, setNewQuestion] = useState('');
  const [submittingRFI, setSubmittingRFI] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'bid' | 'rfi'>('details');

  const fetchTenderInfo = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/public/bid/${token}`);
      const data = await res.json();

      if (!res.ok) {
        setError(data.message || 'Failed to load tender information');
        return;
      }

      setTender(data.tender);
      setContractor(data.contractor);
      setExistingBid(data.existingBid);
      setIsOverdue(data.isOverdue);

      if (data.existingBid) {
        setBidAmount(data.existingBid.bidAmount);
        if (data.existingBid.breakdownItems?.length > 0) {
          setBreakdownItems(data.existingBid.breakdownItems);
        }
        setAssumptions(data.existingBid.assumptions || '');
        setExclusions(data.existingBid.exclusions || '');
        setComments(data.existingBid.comments || '');
        setProposedDuration(data.existingBid.proposedDuration || '');
        if (data.existingBid.status === 'Submitted') {
          setSubmitted(true);
        }
      }
    } catch {
      setError('Unable to connect. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  const fetchRFIs = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/public/bid/${token}/rfis`);
      if (res.ok) {
        const data = await res.json();
        setRfis(data);
      }
    } catch {}
  }, [token]);

  useEffect(() => {
    if (token) {
      fetchTenderInfo();
      fetchRFIs();
    }
  }, [token, fetchTenderInfo, fetchRFIs]);

  const updateBreakdownItem = (index: number, field: keyof BreakdownItem, value: string | number) => {
    const updated = [...breakdownItems];
    (updated[index] as any)[field] = value;
    if (field === 'quantity' || field === 'unitCost') {
      updated[index].total = Number(updated[index].quantity) * Number(updated[index].unitCost);
    }
    setBreakdownItems(updated);
    const total = updated.reduce((sum, item) => sum + (item.total || 0), 0);
    if (total > 0) setBidAmount(total);
  };

  const addBreakdownItem = () => {
    setBreakdownItems([...breakdownItems, { description: '', quantity: 1, unitCost: 0, total: 0 }]);
  };

  const removeBreakdownItem = (index: number) => {
    if (breakdownItems.length <= 1) return;
    const updated = breakdownItems.filter((_, i) => i !== index);
    setBreakdownItems(updated);
    const total = updated.reduce((sum, item) => sum + (item.total || 0), 0);
    if (total > 0) setBidAmount(total);
  };

  const addBidFiles = (files: FileList) => {
    const newFiles = Array.from(files);
    if (bidFiles.length + newFiles.length > 10) {
      alert('Maximum 10 files allowed');
      return;
    }
    setBidFiles([...bidFiles, ...newFiles]);
  };

  const removeBidFile = (index: number) => {
    setBidFiles(bidFiles.filter((_, i) => i !== index));
  };

  const handleSubmitBid = async () => {
    if (!bidAmount || bidAmount <= 0) {
      alert('Please enter a valid bid amount');
      return;
    }
    if (!confirm('Are you sure you want to submit your bid? This action cannot be undone.')) {
      return;
    }

    setSubmitting(true);
    try {
      // Use FormData for file uploads
      const formData = new FormData();
      formData.append('bidAmount', String(bidAmount));
      formData.append(
        'breakdownItems',
        JSON.stringify(breakdownItems.filter((item) => item.description.trim()))
      );
      formData.append('assumptions', assumptions);
      formData.append('exclusions', exclusions);
      formData.append('comments', comments);
      if (proposedDuration) {
        formData.append('proposedDuration', String(proposedDuration));
      }

      // Append files
      bidFiles.forEach((file) => {
        formData.append('bid_files', file);
      });

      const res = await fetch(`${API_URL}/api/public/bid/${token}`, {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.message || 'Failed to submit bid');
        return;
      }

      setSubmitted(true);
      setExistingBid(data.bid);
      alert('Your bid has been submitted successfully! A confirmation email has been sent.');
    } catch {
      alert('Unable to submit. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitRFI = async () => {
    if (!newQuestion.trim()) {
      alert('Please enter your question');
      return;
    }
    setSubmittingRFI(true);
    try {
      const res = await fetch(`${API_URL}/api/public/bid/${token}/rfi`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: newQuestion }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.message || 'Failed to submit question');
        return;
      }
      setNewQuestion('');
      await fetchRFIs();
      alert('Your question has been submitted.');
    } catch {
      alert('Unable to submit. Please try again.');
    } finally {
      setSubmittingRFI(false);
    }
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(amount);

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not specified';
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getSectionDocs = (section: string) =>
    tender?.documents?.filter((d) => d.section === section) || [];

  // ─── Loading / Error states ──────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading tender information...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 max-w-md text-center">
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Unable to Load Tender</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <p className="text-sm text-gray-500">If you believe this is an error, please contact the project team.</p>
        </div>
      </div>
    );
  }

  if (!tender || !contractor) return null;

  const deadlineDate = tender.submissionDeadline ? new Date(tender.submissionDeadline) : null;
  const daysRemaining = deadlineDate ? Math.ceil((deadlineDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null;

  // ─── Main render ──────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-500 font-medium">Tender Bid Portal</div>
              <div className="text-lg font-bold text-gray-900">{tender.tenderNumber}</div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">Logged in as</div>
              <div className="font-medium text-gray-900">{contractor.name}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        {/* Success Banner */}
        {submitted && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-xl p-5">
            <div className="flex items-start gap-3">
              <span className="text-green-600 text-xl">✅</span>
              <div>
                <h3 className="font-semibold text-green-900">Bid Submitted Successfully</h3>
                <p className="text-sm text-green-700 mt-1">
                  Your bid of {formatCurrency(existingBid?.bidAmount || bidAmount)} has been received.
                  {existingBid?.attachments && existingBid.attachments.length > 0 && (
                    <span> ({existingBid.attachments.length} file(s) attached)</span>
                  )}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Overdue warning */}
        {isOverdue && !submitted && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-5">
            <div className="flex items-start gap-3">
              <span className="text-red-500 text-xl">⏰</span>
              <div>
                <h3 className="font-semibold text-red-900">Submission Deadline Passed</h3>
                <p className="text-sm text-red-700 mt-1">
                  The deadline was {formatDate(tender.submissionDeadline)}. Late submissions may not be accepted.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Deadline notice */}
        {!isOverdue && daysRemaining !== null && daysRemaining <= 7 && !submitted && (
          <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl p-5">
            <div className="flex items-start gap-3">
              <span className="text-amber-500 text-xl">⏰</span>
              <div>
                <h3 className="font-semibold text-amber-900">
                  {daysRemaining <= 1 ? 'Due Tomorrow!' : `${daysRemaining} Days Remaining`}
                </h3>
                <p className="text-sm text-amber-700 mt-1">Deadline: {formatDate(tender.submissionDeadline)}</p>
              </div>
            </div>
          </div>
        )}

        {/* Title */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">{tender.title}</h1>
          {tender.description && <p className="text-gray-600">{tender.description}</p>}
        </div>

        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <div className="flex gap-6">
            {(['details', 'bid', 'rfi'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors capitalize ${
                  activeTab === tab ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab === 'details' && 'Tender Details'}
                {tab === 'bid' && (submitted ? '✓ My Bid' : 'Submit Bid')}
                {tab === 'rfi' && `Questions (${rfis.length})`}
              </button>
            ))}
          </div>
        </div>

        {/* ═══ DETAILS TAB ═══ */}
        {activeTab === 'details' && (
          <div className="space-y-6">
            {/* Key info */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <div className="text-sm text-gray-500 mb-1">Category</div>
                <div className="text-lg font-semibold text-gray-900">{tender.category}</div>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <div className="text-sm text-gray-500 mb-1">Status</div>
                <div className="text-lg font-semibold text-gray-900">{tender.status}</div>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <div className="text-sm text-gray-500 mb-1">Deadline</div>
                <div className={`text-lg font-semibold ${isOverdue ? 'text-red-600' : 'text-gray-900'}`}>
                  {deadlineDate ? formatDate(tender.submissionDeadline) : 'Not specified'}
                </div>
              </div>
            </div>

            {/* Scope of Works + Attachments */}
            {(tender.scopeOfWorks || getSectionDocs('scope').length > 0) && (
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h3 className="text-lg font-semibold mb-3">Scope of Works</h3>
                {tender.scopeOfWorks && (
                  <p className="text-gray-700 whitespace-pre-wrap leading-relaxed mb-4">{tender.scopeOfWorks}</p>
                )}
                {getSectionDocs('scope').length > 0 && (
                  <div>
                    <div className="text-sm font-medium text-gray-600 mb-2">
                      Attached Documents ({getSectionDocs('scope').length})
                    </div>
                    <div className="space-y-2">
                      {getSectionDocs('scope').map((doc) => (
                        <a
                          key={doc._id}
                          href={doc.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition group"
                        >
                          <div className="flex items-center gap-3">
                            <FileText size={18} className="text-blue-600" />
                            <div>
                              <div className="font-medium text-gray-900 text-sm">{doc.fileName}</div>
                              {doc.fileSize && <div className="text-xs text-gray-500">{formatFileSize(doc.fileSize)}</div>}
                            </div>
                          </div>
                          <Download size={16} className="text-gray-400 group-hover:text-blue-600" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Specifications + Attachments */}
            {(tender.specifications || getSectionDocs('specifications').length > 0) && (
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h3 className="text-lg font-semibold mb-3">Technical Specifications</h3>
                {tender.specifications && (
                  <p className="text-gray-700 whitespace-pre-wrap leading-relaxed mb-4">{tender.specifications}</p>
                )}
                {getSectionDocs('specifications').length > 0 && (
                  <div>
                    <div className="text-sm font-medium text-gray-600 mb-2">
                      Attached Documents ({getSectionDocs('specifications').length})
                    </div>
                    <div className="space-y-2">
                      {getSectionDocs('specifications').map((doc) => (
                        <a
                          key={doc._id}
                          href={doc.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition group"
                        >
                          <div className="flex items-center gap-3">
                            <FileText size={18} className="text-blue-600" />
                            <div>
                              <div className="font-medium text-gray-900 text-sm">{doc.fileName}</div>
                              {doc.fileSize && <div className="text-xs text-gray-500">{formatFileSize(doc.fileSize)}</div>}
                            </div>
                          </div>
                          <Download size={16} className="text-gray-400 group-hover:text-blue-600" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Compliance */}
            {tender.complianceRequirements?.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h3 className="text-lg font-semibold mb-3">Compliance Requirements</h3>
                <ul className="list-disc list-inside space-y-1.5 text-gray-700">
                  {tender.complianceRequirements.map((req, i) => (
                    <li key={i}>{req}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* General documents */}
            {getSectionDocs('general').length > 0 && (
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h3 className="text-lg font-semibold mb-3">Additional Documents ({getSectionDocs('general').length})</h3>
                <div className="space-y-2">
                  {getSectionDocs('general').map((doc) => (
                    <a
                      key={doc._id}
                      href={doc.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition group"
                    >
                      <div className="flex items-center gap-3">
                        <FileText size={18} className="text-blue-600" />
                        <div>
                          <div className="font-medium text-gray-900 text-sm">{doc.fileName}</div>
                          {doc.fileSize && <div className="text-xs text-gray-500">{formatFileSize(doc.fileSize)}</div>}
                        </div>
                      </div>
                      <Download size={16} className="text-gray-400 group-hover:text-blue-600" />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {!submitted && !isOverdue && (
              <div className="text-center py-4">
                <button
                  onClick={() => setActiveTab('bid')}
                  className="px-8 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition"
                >
                  Proceed to Submit Bid
                </button>
              </div>
            )}
          </div>
        )}

        {/* ═══ BID TAB ═══ */}
        {activeTab === 'bid' && (
          <div className="space-y-6">
            {submitted ? (
              /* ─── Submitted bid summary ─── */
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h3 className="text-lg font-semibold mb-4">Submitted Bid</h3>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <div className="text-sm text-gray-500">Total Bid Amount</div>
                    <div className="text-2xl font-bold text-gray-900">{formatCurrency(existingBid?.bidAmount || bidAmount)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Submitted</div>
                    <div className="font-medium text-gray-900">
                      {existingBid?.submittedAt ? new Date(existingBid.submittedAt).toLocaleString() : 'Just now'}
                    </div>
                  </div>
                </div>

                {/* Breakdown table */}
                {breakdownItems.filter((i) => i.description).length > 0 && (
                  <div className="mb-4">
                    <h4 className="font-medium text-gray-900 mb-2">Price Breakdown</h4>
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="text-left px-3 py-2 text-gray-500">Item</th>
                          <th className="text-right px-3 py-2 text-gray-500">Qty</th>
                          <th className="text-right px-3 py-2 text-gray-500">Unit Cost</th>
                          <th className="text-right px-3 py-2 text-gray-500">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {breakdownItems.filter((i) => i.description).map((item, idx) => (
                          <tr key={idx} className="border-b border-gray-100">
                            <td className="px-3 py-2">{item.description}</td>
                            <td className="px-3 py-2 text-right">{item.quantity}</td>
                            <td className="px-3 py-2 text-right">{formatCurrency(item.unitCost)}</td>
                            <td className="px-3 py-2 text-right font-medium">{formatCurrency(item.total)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {comments && (
                  <div className="mt-4">
                    <div className="text-sm font-medium text-gray-700 mb-1">Comments</div>
                    <p className="text-gray-600 text-sm">{comments}</p>
                  </div>
                )}
                {assumptions && (
                  <div className="mt-3">
                    <div className="text-sm font-medium text-gray-700 mb-1">Assumptions</div>
                    <p className="text-gray-600 text-sm">{assumptions}</p>
                  </div>
                )}
                {exclusions && (
                  <div className="mt-3">
                    <div className="text-sm font-medium text-gray-700 mb-1">Exclusions</div>
                    <p className="text-gray-600 text-sm">{exclusions}</p>
                  </div>
                )}

                {/* Show submitted attachments */}
                {existingBid?.attachments && existingBid.attachments.length > 0 && (
                  <div className="mt-4">
                    <div className="text-sm font-medium text-gray-700 mb-2">
                      Attached Files ({existingBid.attachments.length})
                    </div>
                    <div className="space-y-2">
                      {existingBid.attachments.map((att) => (
                        <a
                          key={att._id}
                          href={att.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                        >
                          <FileText size={16} className="text-blue-600" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">{att.fileName}</div>
                            <div className="text-xs text-gray-500">
                              {categoryLabels[att.category] || att.category}
                              {att.fileSize ? ` • ${formatFileSize(att.fileSize)}` : ''}
                            </div>
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* ─── Bid submission form ─── */
              <>
                {/* Price Breakdown */}
                <div className="bg-white border border-gray-200 rounded-xl p-6">
                  <h3 className="text-lg font-semibold mb-4">Price Breakdown</h3>
                  <p className="text-sm text-gray-500 mb-4">Add line items. Total is calculated automatically.</p>
                  <div className="space-y-3">
                    {breakdownItems.map((item, index) => (
                      <div key={index} className="flex gap-2 items-start">
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => updateBreakdownItem(index, 'description', e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          placeholder="Description"
                        />
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateBreakdownItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                          className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-sm text-right"
                          placeholder="Qty"
                        />
                        <input
                          type="number"
                          min="0"
                          value={item.unitCost || ''}
                          onChange={(e) => updateBreakdownItem(index, 'unitCost', parseFloat(e.target.value) || 0)}
                          className="w-32 px-3 py-2 border border-gray-300 rounded-lg text-sm text-right"
                          placeholder="Unit cost"
                        />
                        <div className="w-32 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-right font-medium">
                          {formatCurrency(item.total)}
                        </div>
                        <button onClick={() => removeBreakdownItem(index)} className="p-2 text-gray-400 hover:text-red-500">
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                  <button onClick={addBreakdownItem} className="mt-3 text-sm text-blue-600 hover:text-blue-700 font-medium">
                    + Add Line Item
                  </button>
                </div>

                {/* Total */}
                <div className="bg-white border border-gray-200 rounded-xl p-6">
                  <h3 className="text-lg font-semibold mb-4">Total Bid Amount</h3>
                  <div className="flex items-center gap-4">
                    <span className="text-gray-500 text-lg">$</span>
                    <input
                      type="number"
                      min="0"
                      value={bidAmount || ''}
                      onChange={(e) => setBidAmount(parseFloat(e.target.value) || 0)}
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-xl font-bold"
                      placeholder="Enter total bid amount"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Auto-calculated from breakdown or enter a lump sum.</p>
                </div>

                {/* ★ File Attachments */}
                <div className="bg-white border border-gray-200 rounded-xl p-6">
                  <h3 className="text-lg font-semibold mb-3">Supporting Documents</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Upload proposal files, cost breakdowns, technical compliance sheets, or other supporting documents.
                  </p>

                  <div
                    className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-gray-400 bg-gray-50"
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      addBidFiles(e.dataTransfer.files);
                    }}
                  >
                    <Upload size={24} className="mx-auto mb-2 text-gray-400" />
                    <p className="text-sm text-gray-600">
                      Drag & drop files here, or <span className="text-blue-600 font-medium">browse</span>
                    </p>
                    <p className="text-xs text-gray-400 mt-1">PDF, DOC, XLS, images, DWG — max 50MB each</p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.dwg,.dxf,.zip,.csv,.pptx"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files) addBidFiles(e.target.files);
                        e.target.value = '';
                      }}
                    />
                  </div>

                  {bidFiles.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {bidFiles.map((file, index) => (
                        <div key={`${file.name}-${index}`} className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <div className="flex items-center gap-3 min-w-0">
                            <FileText size={16} className="text-blue-600 flex-shrink-0" />
                            <span className="text-sm text-gray-800 truncate">{file.name}</span>
                            <span className="text-xs text-gray-400 flex-shrink-0">{formatFileSize(file.size)}</span>
                          </div>
                          <button onClick={() => removeBidFile(index)} className="p-1 text-gray-400 hover:text-red-500">
                            <X size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Additional fields */}
                <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Proposed Duration (days)</label>
                    <input
                      type="number"
                      min="1"
                      value={proposedDuration}
                      onChange={(e) => setProposedDuration(parseInt(e.target.value) || '')}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      placeholder="e.g. 90"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Comments</label>
                    <textarea
                      value={comments}
                      onChange={(e) => setComments(e.target.value)}
                      rows={4}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      placeholder="Any additional comments about your bid..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Assumptions / Conditions</label>
                    <textarea
                      value={assumptions}
                      onChange={(e) => setAssumptions(e.target.value)}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      placeholder="Any assumptions or conditions..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Exclusions</label>
                    <textarea
                      value={exclusions}
                      onChange={(e) => setExclusions(e.target.value)}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      placeholder="Items excluded from your bid..."
                    />
                  </div>
                </div>

                {/* Submit */}
                <button
                  onClick={handleSubmitBid}
                  disabled={submitting || !bidAmount || bidAmount <= 0}
                  className="w-full px-6 py-4 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition text-lg"
                >
                  {submitting ? 'Submitting...' : `Submit Bid — ${formatCurrency(bidAmount)}`}
                  {bidFiles.length > 0 && ` (${bidFiles.length} file${bidFiles.length > 1 ? 's' : ''} attached)`}
                </button>
              </>
            )}
          </div>
        )}

        {/* ═══ RFI TAB ═══ */}
        {activeTab === 'rfi' && (
          <div className="space-y-6">
            {!submitted && (
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h3 className="text-lg font-semibold mb-3">Ask a Question</h3>
                <p className="text-sm text-gray-500 mb-3">Need clarification? Submit your question below.</p>
                <textarea
                  value={newQuestion}
                  onChange={(e) => setNewQuestion(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-3"
                  placeholder="Type your question..."
                />
                <button
                  onClick={handleSubmitRFI}
                  disabled={submittingRFI || !newQuestion.trim()}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 text-sm font-medium"
                >
                  {submittingRFI ? 'Sending...' : 'Submit Question'}
                </button>
              </div>
            )}

            {rfis.length === 0 ? (
              <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
                <div className="text-gray-400 text-3xl mb-3">💬</div>
                <h3 className="font-semibold text-gray-900 mb-1">No questions yet</h3>
                <p className="text-sm text-gray-500">Submit a question if you need clarification.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {rfis.map((rfi) => (
                  <div key={rfi._id} className="bg-white border border-gray-200 rounded-xl p-5">
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          rfi.status === 'Answered' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                        }`}
                      >
                        {rfi.status}
                      </span>
                      <span className="text-xs text-gray-400">{new Date(rfi.askedAt).toLocaleDateString()}</span>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3 mb-2">
                      <div className="text-xs text-gray-500 mb-1 font-medium">Your Question</div>
                      <p className="text-gray-900 text-sm">{rfi.question}</p>
                    </div>
                    {rfi.response && (
                      <div className="bg-blue-50 rounded-lg p-3">
                        <div className="text-xs text-blue-600 mb-1 font-medium">Response</div>
                        <p className="text-blue-900 text-sm">{rfi.response}</p>
                        {rfi.answeredAt && (
                          <div className="text-xs text-blue-500 mt-1">Answered {new Date(rfi.answeredAt).toLocaleDateString()}</div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <footer className="border-t border-gray-200 mt-12 py-6 text-center text-sm text-gray-400">
        Tender Bid Portal &middot; Confidential
      </footer>
    </div>
  );
}