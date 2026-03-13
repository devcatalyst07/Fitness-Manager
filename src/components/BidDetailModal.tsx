'use client';

import React, { useState, useEffect } from 'react';
import { X, FileText, Download, Clock, User, DollarSign, MessageSquare } from 'lucide-react';
import { apiClient } from '@/lib/axios';
import { responsive } from '@/utils/responsive';

interface BidAttachment {
  _id: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize?: number;
  category: string;
  uploadedAt: string;
}

interface BidDetail {
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
  proposedDuration?: number;
  proposedStartDate?: string;
  proposedCompletionDate?: string;
  comments?: string;
  attachments: BidAttachment[];
  status: string;
  submittedAt?: string;
  evaluationScore?: number;
  evaluationNotes?: string;
}

interface BidDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenderId: string;
  bidId: string;
  budgetedAmount: number;
}

const categoryLabels: Record<string, string> = {
  proposal: 'Proposal',
  cost_breakdown: 'Cost Breakdown',
  technical_compliance: 'Technical Compliance',
  certification: 'Certification',
  other: 'Other',
};

export default function BidDetailModal({
  isOpen,
  onClose,
  tenderId,
  bidId,
  budgetedAmount,
}: BidDetailModalProps) {
  const [loading, setLoading] = useState(true);
  const [bid, setBid] = useState<BidDetail | null>(null);

  useEffect(() => {
    if (isOpen && tenderId && bidId) {
      fetchBidDetail();
    }
  }, [isOpen, tenderId, bidId]);

  const fetchBidDetail = async () => {
    setLoading(true);
    try {
      const data = await apiClient.get(`/api/tenders/${tenderId}/bids/${bidId}`);
      setBid(data);
    } catch (error) {
      console.error('Error fetching bid detail:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(amount);

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Submitted': return 'bg-blue-100 text-blue-700';
      case 'Under Review': return 'bg-yellow-100 text-yellow-700';
      case 'Accepted': return 'bg-green-100 text-green-700';
      case 'Rejected': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white w-full max-w-[min(64rem,100vw-1rem)] rounded-xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between gap-2 px-4 sm:px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Bid Submission Detail</h2>
            {bid && (
              <p className="text-sm text-gray-600 mt-0.5">
                {bid.contractorName} &middot; {bid.contractorEmail}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-black rounded-lg hover:bg-gray-200"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : !bid ? (
            <div className="text-center py-12 text-gray-500">Failed to load bid details</div>
          ) : (
            <div className="space-y-6">
              {/* Status & Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                    <DollarSign size={14} />
                    <span>Bid Amount</span>
                  </div>
                  <div className="text-xl font-bold text-gray-900">{formatCurrency(bid.bidAmount)}</div>
                  {budgetedAmount > 0 && (
                    <div className={`text-xs mt-1 ${bid.bidAmount > budgetedAmount ? 'text-red-600' : 'text-green-600'}`}>
                      {bid.bidAmount > budgetedAmount ? '+' : ''}
                      {formatCurrency(bid.bidAmount - budgetedAmount)} vs budget
                    </div>
                  )}
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm text-gray-500 mb-1">Status</div>
                  <span className={`px-2.5 py-1 rounded-full text-sm font-medium ${getStatusColor(bid.status)}`}>
                    {bid.status}
                  </span>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                    <Clock size={14} />
                    <span>Duration</span>
                  </div>
                  <div className="font-medium text-gray-900">
                    {bid.proposedDuration ? `${bid.proposedDuration} days` : 'Not specified'}
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                    <Clock size={14} />
                    <span>Submitted</span>
                  </div>
                  <div className="text-sm font-medium text-gray-900">{formatDate(bid.submittedAt)}</div>
                </div>
              </div>

              {/* Price Breakdown */}
              {bid.breakdownItems && bid.breakdownItems.filter(i => i.description).length > 0 && (
                <div>
                  <h3 className="text-base font-semibold text-gray-900 mb-3">Price Breakdown</h3>
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                    <table className="w-full min-w-[640px] text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="text-left px-4 py-2.5 text-gray-600 font-medium">Description</th>
                          <th className="text-right px-4 py-2.5 text-gray-600 font-medium">Qty</th>
                          <th className="text-right px-4 py-2.5 text-gray-600 font-medium">Unit Cost</th>
                          <th className="text-right px-4 py-2.5 text-gray-600 font-medium">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {bid.breakdownItems
                          .filter(i => i.description)
                          .map((item, idx) => (
                            <tr key={idx}>
                              <td className="px-4 py-2.5 text-gray-900">{item.description}</td>
                              <td className="px-4 py-2.5 text-right text-gray-700">{item.quantity}</td>
                              <td className="px-4 py-2.5 text-right text-gray-700">{formatCurrency(item.unitCost)}</td>
                              <td className="px-4 py-2.5 text-right font-medium text-gray-900">{formatCurrency(item.total)}</td>
                            </tr>
                          ))}
                      </tbody>
                      <tfoot className="bg-gray-50 border-t border-gray-200">
                        <tr>
                          <td colSpan={3} className="px-4 py-2.5 font-bold text-gray-900">Total</td>
                          <td className="px-4 py-2.5 text-right font-bold text-gray-900">{formatCurrency(bid.bidAmount)}</td>
                        </tr>
                      </tfoot>
                    </table>
                    </div>
                  </div>
                </div>
              )}

              {/* Comments */}
              {bid.comments && (
                <div>
                  <h3 className="text-base font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <MessageSquare size={16} />
                    Contractor Comments
                  </h3>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <p className="text-gray-700 whitespace-pre-wrap text-sm">{bid.comments}</p>
                  </div>
                </div>
              )}

              {/* Assumptions */}
              {bid.assumptions && (
                <div>
                  <h3 className="text-base font-semibold text-gray-900 mb-2">Assumptions / Conditions</h3>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <p className="text-gray-700 whitespace-pre-wrap text-sm">{bid.assumptions}</p>
                  </div>
                </div>
              )}

              {/* Exclusions */}
              {bid.exclusions && (
                <div>
                  <h3 className="text-base font-semibold text-gray-900 mb-2">Exclusions</h3>
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <p className="text-amber-900 whitespace-pre-wrap text-sm">{bid.exclusions}</p>
                  </div>
                </div>
              )}

              {/* Attachments */}
              {bid.attachments && bid.attachments.length > 0 && (
                <div>
                  <h3 className="text-base font-semibold text-gray-900 mb-3">
                    Attachments ({bid.attachments.length})
                  </h3>
                  <div className="space-y-2">
                    {bid.attachments.map((attachment) => (
                      <a
                        key={attachment._id}
                        href={attachment.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition group"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <FileText size={18} className="text-blue-600 flex-shrink-0" />
                          <div className="min-w-0">
                            <div className="text-sm font-medium text-gray-900 truncate">
                              {attachment.fileName}
                            </div>
                            <div className="text-xs text-gray-500">
                              {categoryLabels[attachment.category] || attachment.category}
                              {attachment.fileSize ? ` • ${formatFileSize(attachment.fileSize)}` : ''}
                            </div>
                          </div>
                        </div>
                        <Download size={16} className="text-gray-400 group-hover:text-blue-600 flex-shrink-0" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Evaluation (if evaluated) */}
              {bid.evaluationScore !== undefined && bid.evaluationScore !== null && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <h3 className="text-base font-semibold text-purple-900 mb-2">Evaluation</h3>
                  <div className="flex items-center gap-4 mb-2">
                    <div className="text-2xl font-bold text-purple-700">{bid.evaluationScore}/100</div>
                    <div className="flex-1 bg-purple-200 rounded-full h-3">
                      <div
                        className="bg-purple-600 h-3 rounded-full transition-all"
                        style={{ width: `${bid.evaluationScore}%` }}
                      />
                    </div>
                  </div>
                  {bid.evaluationNotes && (
                    <p className="text-sm text-purple-800 mt-2">{bid.evaluationNotes}</p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 sm:px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-stretch sm:justify-end">
          <button
            onClick={onClose}
            className={responsive.secondaryButton}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}