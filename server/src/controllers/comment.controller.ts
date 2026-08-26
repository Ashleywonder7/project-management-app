import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { CommentService } from '../services/comment.service';

export const createComment = async (req: AuthRequest, res: Response) => {
  try {
    const { subtaskId } = req.params;
    const { content } = req.body;
    if (!content) return res.status(400).json({ success: false, message: 'Content is required' });

    const comment = await CommentService.createComment(subtaskId, req.user!.id, content);
    res.status(201).json({ success: true, data: comment });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

export const updateComment = async (req: AuthRequest, res: Response) => {
  try {
    const { commentId } = req.params;
    const { content } = req.body;
    if (!content) return res.status(400).json({ success: false, message: 'Content is required' });

    const updated = await CommentService.updateComment(commentId, req.user!.id, content);
    res.status(200).json({ success: true, data: updated });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

export const deleteComment = async (req: AuthRequest, res: Response) => {
  try {
    const { commentId } = req.params;
    await CommentService.deleteComment(commentId, req.user!.id, req.user!.role);
    res.status(200).json({ success: true, message: 'Comment deleted successfully' });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};