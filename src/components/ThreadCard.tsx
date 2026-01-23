import React, { useState } from 'react';
import { 
  MessageSquare, 
  Heart, 
  Pin, 
  MoreVertical, 
  Edit, 
  Trash2,
  Paperclip,
  Calendar
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://fitout-manager-api.vercel.app';

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

interface ThreadCardProps {
  thread: Thread;
  onClick: () => void;
  onUpdate: () => void;
  onDelete: (threadId: string) => void;
}

export default function ThreadCard({ thread, onClick, onUpdate, onDelete }: ThreadCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(thread.likes.length);
  const [isProcessing, setIsProcessing] = useState(false);

  const currentUserId = localStorage.getItem('userId');
  const isOwner = thread.createdBy === currentUserId;

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isProcessing) return;

    setIsProcessing(true);
    const previousLiked = isLiked;
    const previousCount = likeCount;

    // Optimistic update
    setIsLiked(!isLiked);
    setLikeCount(isLiked ? likeCount - 1 : likeCount + 1);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/threads/${thread._id}/like`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setIsLiked(data.isLiked);
        setLikeCount(data.likes);
      } else {
        // Revert on failure
        setIsLiked(previousLiked);
        setLikeCount(previousCount);
      }
    } catch (error) {
      console.error('Like error:', error);
      setIsLiked(previousLiked);
      setLikeCount(previousCount);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this thread? All comments will also be deleted.')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/threads/${thread._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        onDelete(thread._id);
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to delete thread');
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to delete thread');
    }
    setShowMenu(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      const hours = Math.floor(diff / (1000 * 60 * 60));
      if (hours === 0) {
        const minutes = Math.floor(diff / (1000 * 60));
        return minutes === 0 ? 'Just now' : `${minutes}m ago`;
      }
      return `${hours}h ago`;
    } else if (days === 1) {
      return 'Yesterday';
    } else if (days < 7) {
      return `${days}d ago`;
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
  };

  const truncateContent = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <div
      onClick={onClick}
      className="bg-white border border-gray-200 rounded-lg p-4 sm:p-5 hover:shadow-md transition-shadow cursor-pointer relative"
    >
      {/* Pin Indicator */}
      {thread.isPinned && (
        <div className="absolute top-3 right-3 bg-blue-100 text-blue-700 px-2 py-1 rounded-full flex items-center gap-1 text-xs font-medium">
          <Pin size={12} />
          <span className="hidden sm:inline">Pinned</span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 pr-2">
          <h3 className="font-semibold text-gray-900 text-base sm:text-lg mb-1 line-clamp-2">
            {thread.title}
          </h3>
          <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-500">
            <span className="font-medium text-gray-700">{thread.createdByName}</span>
            <span>•</span>
            <div className="flex items-center gap-1">
              <Calendar size={12} />
              <span>{formatDate(thread.createdAt)}</span>
            </div>
          </div>
        </div>

        {/* Actions Menu */}
        {isOwner && (
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <MoreVertical size={18} className="text-gray-500" />
            </button>

            {showMenu && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMenu(false);
                  }}
                />
                <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-lg shadow-lg z-20 min-w-[140px]">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onClick();
                      setShowMenu(false);
                    }}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-t-lg"
                  >
                    <Edit size={14} />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={handleDelete}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-b-lg"
                  >
                    <Trash2 size={14} />
                    <span>Delete</span>
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Content Preview */}
      <p className="text-gray-700 text-sm sm:text-base mb-3 line-clamp-3">
        {truncateContent(thread.content, 200)}
      </p>

      {/* Attachments Indicator */}
      {thread.attachments && thread.attachments.length > 0 && (
        <div className="mb-3 flex items-center gap-2 text-xs sm:text-sm text-gray-600">
          <Paperclip size={14} />
          <span>{thread.attachments.length} attachment{thread.attachments.length > 1 ? 's' : ''}</span>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Like Button */}
          <button
            onClick={handleLike}
            disabled={isProcessing}
            className={`flex items-center gap-1.5 transition-colors ${
              isLiked ? 'text-red-600' : 'text-gray-600 hover:text-red-600'
            }`}
          >
            <Heart
              size={18}
              className={isLiked ? 'fill-current' : ''}
            />
            <span className="text-sm font-medium">{likeCount}</span>
          </button>

          {/* Comments */}
          <div className="flex items-center gap-1.5 text-gray-600">
            <MessageSquare size={18} />
            <span className="text-sm font-medium">{thread.commentCount}</span>
          </div>
        </div>

        {/* Project Badge */}
        {thread.projectId ? (
          <span className="bg-purple-100 text-purple-700 px-2 sm:px-3 py-1 rounded-full text-xs font-medium">
            Project Thread
          </span>
        ) : (
          <span className="bg-gray-100 text-gray-700 px-2 sm:px-3 py-1 rounded-full text-xs font-medium">
            General
          </span>
        )}
      </div>
    </div>
  );
}