import React, { useState } from 'react';
import { X, Upload, FileSpreadsheet, AlertCircle, CheckCircle, Download, Loader } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://fitout-manager-api.vercel.app';

interface Task {
  _id?: string;
  title: string;
  description?: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  estimateHours?: number;
  order: number;
}

interface Phase {
  _id?: string;
  name: string;
  description?: string;
  order: number;
  tasks: Task[];
}

interface ExcelUploadModalProps {
  scopeId: string;
  workflowId: string;
  onClose: () => void;
  onSuccess: () => void;
}

interface ParsedData {
  phases: Phase[];
  errors: string[];
  warnings: string[];
}

export function ExcelUploadModal({ scopeId, workflowId, onClose, onSuccess }: ExcelUploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [parsedData, setParsedData] = useState<ParsedData | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Validate file type
      const validTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel',
        'text/csv'
      ];
      
      if (!validTypes.includes(selectedFile.type) && 
          !selectedFile.name.endsWith('.xlsx') && 
          !selectedFile.name.endsWith('.xls') &&
          !selectedFile.name.endsWith('.csv')) {
        setError('Please upload a valid Excel file (.xlsx, .xls) or CSV file');
        return;
      }

      setFile(selectedFile);
      setError('');
      setParsedData(null);
    }
  };

  const parseExcelFile = async () => {
    if (!file) return;

    setParsing(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const token = localStorage.getItem('token');
      const response = await fetch(
        `${API_URL}/api/scopes/${scopeId}/workflows/${workflowId}/parse-excel`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || 'Failed to parse Excel file');
        setParsing(false);
        return;
      }

      setParsedData(data);
      
      if (data.errors && data.errors.length > 0) {
        setError(`Found ${data.errors.length} error(s) in the file. Please review.`);
      }
    } catch (err) {
      setError('Failed to parse Excel file. Please check the format and try again.');
    } finally {
      setParsing(false);
    }
  };

  const uploadTasks = async () => {
    if (!parsedData) return;

    setUploading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${API_URL}/api/scopes/${scopeId}/workflows/${workflowId}/bulk-create`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ phases: parsedData.phases }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || 'Failed to create tasks');
        setUploading(false);
        return;
      }

      setSuccess(true);
      onSuccess();
      
      // Close modal after brief success display
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err) {
      setError('Failed to upload tasks. Please try again.');
      setUploading(false);
    }
  };

  const downloadTemplate = () => {
    // Download template file from public/files directory
    const link = document.createElement('a');
    link.href = '/files/task-upload-template.xlsx';
    link.download = 'task-upload-template.xlsx';
    link.setAttribute('download', 'task-upload-template.xlsx'); // Force download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
      <div className="bg-white w-full max-w-3xl rounded-lg shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-gray-900">Upload Tasks from Excel</h3>
            <p className="text-sm text-gray-600 mt-1">
              Import phases and tasks in bulk from a spreadsheet
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Template Download Section */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <FileSpreadsheet size={24} className="text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-semibold text-blue-900 mb-1">Download Template</h4>
                <p className="text-sm text-blue-700 mb-3">
                  Use our template to format your tasks correctly. It includes examples and formatting guidelines.
                </p>
                <button
                  onClick={downloadTemplate}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                >
                  <Download size={16} />
                  Download Template
                </button>
              </div>
            </div>
          </div>

          {/* Expected Format Info */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-2">Expected Excel Format</h4>
            <div className="text-sm text-gray-700 space-y-1">
              <p><strong>Column A:</strong> Phase Name (merged cells for each phase)</p>
              <p><strong>Column B:</strong> Task Title (required)</p>
              <p><strong>Column C:</strong> Task Description (optional)</p>
              <p><strong>Column D:</strong> Priority (Low, Medium, High, Critical)</p>
              <p><strong>Column E:</strong> Estimate Hours (optional, numeric)</p>
            </div>
          </div>

          {/* File Upload Section */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Excel File
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition-colors">
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileSelect}
                className="hidden"
                id="excel-upload"
                disabled={uploading || parsing}
              />
              <label
                htmlFor="excel-upload"
                className="cursor-pointer flex flex-col items-center gap-3"
              >
                <Upload size={48} className="text-gray-400" />
                {file ? (
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-900">{file.name}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {(file.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                ) : (
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-900">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Excel (.xlsx, .xls) or CSV files
                    </p>
                  </div>
                )}
              </label>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          )}

          {/* Success Display */}
          {success && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
              <CheckCircle size={20} className="text-green-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-green-700 font-medium">
                  Tasks uploaded successfully!
                </p>
              </div>
            </div>
          )}

          {/* Parsed Data Preview */}
          {parsedData && (
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                <h4 className="font-semibold text-gray-900">Preview</h4>
                <p className="text-sm text-gray-600 mt-1">
                  {parsedData.phases.length} phase(s) • {' '}
                  {parsedData.phases.reduce((sum, phase) => sum + phase.tasks.length, 0)} task(s)
                </p>
              </div>

              <div className="max-h-96 overflow-y-auto">
                {parsedData.warnings && parsedData.warnings.length > 0 && (
                  <div className="bg-yellow-50 border-b border-yellow-200 p-3">
                    <p className="text-sm font-medium text-yellow-800 mb-2">Warnings:</p>
                    <ul className="text-xs text-yellow-700 space-y-1">
                      {parsedData.warnings.map((warning, idx) => (
                        <li key={idx}>• {warning}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="divide-y divide-gray-200">
                  {parsedData.phases.map((phase, phaseIdx) => (
                    <div key={phaseIdx} className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h5 className="font-semibold text-gray-900">{phase.name}</h5>
                        <span className="text-xs text-gray-500">
                          {phase.tasks.length} task{phase.tasks.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                      <div className="space-y-2">
                        {phase.tasks.map((task, taskIdx) => (
                          <div
                            key={taskIdx}
                            className="bg-gray-50 rounded p-3 text-sm"
                          >
                            <div className="font-medium text-gray-900">{task.title}</div>
                            {task.description && (
                              <div className="text-gray-600 text-xs mt-1">
                                {task.description}
                              </div>
                            )}
                            <div className="flex items-center gap-3 mt-2">
                              <span
                                className={`px-2 py-0.5 rounded text-xs font-medium ${
                                  task.priority === 'Critical'
                                    ? 'bg-red-100 text-red-700'
                                    : task.priority === 'High'
                                    ? 'bg-orange-100 text-orange-700'
                                    : task.priority === 'Medium'
                                    ? 'bg-yellow-100 text-yellow-700'
                                    : 'bg-gray-100 text-gray-700'
                                }`}
                              >
                                {task.priority}
                              </span>
                              {task.estimateHours && (
                                <span className="text-xs text-gray-600">
                                  {task.estimateHours}h
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg font-medium"
              disabled={uploading || parsing}
            >
              Cancel
            </button>

            {!parsedData ? (
              <button
                onClick={parseExcelFile}
                disabled={!file || parsing}
                className="flex-1 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg font-medium disabled:bg-gray-400 flex items-center justify-center gap-2"
              >
                {parsing ? (
                  <>
                    <Loader size={16} className="animate-spin" />
                    Parsing...
                  </>
                ) : (
                  <>
                    <FileSpreadsheet size={16} />
                    Parse File
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={uploadTasks}
                disabled={uploading || (parsedData.errors && parsedData.errors.length > 0)}
                className="flex-1 px-4 py-2 bg-green-600 text-white hover:bg-green-700 rounded-lg font-medium disabled:bg-gray-400 flex items-center justify-center gap-2"
              >
                {uploading ? (
                  <>
                    <Loader size={16} className="animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload size={16} />
                    Upload {parsedData.phases.reduce((sum, phase) => sum + phase.tasks.length, 0)} Tasks
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}