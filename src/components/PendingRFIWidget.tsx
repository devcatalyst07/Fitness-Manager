"use client";

import React, { useState, useEffect } from "react";
import { AlertCircle, ChevronRight, Loader } from "lucide-react";
import { apiClient } from "@/lib/axios";

interface RFI {
  _id: string;
  tenderId: {
    _id: string;
    title: string;
    tenderNumber: string;
  };
  contractorName: string;
  question: string;
  askedAt: string;
  status: "Pending" | "Answered" | "Closed";
}

interface PendingRFIWidgetProps {
  onNavigate?: (tenderId: string) => void;
}

export default function PendingRFIWidget({
  onNavigate,
}: PendingRFIWidgetProps) {
  const [rfis, setRfis] = useState<RFI[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  const handleRetry = () => {
    setError(null);
    fetchPendingRFIs();
  };

  useEffect(() => {
    fetchPendingRFIs();
    // Refresh every 30 seconds
    const interval = setInterval(fetchPendingRFIs, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchPendingRFIs = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log("Fetching pending RFIs from /api/pending-rfis");
      
      const data = await apiClient.get<{
        success: boolean;
        pendingRFIs: RFI[];
        count: number;
      }>("/api/pending-rfis");
      
      console.log("✓ RFIs fetched successfully:", data);
      
      // Handle successful response
      if (data && data.pendingRFIs) {
        setRfis(Array.isArray(data.pendingRFIs) ? data.pendingRFIs : []);
      } else {
        setRfis([]);
      }
      setError(null);
    } catch (err: any) {
      console.error("❌ Error fetching pending RFIs:", {
        status: err?.response?.status,
        statusText: err?.response?.statusText,
        message: err?.response?.data?.message || err?.message,
        url: err?.config?.url,
        error: err?.response?.data || err,
      });
      
      // Determine appropriate error message
      let errorMessage = "Failed to load RFIs";
      
      if (err?.response?.status === 401) {
        errorMessage = "Authentication failed. Please log in again.";
      } else if (err?.response?.status === 403) {
        errorMessage = "You don't have permission to view RFIs.";
      } else if (err?.response?.status === 404) {
        errorMessage = "RFI endpoint not found.";
      } else if (err?.response?.status === 500) {
        errorMessage = "Server error. Please try again later.";
      } else if (err?.message === "Network Error") {
        errorMessage = "Network error. Please check your connection.";
      } else if (err?.response?.data?.message) {
        errorMessage = err.response.data.message;
      }
      
      setError(errorMessage);
      setRfis([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading && rfis.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-center py-8">
          <Loader className="animate-spin text-blue-600 mr-3" size={20} />
          <span className="text-gray-600">Loading RFIs...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-900">Error loading RFIs</p>
            <p className="text-sm text-red-700 mt-1">{error}</p>
            <div className="mt-3">
              <button
                onClick={handleRetry}
                className="text-sm px-3 py-1 bg-red-200 hover:bg-red-300 text-red-900 rounded transition-colors font-medium"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (rfis.length === 0) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <p className="font-medium text-green-900">All caught up! 🎉</p>
            <p className="text-sm text-green-700 mt-1">
              No pending RFIs awaiting your response
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-lg overflow-hidden shadow-sm">
      {/* Header */}
      <div
        className="p-4 cursor-pointer hover:bg-amber-100/50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 bg-amber-500 rounded-full">
              <AlertCircle className="text-white" size={18} />
            </div>
            <div>
              <p className="font-semibold text-gray-900">
                Pending RFIs
              </p>
              <p className="text-sm text-amber-700">
                {rfis.length} awaiting your response
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center min-w-[28px] h-7 px-2 bg-amber-500 text-white text-sm font-bold rounded-full">
              {rfis.length}
            </span>
            <ChevronRight
              size={20}
              className={`text-gray-500 transition-transform ${
                expanded ? "rotate-90" : ""
              }`}
            />
          </div>
        </div>
      </div>

      {/* Content - Expandable */}
      {expanded && (
        <div className="border-t border-amber-200 bg-white">
          {rfis.slice(0, 5).map((rfi, index) => (
            <div
              key={rfi._id}
              className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${
                index !== Math.min(4, rfis.length - 1) ? "border-b border-gray-100" : ""
              }`}
              onClick={() => {
                if (onNavigate && rfi.tenderId?._id) {
                  onNavigate(rfi.tenderId._id);
                }
              }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">
                    {rfi.tenderId?.tenderNumber || "Unknown"} -{" "}
                    {rfi.tenderId?.title || "Unknown Tender"}
                  </p>
                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                    <span className="font-medium">From:</span> {rfi.contractorName}
                  </p>
                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                    <span className="font-medium">Q:</span> {rfi.question}
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    {new Date(rfi.askedAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <ChevronRight className="text-gray-400 flex-shrink-0 mt-1" size={18} />
              </div>
            </div>
          ))}

          {rfis.length > 5 && (
            <div className="px-4 py-3 bg-amber-50 border-t border-gray-100">
              <p className="text-sm text-amber-700 font-medium">
                +{rfis.length - 5} more pending RFIs
              </p>
            </div>
          )}

          {/* View All Button */}
          <div className="px-4 py-3 bg-gray-50 border-t border-gray-100">
            <button
              onClick={() => {
                // This will navigate to the first tender with pending RFIs
                if (rfis.length > 0 && rfis[0].tenderId?._id && onNavigate) {
                  onNavigate(rfis[0].tenderId._id);
                }
              }}
              className="w-full px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded transition-colors"
            >
              View All RFIs →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}