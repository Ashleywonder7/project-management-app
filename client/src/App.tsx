import React from 'react';
import './index.css';
import { CommentItem } from './components/comments/CommentItem';


// Sample data to preview your comment component
const mockComment = {
  id: '1',
  content: 'Testing the deployed front-end comment component!',
  createdAt: new Date().toISOString(),
  isEdited: false,
  authorId: 'user-1',
  author: { id: 'user-1', firstName: 'John', lastName: 'Doe' },
};

export function App() {
  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Project Management App</h1>
      <CommentItem 
        comment={mockComment} 
        currentUserId="user-1" 
        onCommentUpdated={() => console.log('Updated!')} 
      />
    </div>
  );
}