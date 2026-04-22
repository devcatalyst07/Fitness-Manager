"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { apiClient } from "@/lib/axios";
import {
  MessageCircle,
  Send,
  ThumbsUp,
  Heart,
  Laugh,
  Eye,
  Frown,
  Angry,
  Trash2,
  Edit3,
  ChevronDown,
  ChevronUp,
  Loader2,
  Plus,
  X,
  Check,
  RefreshCw,
  Hash,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Brand {
  _id: string;
  name: string;
  description?: string;
  isActive: boolean;
}

interface ReactionSummary {
  [type: string]: { count: number; users: string[] };
}

interface ThreadPost {
  _id: string;
  brandId: string;
  authorName: string;
  authorEmail: string;
  authorRole: "admin" | "user";
  content: string;
  isEdited: boolean;
  commentCount: number;
  reactionSummary: ReactionSummary;
  myReaction: string | null;
  createdAt: string;
  updatedAt: string;
}

interface ThreadComment {
  _id: string;
  threadId: string;
  authorName: string;
  authorEmail: string;
  authorRole: "admin" | "user";
  content: string;
  reactionSummary: ReactionSummary;
  myReaction: string | null;
  createdAt: string;
}

interface ThreadsPageProps {
  userRole: "admin" | "user";
  currentUserId: string;
  currentUserEmail: string;
  currentUserName: string;
}

// ─── Reaction Config ──────────────────────────────────────────────────────────

const REACTIONS = [
  { type: "like",  emoji: "👍", label: "Like",  Icon: ThumbsUp },
  { type: "love",  emoji: "❤️", label: "Love",  Icon: Heart    },
  { type: "haha",  emoji: "😂", label: "Haha",  Icon: Laugh    },
  { type: "wow",   emoji: "😮", label: "Wow",   Icon: Eye      },
  { type: "sad",   emoji: "😢", label: "Sad",   Icon: Frown    },
  { type: "angry", emoji: "😡", label: "Angry", Icon: Angry    },
] as const;

const REACTION_EMOJI: Record<string, string> = {
  like: "👍", love: "❤️", haha: "😂", wow: "😮", sad: "😢", angry: "😡",
};

// ─── Avatar Helper ────────────────────────────────────────────────────────────

const AVATAR_COLORS = [
  "bg-violet-500", "bg-sky-500", "bg-emerald-500",
  "bg-rose-500", "bg-amber-500", "bg-indigo-500",
  "bg-pink-500", "bg-teal-500",
];

function getAvatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

// ✅ FIX: name is now optional with a safe fallback to prevent crash
// when authorName is undefined/null in post or comment data
function Avatar({ name, size = "md" }: { name?: string; size?: "sm" | "md" | "lg" }) {
  const safeName = name || "Unknown";
  const initials = safeName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
  const sizeClass = {
    sm: "w-7 h-7 text-xs",
    md: "w-9 h-9 text-sm",
    lg: "w-11 h-11 text-base",
  }[size];
  return (
    <div
      className={`${sizeClass} ${getAvatarColor(safeName)} rounded-full flex items-center justify-center text-white font-bold flex-shrink-0`}
    >
      {initials}
    </div>
  );
}

// ─── Time Helper ──────────────────────────────────────────────────────────────

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

// ─── Reaction Picker ──────────────────────────────────────────────────────────

function ReactionPicker({
  onReact,
  myReaction,
}: {
  onReact: (type: string) => void;
  myReaction: string | null;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all
          ${myReaction
            ? "bg-blue-50 text-blue-600 border border-blue-200"
            : "text-slate-500 hover:bg-slate-100 border border-transparent"
          }`}
      >
        {myReaction ? (
          <span className="text-sm">{REACTION_EMOJI[myReaction]}</span>
        ) : (
          <ThumbsUp size={13} />
        )}
        <span>
          {myReaction
            ? myReaction.charAt(0).toUpperCase() + myReaction.slice(1)
            : "React"}
        </span>
      </button>

      {open && (
        <div className="absolute bottom-full left-0 mb-2 bg-white border border-slate-200 rounded-2xl shadow-xl p-2 flex gap-1 z-50">
          {REACTIONS.map(({ type, emoji, label }) => (
            <button
              key={type}
              onClick={() => { onReact(type); setOpen(false); }}
              title={label}
              className={`w-9 h-9 flex items-center justify-center text-xl rounded-xl transition-all hover:scale-125
                ${myReaction === type ? "bg-blue-50 scale-110" : "hover:bg-slate-100"}`}
            >
              {emoji}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Reaction Bar ─────────────────────────────────────────────────────────────

function ReactionBar({ summary }: { summary: ReactionSummary }) {
  const entries = Object.entries(summary).filter(([, v]) => v.count > 0);
  if (entries.length === 0) return null;
  const total = entries.reduce((s, [, v]) => s + v.count, 0);
  return (
    <div className="flex flex-wrap items-center gap-1.5 mt-2">
      {entries.map(([type, { count, users }]) => (
        <div
          key={type}
          title={
            users.slice(0, 5).join(", ") +
            (users.length > 5 ? ` and ${users.length - 5} more` : "")
          }
          className="flex items-center gap-1 bg-slate-100 hover:bg-slate-200 px-2 py-0.5 rounded-full text-xs text-slate-600 cursor-default transition-colors"
        >
          <span>{REACTION_EMOJI[type]}</span>
          <span>{count}</span>
        </div>
      ))}
      <span className="text-xs text-slate-400">
        {total} reaction{total !== 1 ? "s" : ""}
      </span>
    </div>
  );
}

// ─── Comment Item ─────────────────────────────────────────────────────────────

function CommentItem({
  comment,
  currentUserEmail,
  userRole,
  onDelete,
  onReact,
}: {
  comment: ThreadComment;
  currentUserEmail: string;
  userRole: "admin" | "user";
  onDelete: (commentId: string) => void;
  onReact: (commentId: string, reaction: string) => void;
}) {
  const canDelete =
    comment.authorEmail === currentUserEmail || userRole === "admin";

  return (
    <div className="flex gap-2.5 group">
      <Avatar name={comment.authorName} size="sm" />
      <div className="flex-1 min-w-0">
        <div className="bg-slate-50 rounded-2xl rounded-tl-sm px-3.5 py-2.5">
          <div className="flex items-center justify-between gap-2 mb-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-semibold text-slate-800">
                {comment.authorName || "Unknown"}
              </span>
              {comment.authorRole === "admin" && (
                <span className="px-1.5 py-0.5 bg-slate-800 text-white text-[9px] font-bold rounded uppercase tracking-wider">
                  Admin
                </span>
              )}
            </div>
            {canDelete && (
              <button
                onClick={() => onDelete(comment._id)}
                className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-500 transition-all"
              >
                <Trash2 size={11} />
              </button>
            )}
          </div>
          <p className="text-sm text-slate-700 leading-relaxed break-words">
            {comment.content}
          </p>
        </div>
        <div className="flex items-center gap-2 mt-1 pl-1">
          <ReactionPicker
            onReact={(r) => onReact(comment._id, r)}
            myReaction={comment.myReaction}
          />
          <ReactionBar summary={comment.reactionSummary} />
          <span className="text-[11px] text-slate-400 ml-auto">
            {timeAgo(comment.createdAt)}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Post Card ────────────────────────────────────────────────────────────────

function PostCard({
  post,
  currentUserEmail,
  userRole,
  brandId,
  onDelete,
  onEdit,
  onReact,
}: {
  post: ThreadPost;
  currentUserEmail: string;
  userRole: "admin" | "user";
  brandId: string;
  onDelete: (postId: string) => void;
  onEdit: (postId: string, content: string) => void;
  onReact: (postId: string, reaction: string) => void;
}) {
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [comments, setComments] = useState<ThreadComment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content);
  const [savingEdit, setSavingEdit] = useState(false);

  const canEdit = post.authorEmail === currentUserEmail;
  const canDelete =
    post.authorEmail === currentUserEmail || userRole === "admin";

  const loadComments = async () => {
    setLoadingComments(true);
    try {
      const data = await apiClient.get<{ comments: ThreadComment[] }>(
        `/api/threads/${post._id}/comments`
      );
      setComments(data.comments);
    } catch (err) {
      console.error("Failed to load comments:", err);
    } finally {
      setLoadingComments(false);
    }
  };

  const toggleComments = () => {
    const opening = !commentsOpen;
    setCommentsOpen(opening);
    if (opening && comments.length === 0) loadComments();
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || submittingComment) return;
    setSubmittingComment(true);
    try {
      const data = await apiClient.post<{ comment: ThreadComment }>(
        `/api/threads/${post._id}/comments`,
        { content: newComment.trim() }
      );
      setComments((prev) => [...prev, data.comment]);
      setNewComment("");
    } catch (err) {
      console.error("Failed to add comment:", err);
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await apiClient.delete(
        `/api/threads/${post._id}/comments/${commentId}`
      );
      setComments((prev) => prev.filter((c) => c._id !== commentId));
    } catch (err) {
      console.error("Failed to delete comment:", err);
    }
  };

  const handleCommentReact = async (commentId: string, reaction: string) => {
    try {
      const data = await apiClient.post<{
        summary: ReactionSummary;
        myReaction: string | null;
      }>("/api/threads/reactions/toggle", {
        targetType: "comment",
        targetId: commentId,
        reaction,
        brandId,
      });
      setComments((prev) =>
        prev.map((c) =>
          c._id === commentId
            ? { ...c, reactionSummary: data.summary, myReaction: data.myReaction }
            : c
        )
      );
    } catch (err) {
      console.error("Failed to react to comment:", err);
    }
  };

  const handleSaveEdit = async () => {
    if (!editContent.trim() || savingEdit) return;
    setSavingEdit(true);
    try {
      await onEdit(post._id, editContent.trim());
      setEditing(false);
    } finally {
      setSavingEdit(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Post Header */}
      <div className="px-5 pt-5 pb-3">
        <div className="flex items-start gap-3">
          <Avatar name={post.authorName} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-slate-800 text-sm">
                {post.authorName || "Unknown"}
              </span>
              {post.authorRole === "admin" && (
                <span className="px-1.5 py-0.5 bg-slate-800 text-white text-[9px] font-bold rounded uppercase tracking-wider">
                  Admin
                </span>
              )}
              {post.isEdited && (
                <span className="text-[11px] text-slate-400 italic">
                  (edited)
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {timeAgo(post.createdAt)}
            </p>
          </div>
          {/* Actions */}
          <div className="flex items-center gap-1">
            {canEdit && !editing && (
              <button
                onClick={() => {
                  setEditing(true);
                  setEditContent(post.content);
                }}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
              >
                <Edit3 size={14} />
              </button>
            )}
            {canDelete && !editing && (
              <button
                onClick={() => onDelete(post._id)}
                className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Post Content */}
        {editing ? (
          <div className="mt-3">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              rows={4}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 resize-none focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400"
            />
            <div className="flex gap-2 mt-2 justify-end">
              <button
                onClick={() => setEditing(false)}
                className="px-3 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-100 rounded-lg transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={!editContent.trim() || savingEdit}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white text-xs font-medium rounded-lg hover:bg-slate-800 disabled:bg-slate-300 disabled:cursor-not-allowed transition-all"
              >
                {savingEdit ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : (
                  <Check size={12} />
                )}
                Save
              </button>
            </div>
          </div>
        ) : (
          <p className="mt-3 text-sm text-slate-700 leading-relaxed whitespace-pre-wrap break-words">
            {post.content}
          </p>
        )}

        {/* Reaction Summary */}
        <ReactionBar summary={post.reactionSummary} />
      </div>

      {/* Post Actions */}
      <div className="px-5 py-2 border-t border-slate-100 flex items-center gap-1">
        <ReactionPicker
          onReact={(r) => onReact(post._id, r)}
          myReaction={post.myReaction}
        />

        <button
          onClick={toggleComments}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-slate-500 hover:bg-slate-100 border border-transparent transition-all"
        >
          <MessageCircle size={13} />
          <span>
            {post.commentCount > 0
              ? `${post.commentCount} Comment${post.commentCount !== 1 ? "s" : ""}`
              : "Comment"}
          </span>
          {commentsOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </button>
      </div>

      {/* Comments Section */}
      {commentsOpen && (
        <div className="px-5 pb-4 pt-2 border-t border-slate-100 bg-white">
          {loadingComments ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 size={16} className="animate-spin text-slate-400" />
            </div>
          ) : (
            <div className="space-y-3 mb-3">
              {comments.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-3">
                  No comments yet. Be the first!
                </p>
              ) : (
                comments.map((comment) => (
                  <CommentItem
                    key={comment._id}
                    comment={comment}
                    currentUserEmail={currentUserEmail}
                    userRole={userRole}
                    onDelete={handleDeleteComment}
                    onReact={handleCommentReact}
                  />
                ))
              )}
            </div>
          )}

          {/* Add Comment Input */}
          <div className="flex gap-2.5 items-end">
            <div className="flex-1">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleAddComment();
                  }
                }}
                placeholder="Write a comment… (Enter to send)"
                rows={1}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-slate-800 placeholder:text-slate-400 resize-none focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-all"
                style={{ minHeight: "40px", maxHeight: "120px" }}
              />
            </div>
            <button
              onClick={handleAddComment}
              disabled={!newComment.trim() || submittingComment}
              className="p-2.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 disabled:bg-slate-300 disabled:cursor-not-allowed transition-all flex-shrink-0"
            >
              {submittingComment ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Send size={14} />
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Create Post Form ─────────────────────────────────────────────────────────

function CreatePostForm({
  brandId,
  authorName,
  onCreated,
}: {
  brandId: string;
  authorName: string;
  onCreated: (post: ThreadPost) => void;
}) {
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [focused, setFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = async () => {
    if (!content.trim() || submitting) return;
    setSubmitting(true);
    try {
      const data = await apiClient.post<{ post: ThreadPost }>("/api/threads", {
        brandId,
        content: content.trim(),
      });
      setContent("");
      setFocused(false);
      onCreated(data.post);
    } catch (err) {
      console.error("Failed to create post:", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className={`bg-white rounded-2xl border transition-all duration-200 ${
        focused ? "border-slate-300 shadow-md" : "border-slate-200 shadow-sm"
      }`}
    >
      <div className="p-4 flex gap-3">
        <Avatar name={authorName} />
        <div className="flex-1">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => !content && setFocused(false)}
            placeholder="Share something with your team…"
            rows={focused ? 4 : 2}
            className="w-full text-sm text-slate-800 placeholder:text-slate-400 bg-transparent resize-none focus:outline-none leading-relaxed transition-all duration-200"
          />
          {focused && (
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100">
              <span
                className={`text-xs ${
                  content.length > 4500 ? "text-rose-500" : "text-slate-400"
                }`}
              >
                {content.length}/5000
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setContent("");
                    setFocused(false);
                  }}
                  className="px-3 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-100 rounded-lg transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!content.trim() || submitting || content.length > 5000}
                  className="flex items-center gap-1.5 px-4 py-1.5 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-800 disabled:bg-slate-300 disabled:cursor-not-allowed transition-all"
                >
                  {submitting ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    <Send size={12} />
                  )}
                  Post
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main ThreadsPage Component ───────────────────────────────────────────────

export default function ThreadsPage({
  userRole,
  currentUserId,
  currentUserEmail,
  currentUserName,
}: ThreadsPageProps) {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);
  const [posts, setPosts] = useState<ThreadPost[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadingBrands, setLoadingBrands] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ── Fetch brands on mount ──
  useEffect(() => {
    const fetchBrands = async () => {
      setLoadingBrands(true);
      try {
        // ✅ Reuses the existing proven /api/brands endpoint
        const data = await apiClient.get<Brand[]>("/api/brands");
        setBrands(data);
        if (data.length > 0) setSelectedBrand(data[0]);
      } catch (err) {
        console.error("Failed to fetch brands:", err);
        setError("Failed to load brands.");
      } finally {
        setLoadingBrands(false);
      }
    };
    fetchBrands();
  }, []);

  // ── Fetch posts when selected brand changes ──
  const fetchPosts = useCallback(
    async (brandId: string, pageNum: number, append = false) => {
      if (append) setLoadingMore(true);
      else setLoading(true);

      setError(null);
      try {
        const data = await apiClient.get<{
          posts: ThreadPost[];
          total: number;
          hasMore: boolean;
        }>(`/api/threads?brandId=${brandId}&page=${pageNum}&limit=10`);

        setPosts((prev) => (append ? [...prev, ...data.posts] : data.posts));
        setTotal(data.total);
        setHasMore(data.hasMore);
        setPage(pageNum);
      } catch (err) {
        console.error("Failed to fetch posts:", err);
        setError("Failed to load posts.");
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    []
  );

  useEffect(() => {
    if (selectedBrand) {
      setPosts([]);
      fetchPosts(selectedBrand._id, 1);
    }
  }, [selectedBrand, fetchPosts]);

  const handlePostCreated = (post: ThreadPost) => {
    setPosts((prev) => [post, ...prev]);
    setTotal((t) => t + 1);
  };

  const handlePostDelete = async (postId: string) => {
    try {
      await apiClient.delete(`/api/threads/${postId}`);
      setPosts((prev) => prev.filter((p) => p._id !== postId));
      setTotal((t) => t - 1);
    } catch (err) {
      console.error("Failed to delete post:", err);
    }
  };

  const handlePostEdit = async (postId: string, content: string) => {
    try {
      const data = await apiClient.put<{ post: ThreadPost }>(
        `/api/threads/${postId}`,
        { content }
      );
      setPosts((prev) =>
        prev.map((p) => (p._id === postId ? { ...p, ...data.post } : p))
      );
    } catch (err) {
      console.error("Failed to edit post:", err);
      throw err;
    }
  };

  const handlePostReact = async (postId: string, reaction: string) => {
    if (!selectedBrand) return;
    try {
      const data = await apiClient.post<{
        summary: ReactionSummary;
        myReaction: string | null;
      }>("/api/threads/reactions/toggle", {
        targetType: "post",
        targetId: postId,
        reaction,
        brandId: selectedBrand._id,
      });
      setPosts((prev) =>
        prev.map((p) =>
          p._id === postId
            ? { ...p, reactionSummary: data.summary, myReaction: data.myReaction }
            : p
        )
      );
    } catch (err) {
      console.error("Failed to react:", err);
    }
  };

  // ── Loading state ──
  if (loadingBrands) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 size={24} className="animate-spin text-slate-400" />
      </div>
    );
  }

  // ── No brands ──
  if (brands.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3 text-center px-4">
        <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center">
          <Hash size={24} className="text-slate-400" />
        </div>
        <h3 className="font-semibold text-slate-700">No brands available</h3>
        <p className="text-sm text-slate-400 max-w-xs">
          {userRole === "admin"
            ? "Create a brand first to start using Threads."
            : "You need to be assigned to a project before you can access Threads."}
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Brand Selector */}
      {brands.length > 1 && (
        <div className="flex flex-wrap gap-2 mb-6">
          {brands.map((brand) => (
            <button
              key={brand._id}
              onClick={() => setSelectedBrand(brand)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all border
                ${
                  selectedBrand?._id === brand._id
                    ? "bg-slate-900 text-white border-slate-900"
                    : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"
                }`}
            >
              <span className="flex items-center gap-1.5">
                <Hash size={12} />
                {brand.name}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Single brand title */}
      {brands.length === 1 && selectedBrand && (
        <div className="flex items-center gap-2 mb-6">
          <Hash size={16} className="text-slate-400" />
          <h2 className="text-lg font-semibold text-slate-700">
            {selectedBrand.name}
          </h2>
          <span className="text-xs text-slate-400 ml-1">
            {total} post{total !== 1 ? "s" : ""}
          </span>
        </div>
      )}

      {/* Create Post Form */}
      {selectedBrand && (
        <div className="mb-6">
          <CreatePostForm
            brandId={selectedBrand._id}
            authorName={currentUserName}
            onCreated={handlePostCreated}
          />
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 text-rose-700 text-sm px-4 py-3 rounded-xl mb-4">
          <X size={14} />
          {error}
          <button
            onClick={() => selectedBrand && fetchPosts(selectedBrand._id, 1)}
            className="ml-auto flex items-center gap-1 text-xs underline"
          >
            <RefreshCw size={12} /> Retry
          </button>
        </div>
      )}

      {/* Posts Feed */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white rounded-2xl border border-slate-200 p-5 animate-pulse"
            >
              <div className="flex gap-3 mb-4">
                <div className="w-9 h-9 bg-slate-200 rounded-full" />
                <div className="flex-1">
                  <div className="h-3 bg-slate-200 rounded w-32 mb-2" />
                  <div className="h-2 bg-slate-100 rounded w-20" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-3 bg-slate-200 rounded" />
                <div className="h-3 bg-slate-200 rounded w-4/5" />
                <div className="h-3 bg-slate-100 rounded w-2/3" />
              </div>
            </div>
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
          <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center">
            <MessageCircle size={24} className="text-slate-400" />
          </div>
          <h3 className="font-semibold text-slate-700">No posts yet</h3>
          <p className="text-sm text-slate-400">
            Be the first to share something with the team!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <PostCard
              key={post._id}
              post={post}
              currentUserEmail={currentUserEmail}
              userRole={userRole}
              brandId={selectedBrand!._id}
              onDelete={handlePostDelete}
              onEdit={handlePostEdit}
              onReact={handlePostReact}
            />
          ))}

          {/* Load More */}
          {hasMore && (
            <div className="flex justify-center pt-2 pb-6">
              <button
                onClick={() =>
                  selectedBrand && fetchPosts(selectedBrand._id, page + 1, true)
                }
                disabled={loadingMore}
                className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-600 text-sm font-medium rounded-xl hover:bg-slate-50 hover:border-slate-300 disabled:opacity-50 transition-all shadow-sm"
              >
                {loadingMore ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Plus size={14} />
                )}
                Load more
              </button>
            </div>
          )}

          {!hasMore && posts.length > 0 && (
            <p className="text-center text-xs text-slate-400 py-4">
              You've seen all {total} post{total !== 1 ? "s" : ""}
            </p>
          )}
        </div>
      )}
    </div>
  );
}