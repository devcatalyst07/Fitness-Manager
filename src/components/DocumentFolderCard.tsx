import React from 'react';
import { ChevronDown, ChevronRight, Folder, FileText, MoreVertical, Trash2, Eye } from 'lucide-react';
import { Document } from '@/types/document';

interface DocumentFolderCardProps {
  projectName: string;
  projectId: string;
  documentCount: number;
  documents: Document[];
  isExpanded: boolean;
  onViewDocument?: (document: Document) => void;
  onDeleteDocument?: (document: Document) => void;
  onFolderClick?: (projectId: string) => void;
}

export function DocumentFolderCard({
  projectName,
  projectId,
  documentCount,
  documents,
  isExpanded,
  onViewDocument,
  onDeleteDocument,
  onFolderClick,
}: DocumentFolderCardProps) {
  const [showMenu, setShowMenu] = React.useState<string | null>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const getFileIcon = (fileType: string) => {
    return <FileText className="text-blue-600" size={20} />;
  };

  const handleMenuClick = (e: React.MouseEvent, docId: string) => {
    e.stopPropagation();
    setShowMenu(showMenu === docId ? null : docId);
  };

  React.useEffect(() => {
    const handleClickOutside = () => setShowMenu(null);
    if (showMenu) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showMenu]);

  return (
    <div>
      {/* Folder Header */}
      <div
        className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => onFolderClick?.(projectId)}
      >
        <div className="flex items-center gap-3">
          <div>
            {isExpanded ? (
              <ChevronDown className="text-gray-600" size={20} />
            ) : (
              <ChevronRight className="text-gray-600" size={20} />
            )}
          </div>
          <div className="p-2 bg-blue-50 rounded-lg">
            <Folder className="text-blue-600" size={20} />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{projectName}</h3>
            <p className="text-xs text-gray-500">
              {documentCount} {documentCount === 1 ? 'document' : 'documents'}
            </p>
          </div>
        </div>
      </div>

      {/* Documents List */}
      {isExpanded && (
        <div className="bg-gray-50 border-t border-gray-200">
          {documents.length === 0 ? (
            <div className="p-8 text-center">
              <FileText className="mx-auto text-gray-300 mb-2" size={48} />
              <p className="text-gray-500 text-sm">No documents in this project yet</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {documents.map((doc) => (
                <div
                  key={doc._id}
                  className="p-4 hover:bg-white transition-colors group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {getFileIcon(doc.fileType)}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">
                          {doc.fileName}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <span>{formatFileSize(doc.fileSize)}</span>
                          <span>•</span>
                          <span>{formatDate(doc.uploadedAt)}</span>
                          {doc.uploadedBy && (
                            <>
                              <span>•</span>
                              <span>{doc.uploadedBy.name}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {onViewDocument && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onViewDocument(doc);
                          }}
                          className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="View"
                        >
                          <Eye size={18} />
                        </button>
                      )}
                      
                      {/* More Options Menu */}
                      <div className="relative">
                        <button
                          onClick={(e) => handleMenuClick(e, doc._id)}
                          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
                          title="More options"
                        >
                          <MoreVertical size={18} />
                        </button>

                        {showMenu === doc._id && (
                          <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                            {onViewDocument && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onViewDocument(doc);
                                  setShowMenu(null);
                                }}
                                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                              >
                                <Eye size={16} />
                                View Document
                              </button>
                            )}
                            {onDeleteDocument && (
                              <>
                                <div className="border-t border-gray-100 my-1"></div>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onDeleteDocument(doc);
                                    setShowMenu(null);
                                  }}
                                  className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                >
                                  <Trash2 size={16} />
                                  Delete
                                </button>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}