import React, { useState } from 'react';
import { X, Settings } from 'lucide-react';

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || 'https://fitout-manager-api.vercel.app';

interface EACPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  projectName: string;
  currentFactor?: number;
  onUpdate: () => void;
}

export default function EACPolicyModal({
  isOpen,
  onClose,
  projectId,
  projectName,
  currentFactor = 0.85,
  onUpdate,
}: EACPolicyModalProps) {
  const [policyType, setPolicyType] = useState<'factor' | 'manual'>('factor');
  const [factor, setFactor] = useState(currentFactor * 100);
  const [manualForecast, setManualForecast] = useState(0);
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const handleApply = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${API_URL}/api/finance/projects/${projectId}/eac-settings`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            eacPolicyType: policyType,
            eacFactor: factor / 100,
            manualForecast:
              policyType === 'manual' ? manualForecast : undefined,
          }),
        }
      );

      if (response.ok) {
        onUpdate();
        onClose();
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to update EAC settings');
      }
    } catch (error) {
      console.error('Update EAC settings error:', error);
      alert('Failed to update EAC settings');
    } finally {
      setSaving(false);
    }
  };

  const getConservativeLabel = () => {
    if (factor <= 60) return 'Conservative';
    if (factor >= 110) return 'Aggressive';
    return 'Default';
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3 sm:p-4">
      {/* Modal */}
      <div className="bg-white w-full max-w-2xl rounded-lg max-h-[95svh] overflow-y-auto overscroll-contain">
        <div className="p-4 sm:p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Settings className="w-5 h-5 sm:w-6 sm:h-6" />
              <h2 className="text-lg sm:text-xl font-bold">
                EAC Policy Settings
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 -m-2 text-gray-400 hover:text-black"
              aria-label="Close modal"
            >
              <X className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>

          {/* Project Name */}
          <p className="text-xs sm:text-sm text-gray-600 mb-4 sm:mb-6 line-clamp-2">
            Configure how Estimate at Completion is calculated for{' '}
            <span className="font-medium">{projectName}</span>
          </p>

          <div className="space-y-4 sm:space-y-6">
            {/* Policy Type */}
            <div>
              <h3 className="text-sm font-semibold mb-3">Policy Type</h3>

              {/* Factor */}
              <div className="border rounded-lg p-3 sm:p-4 mb-3">
                <label className="flex gap-3 cursor-pointer">
                  <input
                    type="radio"
                    checked={policyType === 'factor'}
                    onChange={() => setPolicyType('factor')}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-sm sm:text-base">
                      Factor-based Forecast
                    </div>
                    <div className="text-xs sm:text-sm text-gray-600 mb-3">
                      EAC = Committed + (Remaining Budget × Factor)
                    </div>

                    {policyType === 'factor' && (
                      <div className="mt-3 sm:mt-4">
                        <div className="flex justify-between mb-2">
                          <span className="text-xs sm:text-sm font-medium">
                            Forecast Factor: {factor}%
                          </span>
                          <span className="text-xs text-gray-500">
                            {getConservativeLabel()}
                          </span>
                        </div>

                        <input
                          type="range"
                          min="50"
                          max="120"
                          step="5"
                          value={factor}
                          onChange={(e) =>
                            setFactor(parseInt(e.target.value))
                          }
                          className="w-full h-2 rounded-lg accent-blue-600"
                        />

                        <div className="flex justify-between text-[10px] sm:text-xs text-gray-500 mt-1">
                          <span>Conservative (50%)</span>
                          <span className="hidden sm:inline">
                            Default (90%)
                          </span>
                          <span>Aggressive (120%)</span>
                        </div>
                      </div>
                    )}
                  </div>
                </label>
              </div>

              {/* Manual */}
              <div className="border rounded-lg p-3 sm:p-4">
                <label className="flex gap-3 cursor-pointer">
                  <input
                    type="radio"
                    checked={policyType === 'manual'}
                    onChange={() => setPolicyType('manual')}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-sm sm:text-base">
                      Manual Forecast
                    </div>
                    <div className="text-xs sm:text-sm text-gray-600 mb-3">
                      EAC = Committed + Manual Forecast Amount
                    </div>

                    {policyType === 'manual' && (
                      <div className="mt-3 sm:mt-4">
                        <label className="block text-xs sm:text-sm mb-2">
                          Forecast to Complete ($)
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={manualForecast}
                          onChange={(e) =>
                            setManualForecast(
                              parseFloat(e.target.value) || 0
                            )
                          }
                          className="w-full px-3 sm:px-4 py-2 border rounded-lg text-sm sm:text-base"
                        />
                      </div>
                    )}
                  </div>
                </label>
              </div>
            </div>

            {/* Summary */}
            <div className="bg-blue-50 border rounded-lg p-3 sm:p-4 text-xs sm:text-sm">
              {policyType === 'factor' ? (
                <>
                  <strong>Factor Policy:</strong> Remaining ×{' '}
                  {(factor / 100).toFixed(2)}
                </>
              ) : (
                <>
                  <strong>Manual Policy:</strong> $
                  {manualForecast.toLocaleString()}
                </>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-5 pt-4 border-t">
            <button
              onClick={onClose}
              className="w-full px-4 py-2.5 border rounded-lg text-sm sm:text-base"
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              disabled={saving}
              className="w-full px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm sm:text-base disabled:bg-gray-300"
            >
              {/* Save! */}
              {saving ? 'Applying...' : 'Apply Settings'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
