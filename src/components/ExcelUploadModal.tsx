'use client';

import React, { useState } from 'react';
import { X, Upload, Download, FileSpreadsheet, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import * as XLSX from 'xlsx';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://fitout-manager-api.vercel.app';

interface ExcelUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  scopeId: string;
  workflowId: string;
  onSuccess: () => void;
}

interface ParsedTask {
  taskId: string;
  phaseName: string;
  taskTitle: string;
  taskDescription: string;
  taskType: string;
  priority: string;
  predecessorIds: string;
  dependencyType: string;
  lagDays: string;
  duration: string;
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  tasks: ParsedTask[];
}

export default function ExcelUploadModal({
  isOpen,
  onClose,
  scopeId,
  workflowId,
  onSuccess,
}: ExcelUploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  if (!isOpen) return null;

  const handleDownloadTemplate = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${API_URL}/api/scopes/${scopeId}/workflows/${workflowId}/templates/task-upload-template.xlsx`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'task-upload-template.xlsx';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } else {
        const errorData = await response.json();
        alert(`Failed to download template: ${errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Download template error:', error);
      alert('Failed to download template. Please check your connection and try again.');
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setValidationResult(null);
      setShowPreview(false);
      validateFile(selectedFile);
    }
  };

  const validateFile = async (file: File) => {
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

      const errors: string[] = [];
      const warnings: string[] = [];
      const tasks: ParsedTask[] = [];

      // Check if file has data
      if (jsonData.length === 0) {
        errors.push('Excel file is empty');
        setValidationResult({ isValid: false, errors, warnings, tasks });
        return;
      }

      // Validate headers
      const requiredHeaders = [
        'Task ID',
        'Phase Name',
        'Task Title',
        'Task Description',
        'Task Type',
        'Priority',
        'Predecessor IDs',
        'Dependency Type',
        'Lag (Days)',
        'Duration (Days)',
      ];

      const firstRow: any = jsonData[0];
      const actualHeaders = Object.keys(firstRow);
      
      const missingHeaders = requiredHeaders.filter(
        h => !actualHeaders.includes(h)
      );

      if (missingHeaders.length > 0) {
        errors.push(`Missing required columns: ${missingHeaders.join(', ')}`);
        errors.push('Please download the latest template and ensure all columns are present.');
        setValidationResult({ isValid: false, errors, warnings, tasks });
        return;
      }

      // Validate each row
      const taskIds = new Set<string>();
      jsonData.forEach((row: any, index: number) => {
        const rowNum = index + 2; // +2 because index starts at 0 and header is row 1

        // Task ID validation
        if (!row['Task ID']) {
          errors.push(`Row ${rowNum}: Task ID is required`);
        } else if (taskIds.has(row['Task ID'])) {
          errors.push(`Row ${rowNum}: Duplicate Task ID "${row['Task ID']}"`);
        } else {
          taskIds.add(row['Task ID']);
        }

        // Phase Name validation
        if (!row['Phase Name']) {
          errors.push(`Row ${rowNum}: Phase Name is required`);
        }

        // Task Title validation
        if (!row['Task Title']) {
          errors.push(`Row ${rowNum}: Task Title is required`);
        }

        // Task Type validation
        const validTaskTypes = ['Task', 'Deliverable', 'Milestone'];
        if (row['Task Type'] && !validTaskTypes.includes(row['Task Type'])) {
          errors.push(
            `Row ${rowNum}: Task Type must be one of: ${validTaskTypes.join(', ')}`
          );
        }

        // Priority validation
        const validPriorities = ['Low', 'Medium', 'High', 'Critical'];
        if (row['Priority'] && !validPriorities.includes(row['Priority'])) {
          warnings.push(
            `Row ${rowNum}: Priority "${row['Priority']}" will default to "Medium". Valid values: ${validPriorities.join(', ')}`
          );
        }

        // Duration validation
        const duration = parseFloat(row['Duration (Days)']);
        if (isNaN(duration) || duration < 0) {
          errors.push(`Row ${rowNum}: Duration must be a positive number`);
        } else if (row['Task Type'] === 'Milestone' && duration > 1) {
          errors.push(`Row ${rowNum}: Milestone tasks can have a maximum duration of 1 day`);
        }

        // Dependency validation
        if (row['Predecessor IDs']) {
          const predecessors = row['Predecessor IDs']
            .split(';')
            .map((p: string) => p.trim())
            .filter((p: string) => p);

          const depTypes = row['Dependency Type']
            ? row['Dependency Type']
                .split(';')
                .map((t: string) => t.trim())
                .filter((t: string) => t)
            : [];

          if (depTypes.length > 0 && depTypes.length !== predecessors.length) {
            warnings.push(
              `Row ${rowNum}: Number of dependency types (${depTypes.length}) doesn't match number of predecessors (${predecessors.length}). Missing types will default to "FS".`
            );
          }

          depTypes.forEach((type: string, i: number) => {
            if (type && !['FS', 'SS'].includes(type)) {
              errors.push(
                `Row ${rowNum}: Invalid dependency type "${type}" for predecessor ${i + 1}. Must be "FS" or "SS".`
              );
            }
          });
        }

        // Add to tasks array
        tasks.push({
          taskId: row['Task ID'],
          phaseName: row['Phase Name'],
          taskTitle: row['Task Title'],
          taskDescription: row['Task Description'] || '',
          taskType: row['Task Type'] || 'Task',
          priority: row['Priority'] || 'Medium',
          predecessorIds: row['Predecessor IDs'] || '',
          dependencyType: row['Dependency Type'] || '',
          lagDays: row['Lag (Days)'] || '0',
          duration: row['Duration (Days)'] || '1',
        });
      });

      // Validate that predecessor IDs exist
      tasks.forEach((task, index) => {
        if (task.predecessorIds) {
          const predecessors = task.predecessorIds
            .split(';')
            .map(p => p.trim())
            .filter(p => p);

          predecessors.forEach((predId) => {
            if (!taskIds.has(predId)) {
              errors.push(
                `Row ${index + 2}: Predecessor ID "${predId}" not found in Task ID column`
              );
            }
          });
        }
      });

      setValidationResult({
        isValid: errors.length === 0,
        errors,
        warnings,
        tasks,
      });

      if (errors.length === 0) {
        setShowPreview(true);
      }
    } catch (error) {
      console.error('File validation error:', error);
      setValidationResult({
        isValid: false,
        errors: ['Failed to read Excel file. Please ensure it is a valid .xlsx file.'],
        warnings: [],
        tasks: [],
      });
    }
  };

  const handleUpload = async () => {
    if (!file || !validationResult?.isValid) return;

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const token = localStorage.getItem('token');
      const response = await fetch(
        `${API_URL}/api/scopes/${scopeId}/workflows/${workflowId}/tasks/bulk-upload`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      const data = await response.json();

      if (response.ok) {
        alert(
          `Successfully uploaded ${data.tasksCreated} tasks across ${data.phasesCreated} phases!`
        );
        onSuccess();
        onClose();
        setFile(null);
        setValidationResult(null);
        setShowPreview(false);
      } else {
        alert(data.message || 'Failed to upload tasks');
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload tasks');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-green-700 px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <FileSpreadsheet className="text-white" size={20} />
              </div>
              <div>
                <h2 className="text-2xl font-semibold text-white">
                  Bulk Upload Tasks from Excel
                </h2>
                <p className="text-white/80 text-sm mt-0.5">
                  Upload multiple tasks with dependencies using our template
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="text-white/80 hover:text-white hover:bg-white/10 p-2 rounded-lg transition-all"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8">
          <div className="space-y-6">
            {/* Template Update Notice */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <Info size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold text-blue-900 mb-1">
                    📢 Template Format Updated
                  </h3>
                  <p className="text-sm text-blue-800 mb-3">
                    The Excel template now includes new columns for Task Type, Dependencies, and Duration. 
                    Please download the latest template before uploading.
                  </p>
                  <button
                    onClick={handleDownloadTemplate}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center gap-2"
                  >
                    <Download size={16} />
                    Download Latest Template
                  </button>
                </div>
              </div>
            </div>

            {/* File Upload section */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Upload Excel File
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-500 transition-colors">
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="cursor-pointer flex flex-col items-center"
                >
                  <Upload size={48} className="text-gray-400 mb-4" />
                  <p className="text-sm font-medium text-gray-900 mb-1">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-xs text-gray-500">
                    Excel files (.xlsx, .xls) only
                  </p>
                </label>
              </div>

              {file && (
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileSpreadsheet size={20} className="text-blue-600" />
                      <div>
                        <p className="text-sm font-medium text-blue-900">{file.name}</p>
                        <p className="text-xs text-blue-700">
                          {(file.size / 1024).toFixed(2)} KB
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setFile(null);
                        setValidationResult(null);
                        setShowPreview(false);
                      }}
                      className="text-blue-600 hover:text-blue-700"
                    >
                      <X size={20} />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Validation Results */}
            {validationResult && (
              <div className="space-y-4">
                {/* Errors */}
                {validationResult.errors.length > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <AlertTriangle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <h3 className="font-semibold text-red-900 mb-2">
                          Validation Errors ({validationResult.errors.length})
                        </h3>
                        <ul className="space-y-1">
                          {validationResult.errors.map((error, index) => (
                            <li key={index} className="text-sm text-red-800">
                              • {error}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                {/* Warnings */}
                {validationResult.warnings.length > 0 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <Info size={20} className="text-yellow-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <h3 className="font-semibold text-yellow-900 mb-2">
                          Warnings ({validationResult.warnings.length})
                        </h3>
                        <ul className="space-y-1">
                          {validationResult.warnings.map((warning, index) => (
                            <li key={index} className="text-sm text-yellow-800">
                              • {warning}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                {/* Success */}
                {validationResult.isValid && (
                  <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <CheckCircle size={20} className="text-green-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <h3 className="font-semibold text-green-900 mb-1">
                          Validation Successful!
                        </h3>
                        <p className="text-sm text-green-800">
                          Found {validationResult.tasks.length} valid task(s) ready for upload.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Preview */}
                {showPreview && validationResult.tasks.length > 0 && (
                  <div className="border border-gray-200 rounded-xl p-4">
                    <h3 className="font-semibold text-gray-900 mb-3">
                      Preview ({validationResult.tasks.length} tasks)
                    </h3>
                    <div className="max-h-64 overflow-y-auto">
                      <table className="min-w-full text-sm">
                        <thead className="bg-gray-50 sticky top-0">
                          <tr>
                            <th className="px-3 py-2 text-left font-medium text-gray-700">Task ID</th>
                            <th className="px-3 py-2 text-left font-medium text-gray-700">Phase</th>
                            <th className="px-3 py-2 text-left font-medium text-gray-700">Title</th>
                            <th className="px-3 py-2 text-left font-medium text-gray-700">Type</th>
                            <th className="px-3 py-2 text-left font-medium text-gray-700">Duration</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {validationResult.tasks.slice(0, 10).map((task, index) => (
                            <tr key={index} className="hover:bg-gray-50">
                              <td className="px-3 py-2 text-gray-900">{task.taskId}</td>
                              <td className="px-3 py-2 text-gray-700">{task.phaseName}</td>
                              <td className="px-3 py-2 text-gray-900">{task.taskTitle}</td>
                              <td className="px-3 py-2 text-gray-700">{task.taskType}</td>
                              <td className="px-3 py-2 text-gray-700">{task.duration} days</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {validationResult.tasks.length > 10 && (
                        <p className="text-xs text-gray-500 text-center mt-2">
                          Showing first 10 of {validationResult.tasks.length} tasks
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-8 py-4 bg-gray-50">
          <div className="flex justify-between items-center">
            <button
              onClick={handleDownloadTemplate}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors text-sm font-medium flex items-center gap-2"
            >
              <Download size={16} />
              Download Template
            </button>

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-100 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleUpload}
                disabled={!validationResult?.isValid || uploading}
                className="px-6 py-3 bg-green-600 text-white font-semibold rounded-xl 
                          hover:bg-green-700 transition-all 
                          disabled:bg-gray-400 disabled:cursor-not-allowed
                          flex items-center gap-2"
              >
                {uploading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload size={18} />
                    Upload Tasks
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}