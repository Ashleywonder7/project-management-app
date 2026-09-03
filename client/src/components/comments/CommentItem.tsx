import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface CommentProps {
  comment: {
    id: string;
    content: string;
    createdAt: string;
    isEdited: boolean;
    authorId: string;
    author: {
      id: string;
      firstName: string;
      lastName: string;
    };
  };
  currentUserId: string;
  onCommentUpdated: () => void;
}

export const CommentItem: React.FC<CommentProps> = ({ comment, currentUserId, onCommentUpdated }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState(comment.content);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isAuthor = comment.authorId === currentUserId;

  // Calculate remaining seconds out of 15 minutes (900 seconds)
  useEffect(() => {
    const calculateTime = () => {
      const created = new Date(comment.createdAt).getTime();
      const expires = created + 15 * 60 * 1000;
      const now = Date.now();
      const remainingSecs = Math.max(0, Math.floor((expires - now) / 1000));
      setTimeRemaining(remainingSecs);
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [comment.createdAt]);

  const canEdit = isAuthor && timeRemaining > 0;

  const formatCountdown = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleUpdate = async () => {
    if (!content.trim()) return;

    try {
      setError(null);
      setIsSubmitting(true);
      await axios.put(`/api/comments/${comment.id}`, { content });
      setIsEditing(false);
      onCommentUpdated();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to edit comment');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
  <div className="bg-white border border-slate-200 rounded-xl p-4 my-2 text-slate-800 shadow-sm">
    {/* Header */}
    <div className="flex justify-between items-center mb-2">
      <span className="font-bold text-sm text-blue-700">
        {comment.author.firstName} {comment.author.lastName}
      </span>
      <div className="flex items-center gap-2 text-xs text-slate-400">
        <span>{new Date(comment.createdAt).toLocaleString('en-GB')}</span>
        {comment.isEdited && <span className="italic text-slate-400">(Edited)</span>}
      </div>
    </div>

    {/* Body / Editing View */}
    {isEditing ? (
      <div className="mt-2 space-y-2">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          disabled={isSubmitting}
          className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
          rows={3}
        />
        {error && <p className="text-xs text-red-500">{error}</p>}
        <div className="flex justify-end gap-2">
          <button
            onClick={() => {
              setIsEditing(false);
              setContent(comment.content);
              setError(null);
            }}
            disabled={isSubmitting}
            className="px-3 py-1.5 bg-slate-100 text-slate-600 text-xs font-semibold rounded-lg hover:bg-slate-200 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleUpdate}
            disabled={isSubmitting}
            className="px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 shadow-sm transition disabled:opacity-50"
          >
            {isSubmitting ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    ) : (
      <div>
        <p className="text-sm text-slate-700 whitespace-pre-wrap">{comment.content}</p>
        {canEdit && (
          <div className="mt-3 flex items-center justify-end pt-2 border-t border-slate-100">
            <button
              onClick={() => setIsEditing(true)}
              className="text-xs text-blue-600 hover:text-blue-800 font-semibold"
            >
              Edit Comment
            </button>
          </div>
        )}
      </div>
    )}
  </div>
);}