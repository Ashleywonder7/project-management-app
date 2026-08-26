'use client';

import React, { useState, useEffect } from 'react';
import API from '@/lib/api';

interface Author {
  id: string;
  firstName: string;
  lastName: string;
}

interface CommentProps {
  comment: {
    id: string;
    content: string;
    createdAt: string;
    isEdited: Boolean;
    authorId: string;
    author: Author;
  };
  currentUserId: string;
  onCommentUpdated: () => void;
}

export const CommentItem: React.FC<CommentProps> = ({ comment, currentUserId, onCommentUpdated }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState(comment.content);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  const isAuthor = comment.authorId === currentUserId;

  useEffect(() => {
    const calculateTime = () => {
      const created = new Date(comment.createdAt).getTime();
      const expires = created + 15 * 60 * 1000;
      const now = new Date().getTime();
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
    try {
      setError(null);
      await API.put(`/comments/${comment.id}`, { content });
      setIsEditing(false);
      onCommentUpdated();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to edit comment');
    }
  };

  return (
    <div className="bg-slate-800/50 border border-slate-700/60 rounded-lg p-4 my-2 text-slate-100">
      <div className="flex justify-between items-center mb-2">
        <span className="font-semibold text-sm text-indigo-400">
          {comment.author.firstName} {comment.author.lastName}
        </span>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span>{new Date(comment.createdAt).toLocaleString('en-GB')}</span>
          {comment.isEdited && <span className="italic text-slate-500">(Edited)</span>}
        </div>
      </div>

      {isEditing ? (
        <div className="mt-2 space-y-2">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            rows={3}
          />
          {error && <p className="text-xs text-red-400">{error}</p>}
          <div className="flex justify-between items-center">
            <span className="text-xs text-amber-400 font-mono">
              Window expires in: {formatCountdown(timeRemaining)}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setIsEditing(false)}
                className="px-3 py-1 bg-slate-700 text-xs rounded hover:bg-slate-600 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdate}
                className="px-3 py-1 bg-indigo-600 text-xs text-white rounded hover:bg-indigo-500 transition"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div>
          <p className="text-sm text-slate-300 whitespace-pre-wrap">{comment.content}</p>
          {canEdit && (
            <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-700/40">
              <span className="text-xs text-slate-400 font-mono">
                Editable for: {formatCountdown(timeRemaining)}
              </span>
              <button
                onClick={() => setIsEditing(true)}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-medium"
              >
                Edit Comment
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};