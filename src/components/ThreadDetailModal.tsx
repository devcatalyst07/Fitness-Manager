import React, { useState, useEffect } from 'react';
import {
  X,
  Heart,
  Send,
  Paperclip,
  Download,
  Edit,
  Trash2,
  Calendar,
  User,
  File,
  Image as ImageIcon,
  FileText,
  MoreVertical,
  X as CloseIcon
} from 'lucide-react';
import { apiClient } from '@/lib/axios';

interface Thread {
  _id: string;
  title: string;
  content: string;
  brandId: string;
  projectId?: string;
  createdBy: string;
  createdByName: string;
  createdByEmail: string;
  attachments: Array<{
    fileName: string;
    fileUrl: string;
    fileType: string;
    fileSize: number;
    uploadedAt: string;
  }>;
  likes: string[];
  commentCount: number;
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Comment {
  _id: string;
  threadId: string;
  content: string;
  createdBy: string;
  createdByName: string;
  createdByEmail: string;
  attachments: Array<{
    fileName: string;
    fileUrl: string;
    fileType: string;
    fileSize: number;
    uploadedAt: string;
  }>;
  likes: string[];
  createdAt: string;
  updatedAt: string;
}

interface ThreadDetailModalProps {
  thread: Thread;
  currentUserId: string;
  onClose: () => void;
  onUpdate: () => void;
  onDelete: (threadId: string) => void;
}

export default function ThreadDetailModal({
  thread,
  currentUserId,
  onClose,
  onUpdate,
  onDelete,
}: ThreadDetailModalProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isEditingThread, setIsEditingThread] = useState(false);
  const [editedTitle, setEditedTitle] = useState(thread.title);
  const [editedContent, setEditedContent] = useState(thread.content);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editedCommentContent, setEditedCommentContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showThreadMenu, setShowThreadMenu] = useState(false);
  const [commentMenuId, setCommentMenuId] = useState<string | null>(null);

  const isThreadOwner = thread.createdBy === currentUserId;

  useEffect(() => {
    fetchComments();
  }, [thread._id]);

  const fetchComments = async () => {
    try {
      const data = await apiClient.get(`/api/threads/${thread._id}`);
      setComments(data.comments || []);
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      setSelectedFiles([...selectedFiles, ...Array.from(files)]);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(selectedFiles.filter((_, i) => i !== index));
  };

  const uploadFiles = async (files: File[]) => {
    const uploadedFiles = [];
    for (const file of files) {
      const formData = new FormData();
      formData.append('file', file);

      try {
        const data = await apiClient.post('/api/upload', formData);
        uploadedFiles.push({
          fileName: data.file.fileName,
          fileUrl: data.file.fileUrl,
          fileType: file.type,
          fileSize: file.size,
          uploadedAt: new Date(),
        });
      } catch (error) {
        console.error('Upload error:', error);
      }
    }
    return uploadedFiles;
  };

  const handleAddComment = async () => {
    if (!newComment.trim() && selectedFiles.length === 0) return;

    setSubmitting(true);
    try {
      let attachments: any[] = [];
      if (selectedFiles.length > 0) {
        attachments = await uploadFiles(selectedFiles);
      }

      await apiClient.post(`/api/threads/${thread._id}/comments`, {
        content: newComment,
        attachments,
      });

      setNewComment('');
      setSelectedFiles([]);
      fetchComments();
      onUpdate();
    } catch (error) {
      console.error('Add comment error:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateThread = async () => {
    if (!editedTitle.trim() || !editedContent.trim()) {
      alert('Title and content are required');
      return;
    }

    setSubmitting(true);
    try {
      await apiClient.put(`/api/threads/${thread._id}`, {
        title: editedTitle,
        content: editedContent,
      });
      setIsEditingThread(false);
      onUpdate();
    } catch (error) {
      console.error('Update thread error:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateComment = async (commentId: string) => {
    if (!editedCommentContent.trim()) return;

    setSubmitting(true);
    try {
      await apiClient.put(`/api/comments/${commentId}`, {
        content: editedCommentContent,
      });
      setEditingCommentId(null);
      fetchComments();
    } catch (error) {
      console.error('Update comment error:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Are you sure you want to delete this comment?')) return;

    try {
      await apiClient.delete(`/api/comments/${commentId}`);
      fetchComments();
      onUpdate();
    } catch (error) {
      console.error('Delete comment error:', error);
    }
  };

  const handleLikeComment = async (commentId: string) => {
    try {
      await apiClient.post(`/api/comments/${commentId}/like`);
      fetchComments();
    } catch (error) {
      console.error('Like comment error:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return <ImageIcon size={16} />;
    if (fileType.includes('pdf')) return <FileText size={16} />;
    return <File size={16} />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white w-full max-w-4xl max-h-[95vh] rounded-lg flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-start justify-between">
            <div className="flex-1 pr-4">
              {isEditingThread ? (
                <input
                  type="text"
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  className="w-full text-xl sm:text-2xl font-bold text-gray-900 border-b-2 border-blue-500 focus:outline-none mb-2"
                />
              ) : (
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">{thread.title}</h2>
              )}
              <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <User size={14} />
                  <span className="font-medium">{thread.createdByName}</span>
                </div>
                <span>•</span>
                <div className="flex items-center gap-1">
                  <Calendar size={14} />
                  <span>{formatDate(thread.createdAt)}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isThreadOwner && (
                <div className="relative">
                  <button
                    onClick={() => setShowThreadMenu(!showThreadMenu)}
                    className="p-2 hover:bg-gray-100 rounded"
                  >
                    <MoreVertical size={20} />
                  </button>
                  {showThreadMenu && (
                    <>
                      <div className="fixed inset-0" onClick={() => setShowThreadMenu(false)} />
                      <div className="absolute right-0 top-10 bg-white border rounded-lg shadow-lg z-10 min-w-[140px]">
                        <button
                          onClick={() => {
                            setIsEditingThread(true);
                            setShowThreadMenu(false);
                          }}
                          className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50"
                        >
                          <Edit size={14} />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => {
                            onDelete(thread._id);
                            setShowThreadMenu(false);
                          }}
                          className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                        >
                          <Trash2 size={14} />
                          <span>Delete</span>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
              <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded">
                <X size={24} />
              </button>
            </div>
          </div>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="mb-6">
            {isEditingThread ? (
              <div>
                <textarea
                  value={editedContent}
                  onChange={(e) => setEditedContent(e.target.value)}
                  className="w-full p-3 border-2 border-blue-500 rounded-lg focus:outline-none resize-none"
                  rows={6}
                />
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={handleUpdateThread}
                    disabled={submitting}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                  >
                    {submitting ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    onClick={() => {
                      setIsEditingThread(false);
                      setEditedTitle(thread.title);
                      setEditedContent(thread.content);
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-gray-800 whitespace-pre-wrap text-sm sm:text-base">{thread.content}</p>
            )}

            {thread.attachments && thread.attachments.length > 0 && (
              <div className="mt-4 space-y-2">
                <p className="text-sm font-medium text-gray-700">Attachments:</p>
                {thread.attachments.map((file, index) => (
                  <a
                    key={index}
                    href={file.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {getFileIcon(file.fileType)}
                      <span className="text-sm text-gray-700 truncate">{file.fileName}</span>
                      <span className="text-xs text-gray-500">({formatFileSize(file.fileSize)})</span>
                    </div>
                    <Download size={16} className="text-gray-500 flex-shrink-0 ml-2" />
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Comments Section */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Comments ({comments.length})
            </h3>

            {loading ? (
              <div className="text-center py-8 text-gray-500">Loading comments...</div>
            ) : comments.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No comments yet. Be the first to comment!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {comments.map((comment) => {
                  const isCommentOwner = comment.createdBy === currentUserId;
                  const isEditing = editingCommentId === comment._id;

                  return (
                    <div key={comment._id} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <User size={14} />
                          <span className="font-medium text-gray-900">{comment.createdByName}</span>
                          <span>•</span>
                          <span className="text-xs">{formatDate(comment.createdAt)}</span>
                        </div>

                        {isCommentOwner && (
                          <div className="relative">
                            <button
                              onClick={() =>
                                setCommentMenuId(commentMenuId === comment._id ? null : comment._id)
                              }
                              className="p-1 hover:bg-gray-200 rounded"
                            >
                              <MoreVertical size={16} />
                            </button>
                            {commentMenuId === comment._id && (
                              <>
                                <div
                                  className="fixed inset-0"
                                  onClick={() => setCommentMenuId(null)}
                                />
                                <div className="absolute right-0 top-8 bg-white border rounded-lg shadow-lg z-10 min-w-[120px]">
                                  <button
                                    onClick={() => {
                                      setEditingCommentId(comment._id);
                                      setEditedCommentContent(comment.content);
                                      setCommentMenuId(null);
                                    }}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50"
                                  >
                                    <Edit size={12} />
                                    <span>Edit</span>
                                  </button>
                                  <button
                                    onClick={() => {
                                      handleDeleteComment(comment._id);
                                      setCommentMenuId(null);
                                    }}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                                  >
                                    <Trash2 size={12} />
                                    <span>Delete</span>
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        )}
                      </div>

                      {isEditing ? (
                        <div>
                          <textarea
                            value={editedCommentContent}
                            onChange={(e) => setEditedCommentContent(e.target.value)}
                            className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            rows={3}
                          />
                          <div className="flex gap-2 mt-2">
                            <button
                              onClick={() => handleUpdateComment(comment._id)}
                              disabled={submitting}
                              className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:bg-gray-400"
                            >
                              {submitting ? 'Saving...' : 'Save'}
                            </button>
                            <button
                              onClick={() => setEditingCommentId(null)}
                              className="px-3 py-1.5 border text-sm rounded hover:bg-gray-50"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <p className="text-gray-800 mb-2 text-sm whitespace-pre-wrap">
                            {comment.content}
                          </p>

                          {comment.attachments && comment.attachments.length > 0 && (
                            <div className="space-y-1 mb-2">
                              {comment.attachments.map((file, idx) => (
                                <a
                                  key={idx}
                                  href={file.fileUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-2 p-2 bg-white rounded border hover:bg-gray-50 text-xs"
                                >
                                  {getFileIcon(file.fileType)}
                                  <span className="truncate">{file.fileName}</span>
                                </a>
                              ))}
                            </div>
                          )}

                          <button
                            onClick={() => handleLikeComment(comment._id)}
                            className="flex items-center gap-1 text-gray-600 hover:text-red-600 text-sm"
                          >
                            <Heart
                              size={14}
                              className={comment.likes.includes(currentUserId) ? 'fill-current text-red-600' : ''}
                            />
                            <span>{comment.likes.length}</span>
                          </button>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Add Comment */}
        <div className="p-4 sm:p-6 border-t border-gray-200 bg-gray-50 flex-shrink-0">
          <div className="space-y-3">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write a comment..."
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm"
              rows={3}
            />

            {selectedFiles.length > 0 && (
              <div className="space-y-2">
                {selectedFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-white rounded border">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <File size={14} />
                      <span className="text-sm truncate">{file.name}</span>
                    </div>
                    <button onClick={() => removeFile(index)} className="text-red-600 ml-2">
                      <CloseIcon size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center gap-2">
              <label className="cursor-pointer p-2 hover:bg-gray-200 rounded">
                <Paperclip size={20} className="text-gray-600" />
                <input
                  type="file"
                  onChange={handleFileSelect}
                  className="hidden"
                  multiple
                  accept="image/*,.pdf,.doc,.docx"
                />
              </label>
              <button
                onClick={handleAddComment}
                disabled={submitting || (!newComment.trim() && selectedFiles.length === 0)}
                className="ml-auto flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 text-sm"
              >
                <Send size={16} />
                <span>{submitting ? 'Sending...' : 'Send'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}