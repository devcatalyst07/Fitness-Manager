'use client';

import React, { useRef, useState } from 'react';
import { Upload, X, FileText, Image, File } from 'lucide-react';

interface UploadedFile {
  _id?: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize?: number;
  section?: string;
}

interface FileUploadSectionProps {
  label: string;
  fieldName: string;
  files: File[];
  existingFiles?: UploadedFile[];
  onFilesChange: (files: File[]) => void;
  onRemoveExisting?: (fileId: string) => void;
  accept?: string;
  maxFiles?: number;
  helpText?: string;
}

export default function FileUploadSection({
  label,
  fieldName,
  files,
  existingFiles = [],
  onFilesChange,
  onRemoveExisting,
  accept = '.pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.dwg,.dxf,.zip,.csv,.pptx',
  maxFiles = 10,
  helpText,
}: FileUploadSectionProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFiles = (newFiles: FileList | File[]) => {
    const fileArray = Array.from(newFiles);
    const total = files.length + existingFiles.length + fileArray.length;
    if (total > maxFiles) {
      alert(`Maximum ${maxFiles} files allowed`);
      return;
    }
    onFilesChange([...files, ...fileArray]);
  };

  const removeNewFile = (index: number) => {
    const updated = files.filter((_, i) => i !== index);
    onFilesChange(updated);
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <Image size={16} className="text-blue-500" />;
    if (type.includes('pdf')) return <FileText size={16} className="text-red-500" />;
    return <File size={16} className="text-gray-500" />;
  };

  const formatSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>

      {/* Drop zone */}
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition ${
          dragOver
            ? 'border-blue-400 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400 bg-gray-50'
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          handleFiles(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
      >
        <Upload size={24} className="mx-auto mb-2 text-gray-400" />
        <p className="text-sm text-gray-600">
          Drag & drop files here, or <span className="text-blue-600 font-medium">browse</span>
        </p>
        {helpText && <p className="text-xs text-gray-400 mt-1">{helpText}</p>}
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={accept}
          className="hidden"
          onChange={(e) => {
            if (e.target.files) handleFiles(e.target.files);
            e.target.value = '';
          }}
        />
      </div>

      {/* Existing files (from server) */}
      {existingFiles.length > 0 && (
        <div className="mt-3 space-y-2">
          <div className="text-xs font-medium text-gray-500">Uploaded files:</div>
          {existingFiles.map((file) => (
            <div
              key={file._id || file.fileUrl}
              className="flex items-center justify-between p-2 bg-white border border-gray-200 rounded-lg"
            >
              <div className="flex items-center gap-2 min-w-0">
                {getFileIcon(file.fileType)}
                <a
                  href={file.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline truncate"
                >
                  {file.fileName}
                </a>
                {file.fileSize && (
                  <span className="text-xs text-gray-400 flex-shrink-0">
                    {formatSize(file.fileSize)}
                  </span>
                )}
              </div>
              {onRemoveExisting && file._id && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveExisting(file._id!);
                  }}
                  className="p-1 text-gray-400 hover:text-red-500 flex-shrink-0"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* New files (pending upload) */}
      {files.length > 0 && (
        <div className="mt-3 space-y-2">
          <div className="text-xs font-medium text-gray-500">New files to upload:</div>
          {files.map((file, index) => (
            <div
              key={`${file.name}-${index}`}
              className="flex items-center justify-between p-2 bg-blue-50 border border-blue-200 rounded-lg"
            >
              <div className="flex items-center gap-2 min-w-0">
                {getFileIcon(file.type)}
                <span className="text-sm text-gray-800 truncate">{file.name}</span>
                <span className="text-xs text-gray-400 flex-shrink-0">
                  {formatSize(file.size)}
                </span>
              </div>
              <button
                type="button"
                onClick={() => removeNewFile(index)}
                className="p-1 text-gray-400 hover:text-red-500 flex-shrink-0"
              >
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}