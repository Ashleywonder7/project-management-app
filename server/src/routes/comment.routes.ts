import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { createComment, getComments, updateComment } from '../controllers/comment.controller';

const router = Router();

router.post('/subtasks/:subtaskId/comments', authenticateToken, createComment);
router.get('/subtasks/:subtaskId/comments', authenticateToken, getComments);
router.put('/comments/:commentId', authenticateToken, updateComment);

export default router;