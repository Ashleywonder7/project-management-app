import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class CommentService {
  static async createComment(subtaskId: string, authorId: string, content: string) {
    const comment = await prisma.comment.create({
      data: {
        subtaskId,
        authorId,
        content
      },
      include: {
        author: {
          select: { id: true, firstName: true, lastName: true, email: true }
        }
      }
    });

    await prisma.activityLog.create({
      data: {
        userId: authorId,
        action: 'COMMENT_CREATED',
        details: `Added a comment on subtask ${subtaskId}`
      }
    });

    return comment;
  }

  static async updateComment(commentId: string, userId: string, newContent: string) {
    const comment = await prisma.comment.findUnique({ where: { id: commentId } });

    if (!comment) {
      throw { statusCode: 404, message: 'Comment not found' };
    }

    // Ownership Verification
    if (comment.authorId !== userId) {
      throw { statusCode: 403, message: 'You can only edit your own comments' };
    }

    // Server-side strict 15-minute evaluation rule
    const now = new Date().getTime();
    const createdAt = new Date(comment.createdAt).getTime();
    const diffInMinutes = (now - createdAt) / (1000 * 60);

    if (diffInMinutes > 15) {
      throw { statusCode: 403, message: 'Comment editing window (15 minutes) has expired' };
    }

    return await prisma.comment.update({
      where: { id: commentId },
      data: {
        content: newContent,
        isEdited: true,
        editedAt: new Date()
      },
      include: {
        author: {
          select: { id: true, firstName: true, lastName: true, email: true }
        }
      }
    });
  }

  static async deleteComment(commentId: string, userId: string, userRole: string) {
    const comment = await prisma.comment.findUnique({ where: { id: commentId } });

    if (!comment) {
      throw { statusCode: 404, message: 'Comment not found' };
    }

    if (comment.authorId !== userId && userRole !== 'ADMIN') {
      throw { statusCode: 403, message: 'Unauthorized to delete this comment' };
    }

    return await prisma.comment.delete({ where: { id: commentId } });
  }
}