import React, { useState } from 'react';
import { X, Settings } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://fitout-manager-api.vercel.app';

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
  const [factor, setFactor] = useState(currentFactor * 100); // Convert to percentage
  const [manualForecast, setManualForecast] = useState(0);
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const handleApply = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/admin/finance/projects/${projectId}/eac-settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          eacPolicyType: policyType,
          eacFactor: factor / 100, // Convert back to decimal
          manualForecast: policyType === 'manual' ? manualForecast : undefined,
        }),
      });

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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-2xl rounded-lg">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Settings size={24} />
              <h2 className="text-xl font-bold">EAC Policy Settings</h2>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-black">
              <X size={24} />
            </button>
          </div>

          <p className="text-sm text-gray-600 mb-6">
            Configure how Estimate at Completion is calculated for {projectName}
          </p>

          {/* Policy Type */}
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Policy Type</h3>
              
              {/* Factor-based Forecast */}
              <div className="border border-gray-200 rounded-lg p-4 mb-3">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="policyType"
                    checked={policyType === 'factor'}
                    onChange={() => setPolicyType('factor')}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 mb-1">Factor-based Forecast</div>
                    <div className="text-sm text-gray-600 mb-3">
                      EAC = Committed + (Remaining Budget × Factor)
                    </div>

                    {policyType === 'factor' && (
                      <div className="mt-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">Forecast Factor: {factor}%</span>
                          <span className="text-xs text-gray-500">{getConservativeLabel()}</span>
                        </div>
                        <input
                          type="range"
                          min="50"
                          max="120"
                          step="5"
                          value={factor}
                          onChange={(e) => setFactor(parseInt(e.target.value))}
                          className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                        />
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                          <span>50% (Conservative)</span>
                          <span>90% (Default)</span>
                          <span>120% (Aggressive)</span>
                        </div>
                      </div>
                    )}
                  </div>
                </label>
              </div>

              {/* Manual Forecast */}
              <div className="border border-gray-200 rounded-lg p-4">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="policyType"
                    checked={policyType === 'manual'}
                    onChange={() => setPolicyType('manual')}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 mb-1">Manual Forecast</div>
                    <div className="text-sm text-gray-600 mb-3">
                      EAC = Committed + Manual Forecast Amount
                    </div>

                    {policyType === 'manual' && (
                      <div className="mt-4">
                        <label className="block text-sm font-medium mb-2">
                          Forecast to Complete ($)
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={manualForecast}
                          onChange={(e) => setManualForecast(parseFloat(e.target.value) || 0)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                          placeholder="0"
                        />
                      </div>
                    )}
                  </div>
                </label>
              </div>
            </div>

            {/* Current Policy Summary */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <div className="text-blue-600">ℹ️</div>
                <div className="flex-1">
                  <div className="font-medium text-blue-900 mb-1">Current Policy</div>
                  <div className="text-sm text-blue-800">
                    {policyType === 'factor' ? (
                      <>
                        Factor Policy: EAC = Committed + (Remaining × {(factor / 100).toFixed(2)}). 
                        Assumes {factor}% of remaining budget will be spent.
                      </>
                    ) : (
                      <>
                        Manual Policy: EAC = Committed + ${manualForecast.toLocaleString()} (manual forecast). 
                        Custom estimate for remaining work.
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Impact on Calculations */}
            <div className="border-t pt-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Impact on Calculations</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• <span className="font-medium">EAC:</span> Estimate at Completion = Committed + Forecast</li>
                <li>• <span className="font-medium">Variance:</span> Budget - EAC (positive = under budget)</li>
                <li>• <span className="font-medium">Headroom:</span> Budget - Committed (uncommitted funds)</li>
              </ul>
            </div>
          </div>

          {/* Footer */}
          <div className="flex gap-3 mt-6 pt-6 border-t">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg"
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              disabled={saving}
              className="flex-1 px-4 py-3 bg-blue-600 text-white hover:bg-blue-700 rounded-lg disabled:bg-gray-300"
            >
              {saving ? 'Applying...' : 'Apply Settings'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}