import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const FIFTEEN_MINUTES_IN_MS = 15 * 60 * 1000;

export class CommentService {
  static async createComment(subtaskId: string, authorId: string, content: string) {
    return await prisma.comment.create({
      data: {
        subtaskId,
        authorId,
        content,
      },
      include: {
        author: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });
  }

  static async getSubtaskComments(subtaskId: string) {
    return await prisma.comment.findMany({
      where: { subtaskId },
      include: {
        author: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async updateComment(commentId: string, userId: string, newContent: string) {
    const comment = await prisma.comment.findUnique({ where: { id: commentId } });

    if (!comment) {
      throw { status: 404, message: 'Comment not found' };
    }

    // Ownership Verification
    if (comment.authorId !== userId) {
      throw { status: 403, message: 'You are only allowed to edit your own comments.' };
    }

    // Server-Side 15-Minute Rule Enforcement
    const now = new Date().getTime();
    const createdTime = new Date(comment.createdAt).getTime();
    const elapsedTime = now - createdTime;

    if (elapsedTime > FIFTEEN_MINUTES_IN_MS) {
      throw { status: 403, message: 'Editing window expired. Comments can only be edited within 15 minutes of creation.' };
    }

    return await prisma.comment.update({
      where: { id: commentId },
      data: {
        content: newContent,
        isEdited: true,
        editedAt: new Date(),
      },
      include: {
        author: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });
  }

  static async deleteComment(commentId: string, userId: string, userRole: string) {
    const comment = await prisma.comment.findUnique({ where: { id: commentId } });

    if (!comment) {
      throw { status: 404, message: 'Comment not found' };
    }

    // Admin override or author ownership check
    if (comment.authorId !== userId && userRole !== 'ADMIN') {
      throw { status: 403, message: 'Unauthorized to delete this comment.' };
    }

    return await prisma.comment.delete({ where: { id: commentId } });
  }
}