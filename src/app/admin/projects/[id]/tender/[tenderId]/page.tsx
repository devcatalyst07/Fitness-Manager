'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { apiClient } from '@/lib/axios';
import AdminSidebar from '@/components/AdminSidebar';
import AdminHeader from '@/components/AdminHeader';
import FitoutLoadingSpinner from '@/components/FitoutLoadingSpinner';

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
  awardedReason?: string;
  awardDate?: string; 
  scopeOfWorks?: string;
  specifications?: string;
  complianceRequirements: string[];
  shortlistedContractors: Array<{
    contractorId: string;
    name: string;
    email: string;
    phone?: string;
    status: string;
    invitedAt?: string;
  }>;
  createdBy: { name: string; email: string };
  createdAt: string;
}

interface Bid {
  _id: string;
  contractorName: string;
  contractorEmail: string;
  bidAmount: number;
  breakdownItems: Array<{
    description: string;
    quantity: number;
    unitCost: number;
    total: number;
  }>;
  assumptions?: string;
  exclusions?: string;
  proposedStartDate?: string;
  proposedCompletionDate?: string;
  proposedDuration?: number;
  status: string;
  submittedAt?: string;
  evaluationScore?: number;
  evaluationNotes?: string;
}

interface RFI {
  _id: string;
  contractorName: string;
  question: string;
  response?: string;
  status: string;
  askedAt: string;
  answeredAt?: string;
  answeredBy?: { name: string };
}

export default function TenderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { user, loading: authLoading } = useAuth();

  const [pathname, setPathname] = useState('/admin/projects');
  const [loading, setLoading] = useState(true);
  const [tender, setTender] = useState<Tender | null>(null);
  const [bids, setBids] = useState<Bid[]>([]);
  const [rfis, setRfis] = useState<RFI[]>([]);
  const [activeTab, setActiveTab] = useState<'details' | 'bids' | 'rfis'>('details');
  
  const [isAwardModalOpen, setIsAwardModalOpen] = useState(false);
  const [selectedBidForAward, setSelectedBidForAward] = useState<Bid | null>(null);
  const [awardReason, setAwardReason] = useState('');
  
  const [isRFIResponseModalOpen, setIsRFIResponseModalOpen] = useState(false);
  const [selectedRFI, setSelectedRFI] = useState<RFI | null>(null);
  const [rfiResponse, setRfiResponse] = useState('');
  
  const [isBidEvalModalOpen, setIsBidEvalModalOpen] = useState(false);
  const [selectedBidForEval, setSelectedBidForEval] = useState<Bid | null>(null);
  const [evalScore, setEvalScore] = useState(0);
  const [evalNotes, setEvalNotes] = useState('');

  const [saving, setSaving] = useState(false);

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
    if (user && user.role === 'admin' && params.tenderId) {
      fetchTenderDetails();
    }
  }, [user, params.tenderId]);

  const fetchTenderDetails = async () => {
    setLoading(true);
    try {
      const data = await apiClient.get(`/api/tenders/${params.tenderId}`);
      setTender(data);
      setBids(data.bids || []);
      setRfis(data.rfis || []);
    } catch (error) {
      console.error('Error fetching tender details:', error);
      alert('Failed to load tender details');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerRFI = async () => {
    if (!selectedRFI || !rfiResponse.trim()) {
      alert('Please enter a response');
      return;
    }

    setSaving(true);
    try {
      await apiClient.put(`/api/rfis/${selectedRFI._id}/answer`, {
        response: rfiResponse,
      });
      await fetchTenderDetails();
      setIsRFIResponseModalOpen(false);
      setSelectedRFI(null);
      setRfiResponse('');
      alert('RFI answered successfully!');
    } catch (error: any) {
      console.error('Answer RFI error:', error);
      alert(error?.response?.data?.message || 'Failed to answer RFI');
    } finally {
      setSaving(false);
    }
  };

  const handleEvaluateBid = async () => {
    if (!selectedBidForEval) return;

    setSaving(true);
    try {
      await apiClient.put(
        `/api/tenders/${params.tenderId}/bids/${selectedBidForEval._id}/evaluate`,
        {
          evaluationScore: evalScore,
          evaluationNotes: evalNotes,
          status: 'Under Review',
        }
      );
      await fetchTenderDetails();
      setIsBidEvalModalOpen(false);
      setSelectedBidForEval(null);
      setEvalScore(0);
      setEvalNotes('');
      alert('Bid evaluated successfully!');
    } catch (error: any) {
      console.error('Evaluate bid error:', error);
      alert(error?.response?.data?.message || 'Failed to evaluate bid');
    } finally {
      setSaving(false);
    }
  };

  const handleAwardTender = async () => {
    if (!selectedBidForAward) return;

    if (!confirm(`Are you sure you want to award this tender to ${selectedBidForAward.contractorName} for ${formatCurrency(selectedBidForAward.bidAmount)}?`)) {
      return;
    }

    setSaving(true);
    try {
      await apiClient.post(`/api/tenders/${params.tenderId}/award`, {
        bidId: selectedBidForAward._id,
        awardedReason: awardReason,
      });
      await fetchTenderDetails();
      setIsAwardModalOpen(false);
      setSelectedBidForAward(null);
      setAwardReason('');
      alert('Tender awarded successfully!');
    } catch (error: any) {
      console.error('Award tender error:', error);
      alert(error?.response?.data?.message || 'Failed to award tender');
    } finally {
      setSaving(false);
    }
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
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      Draft: 'bg-gray-100 text-gray-700',
      Submitted: 'bg-blue-100 text-blue-700',
      'Under Review': 'bg-yellow-100 text-yellow-700',
      Accepted: 'bg-green-100 text-green-700',
      Rejected: 'bg-red-100 text-red-700',
      Pending: 'bg-orange-100 text-orange-700',
      Answered: 'bg-green-100 text-green-700',
      Closed: 'bg-gray-100 text-gray-700',
      Issued: 'bg-blue-100 text-blue-700',
      RFI: 'bg-yellow-100 text-yellow-700',
      'Bid Evaluation': 'bg-purple-100 text-purple-700',
      Awarded: 'bg-green-100 text-green-700',
      Cancelled: 'bg-red-100 text-red-700',
    };
    return badges[status] || 'bg-gray-100 text-gray-700';
  };

  if (authLoading || loading) return <FitoutLoadingSpinner />;
  if (!user || user.role !== 'admin' || !tender) return <FitoutLoadingSpinner />;

  const lowestBid = bids.length > 0 ? Math.min(...bids.map(b => b.bidAmount)) : 0;
  const highestBid = bids.length > 0 ? Math.max(...bids.map(b => b.bidAmount)) : 0;
  const averageBid = bids.length > 0 ? bids.reduce((sum, b) => sum + b.bidAmount, 0) / bids.length : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminSidebar pathname={pathname} setPathname={setPathname} />
      <AdminHeader />

      <main className="lg:ml-64 mt-16 p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.push(`/admin/projects/${params.id}/tender`)}
            className="text-gray-600 hover:text-black mb-4 flex items-center gap-2"
          >
            <span>Back to Tenders</span>
          </button>
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                  {tender.tenderNumber}
                </h1>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(tender.status)}`}
                >
                  {tender.status}
                </span>
              </div>
              <h2 className="text-xl font-semibold text-gray-700 mb-1">
                {tender.title}
              </h2>
              <p className="text-sm text-gray-600">{tender.description}</p>
            </div>
          </div>
        </div>

        {/* Key Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="text-sm text-gray-600 mb-1">Budgeted Amount</div>
            <div className="text-2xl font-bold text-gray-900">
              {formatCurrency(tender.budgetedAmount)}
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="text-sm text-gray-600 mb-1">Bids Received</div>
            <div className="text-2xl font-bold text-gray-900">{bids.length}</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="text-sm text-gray-600 mb-1">Lowest Bid</div>
            <div className="text-2xl font-bold text-green-600">
              {bids.length > 0 ? formatCurrency(lowestBid) : 'N/A'}
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="text-sm text-gray-600 mb-1">Average Bid</div>
            <div className="text-2xl font-bold text-blue-600">
              {bids.length > 0 ? formatCurrency(averageBid) : 'N/A'}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <div className="flex gap-6">
            <button
              onClick={() => setActiveTab('details')}
              className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'details'
                  ? 'border-black text-black'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Tender Details
            </button>
            <button
              onClick={() => setActiveTab('bids')}
              className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'bids'
                  ? 'border-black text-black'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Bids ({bids.length})
            </button>
            <button
              onClick={() => setActiveTab('rfis')}
              className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'rfis'
                  ? 'border-black text-black'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              RFIs ({rfis.filter(r => r.status === 'Pending').length})
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'details' && (
          <div className="space-y-6">
            {/* Tender Information */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold mb-4">Tender Information</h3>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <div className="text-sm text-gray-600 mb-1">Category</div>
                  <div className="font-medium">{tender.category}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 mb-1">Issue Date</div>
                  <div className="font-medium">{formatDate(tender.issueDate)}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 mb-1">Submission Deadline</div>
                  <div className="font-medium">{formatDate(tender.submissionDeadline)}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 mb-1">Created By</div>
                  <div className="font-medium">{tender.createdBy.name}</div>
                </div>
              </div>
            </div>

            {/* Scope of Works */}
            {tender.scopeOfWorks && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold mb-4">Scope of Works</h3>
                <p className="text-gray-700 whitespace-pre-wrap">{tender.scopeOfWorks}</p>
              </div>
            )}

            {/* Specifications */}
            {tender.specifications && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold mb-4">Technical Specifications</h3>
                <p className="text-gray-700 whitespace-pre-wrap">{tender.specifications}</p>
              </div>
            )}

            {/* Compliance Requirements */}
            {tender.complianceRequirements.length > 0 && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold mb-4">Compliance Requirements</h3>
                <ul className="list-disc list-inside space-y-2">
                  {tender.complianceRequirements.map((req, index) => (
                    <li key={index} className="text-gray-700">
                      {req}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Shortlisted Contractors */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold mb-4">
                Shortlisted Contractors ({tender.shortlistedContractors.length})
              </h3>
              <div className="space-y-3">
                {tender.shortlistedContractors.map((contractor, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
                  >
                    <div>
                      <div className="font-medium text-gray-900">{contractor.name}</div>
                      <div className="text-sm text-gray-600">{contractor.email}</div>
                      {contractor.phone && (
                        <div className="text-sm text-gray-600">{contractor.phone}</div>
                      )}
                    </div>
                    <div className="text-right">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(contractor.status)}`}
                      >
                        {contractor.status}
                      </span>
                      {contractor.invitedAt && (
                        <div className="text-xs text-gray-500 mt-1">
                          Invited: {formatDate(contractor.invitedAt)}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Award Information */}
            {tender.status === 'Awarded' && tender.awardedContractorId && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4 text-green-900">
                  Award Information
                </h3>
                <div className="space-y-2">
                  <div>
                    <span className="text-sm text-green-700">Awarded Amount: </span>
                    <span className="font-bold text-green-900">
                      {formatCurrency(tender.awardedAmount || 0)}
                    </span>
                  </div>
                  <div>
                    <span className="text-sm text-green-700">Award Date: </span>
                    <span className="font-medium text-green-900">
                      {formatDate(tender.awardDate)}
                    </span>
                  </div>
                  {tender.awardedReason && (
                    <div>
                      <span className="text-sm text-green-700">Reason: </span>
                      <span className="text-green-900">{tender.awardedReason}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'bids' && (
          <div className="bg-white rounded-lg border border-gray-200">
            {bids.length === 0 ? (
              <div className="p-12 text-center">
                <div className="text-gray-400 mb-4 text-4xl">📊</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No bids yet</h3>
                <p className="text-gray-600">
                  Waiting for contractors to submit their bids
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Contractor
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Bid Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Variance
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Duration
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Evaluation
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {bids.map((bid) => {
                      const variance = bid.bidAmount - tender.budgetedAmount;
                      const variancePercent =
                        (variance / tender.budgetedAmount) * 100;
                      
                      return (
                        <tr key={bid._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div className="font-medium text-gray-900">
                              {bid.contractorName}
                            </div>
                            <div className="text-sm text-gray-600">
                              {bid.contractorEmail}
                            </div>
                            {bid.submittedAt && (
                              <div className="text-xs text-gray-500">
                                Submitted: {formatDate(bid.submittedAt)}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div className="font-bold text-gray-900">
                              {formatCurrency(bid.bidAmount)}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div
                              className={`text-sm font-medium ${
                                variance < 0
                                  ? 'text-green-600'
                                  : variance > 0
                                  ? 'text-red-600'
                                  : 'text-gray-600'
                              }`}
                            >
                              {variance > 0 ? '+' : ''}
                              {formatCurrency(variance)}
                              <span className="text-xs ml-1">
                                ({variancePercent > 0 ? '+' : ''}
                                {variancePercent.toFixed(1)}%)
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {bid.proposedDuration
                              ? `${bid.proposedDuration} days`
                              : 'Not specified'}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(bid.status)}`}
                            >
                              {bid.status}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            {bid.evaluationScore !== undefined ? (
                              <div>
                                <div className="font-medium text-gray-900">
                                  Score: {bid.evaluationScore}/100
                                </div>
                                {bid.evaluationNotes && (
                                  <div className="text-xs text-gray-600 mt-1">
                                    {bid.evaluationNotes.substring(0, 50)}...
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-gray-400 text-sm">
                                Not evaluated
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {tender.status !== 'Awarded' && (
                                <>
                                  <button
                                    onClick={() => {
                                      setSelectedBidForEval(bid);
                                      setEvalScore(bid.evaluationScore || 0);
                                      setEvalNotes(bid.evaluationNotes || '');
                                      setIsBidEvalModalOpen(true);
                                    }}
                                    className="text-blue-600 hover:text-blue-800 text-sm"
                                  >
                                    Evaluate
                                  </button>
                                  <button
                                    onClick={() => {
                                      setSelectedBidForAward(bid);
                                      setIsAwardModalOpen(true);
                                    }}
                                    className="text-green-600 hover:text-green-800 text-sm"
                                  >
                                    Award
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'rfis' && (
          <div className="bg-white rounded-lg border border-gray-200">
            {rfis.length === 0 ? (
              <div className="p-12 text-center">
                <div className="text-gray-400 mb-4 text-4xl">❓</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No RFIs yet</h3>
                <p className="text-gray-600">
                  No requests for information from contractors
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {rfis.map((rfi) => (
                  <div key={rfi._id} className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="font-medium text-gray-900">
                            {rfi.contractorName}
                          </span>
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(rfi.status)}`}
                          >
                            {rfi.status}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 mb-3">
                          Asked on {formatDate(rfi.askedAt)}
                        </div>
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-3">
                          <div className="text-sm font-medium text-gray-700 mb-1">
                            Question:
                          </div>
                          <p className="text-gray-900">{rfi.question}</p>
                        </div>
                        {rfi.response && (
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <div className="text-sm font-medium text-blue-700 mb-1">
                              Response:
                            </div>
                            <p className="text-blue-900">{rfi.response}</p>
                            {rfi.answeredAt && (
                              <div className="text-xs text-blue-600 mt-2">
                                Answered on {formatDate(rfi.answeredAt)}
                                {rfi.answeredBy && ` by ${rfi.answeredBy.name}`}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    {rfi.status === 'Pending' && (
                      <div className="flex justify-end">
                        <button
                          onClick={() => {
                            setSelectedRFI(rfi);
                            setRfiResponse('');
                            setIsRFIResponseModalOpen(true);
                          }}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                        >
                          Answer RFI
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Award Modal */}
        {isAwardModalOpen && selectedBidForAward && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white w-full max-w-2xl rounded-lg p-8">
              <h2 className="text-2xl font-bold mb-6">Award Tender</h2>
              
              <div className="mb-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <div className="font-semibold text-blue-900 mb-2">
                    Selected Contractor
                  </div>
                  <div className="text-blue-800">{selectedBidForAward.contractorName}</div>
                  <div className="text-sm text-blue-700">
                    Bid Amount: {formatCurrency(selectedBidForAward.bidAmount)}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Award Reason / Justification
                  </label>
                  <textarea
                    value={awardReason}
                    onChange={(e) => setAwardReason(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-2 border rounded-lg"
                    placeholder="Explain why this bid was selected..."
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setIsAwardModalOpen(false);
                    setSelectedBidForAward(null);
                    setAwardReason('');
                  }}
                  className="flex-1 px-4 py-3 border rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAwardTender}
                  disabled={saving}
                  className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400"
                >
                  {saving ? 'Processing...' : 'Confirm Award'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* RFI Response Modal */}
        {isRFIResponseModalOpen && selectedRFI && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white w-full max-w-2xl rounded-lg p-8">
              <h2 className="text-2xl font-bold mb-6">Answer RFI</h2>
              
              <div className="mb-6">
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                  <div className="font-semibold text-gray-900 mb-2">Question:</div>
                  <p className="text-gray-700">{selectedRFI.question}</p>
                  <div className="text-sm text-gray-500 mt-2">
                    From: {selectedRFI.contractorName}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Your Response *
                  </label>
                  <textarea
                    value={rfiResponse}
                    onChange={(e) => setRfiResponse(e.target.value)}
                    rows={6}
                    className="w-full px-4 py-2 border rounded-lg"
                    placeholder="Type your response here..."
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setIsRFIResponseModalOpen(false);
                    setSelectedRFI(null);
                    setRfiResponse('');
                  }}
                  className="flex-1 px-4 py-3 border rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAnswerRFI}
                  disabled={saving}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                >
                  {saving ? 'Sending...' : 'Send Response'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Bid Evaluation Modal */}
        {isBidEvalModalOpen && selectedBidForEval && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white w-full max-w-2xl rounded-lg p-8">
              <h2 className="text-2xl font-bold mb-6">Evaluate Bid</h2>
              
              <div className="mb-6">
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                  <div className="font-semibold text-gray-900 mb-2">
                    {selectedBidForEval.contractorName}
                  </div>
                  <div className="text-gray-700">
                    Bid Amount: {formatCurrency(selectedBidForEval.bidAmount)}
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">
                    Evaluation Score (0-100)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={evalScore}
                    onChange={(e) => setEvalScore(parseInt(e.target.value) || 0)}
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Evaluation Notes
                  </label>
                  <textarea
                    value={evalNotes}
                    onChange={(e) => setEvalNotes(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-2 border rounded-lg"
                    placeholder="Detailed evaluation comments..."
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setIsBidEvalModalOpen(false);
                    setSelectedBidForEval(null);
                    setEvalScore(0);
                    setEvalNotes('');
                  }}
                  className="flex-1 px-4 py-3 border rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEvaluateBid}
                  disabled={saving}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                >
                  {saving ? 'Saving...' : 'Save Evaluation'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}