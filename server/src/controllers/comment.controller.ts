import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { CommentService } from '../services/comment.service';

export const createComment = async (req: AuthRequest, res: Response) => {
  try {
    const { subtaskId } = req.params;
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, message: 'Comment content cannot be empty' });
    }

    const comment = await CommentService.createComment(subtaskId, req.user!.id, content);
    return res.status(201).json({ success: true, data: comment });
  } catch (error: any) {
    return res.status(error.status || 500).json({ success: false, message: error.message || 'Server error' });
  }
};

export const getComments = async (req: AuthRequest, res: Response) => {
  try {
    const { subtaskId } = req.params;
    const comments = await CommentService.getSubtaskComments(subtaskId);
    return res.status(200).json({ success: true, data: comments });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Failed to fetch comments' });
  }
};

export const updateComment = async (req: AuthRequest, res: Response) => {
  try {
    const { commentId } = req.params;
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, message: 'Updated comment text is required' });
    }

    const updated = await CommentService.updateComment(commentId, req.user!.id, content);
    return res.status(200).json({ success: true, data: updated });
  } catch (error: any) {
    return res.status(error.status || 500).json({ success: false, message: error.message });
  }
};