import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../supabaseClient';
import { User, BlogComment, BlogCommentInsert } from '../types';
import LoadingSpinner from './LoadingSpinner';
import MessageSquareIcon from './icons/MessageSquareIcon';

interface CommentSectionProps {
  postId: string;
  user: User | null;
}

interface CommentWithReplies extends BlogComment {
  replies: CommentWithReplies[];
}

const CommentForm: React.FC<{
  postId: string;
  user: User;
  parentCommentId?: string | null;
  onCommentAdded: () => void;
  onCancel?: () => void;
}> = ({ postId, user, parentCommentId = null, onCommentAdded, onCancel }) => {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setIsSubmitting(true);
    const newComment: BlogCommentInsert = {
      post_id: postId,
      user_id: user.id,
      parent_comment_id: parentCommentId,
      content: content.trim(),
    };
    
    const { error } = await supabase.from('blog_comments').insert(newComment);

    if (error) {
      alert(`Error posting comment: ${error.message}`);
    } else {
      setContent('');
      onCommentAdded();
      onCancel?.();
    }
    setIsSubmitting(false);
  };
  
  return (
    <form onSubmit={handleSubmit} className="mt-4">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={parentCommentId ? 'Write a reply...' : 'Join the discussion...'}
        className="w-full border border-hav-orange-200 rounded-md shadow-sm p-2 bg-white focus:ring-hav-orange-500 focus:border-hav-orange-500"
        rows={3}
        required
      />
      <div className="flex items-center justify-end gap-2 mt-2">
        {onCancel && <button type="button" onClick={onCancel} className="text-sm text-gray-600 hover:underline">Cancel</button>}
        <button type="submit" disabled={isSubmitting} className="bg-hav-orange-600 hover:bg-hav-orange-700 text-white font-bold py-2 px-4 rounded-full transition-colors text-sm disabled:bg-hav-orange-300">
          {isSubmitting ? 'Posting...' : 'Post Comment'}
        </button>
      </div>
    </form>
  );
};


const Comment: React.FC<{
  comment: CommentWithReplies;
  user: User | null;
  postId: string;
  onCommentChange: () => void;
}> = ({ comment, user, postId, onCommentChange }) => {
    const [isReplying, setIsReplying] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editedContent, setEditedContent] = useState(comment.content);
    
    const canEdit = user && user.id === comment.user_id;

    const handleDelete = async () => {
        if (window.confirm('Are you sure you want to delete this comment?')) {
            const { error } = await supabase.from('blog_comments').delete().eq('id', comment.id);
            if (error) alert(`Error deleting comment: ${error.message}`);
            else onCommentChange();
        }
    };
    
    const handleUpdate = async () => {
        if (!editedContent.trim()) return;
        const { error } = await supabase.from('blog_comments').update({ content: editedContent.trim() }).eq('id', comment.id);
        if (error) alert(`Error updating comment: ${error.message}`);
        else {
            onCommentChange();
            setIsEditing(false);
        }
    };

    return (
        <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-hav-orange-200 text-hav-orange-800 rounded-full flex items-center justify-center font-bold flex-shrink-0">
                {comment.profiles?.name.substring(0, 2).toUpperCase()}
            </div>
            <div className="flex-grow">
                <div className="flex items-baseline gap-2">
                    <p className="font-bold text-hav-brown">{comment.profiles?.name}</p>
                    <p className="text-xs text-gray-500">{new Date(comment.created_at).toLocaleString()}</p>
                </div>
                {isEditing ? (
                    <div>
                        <textarea value={editedContent} onChange={(e) => setEditedContent(e.target.value)} rows={3} className="w-full border border-hav-orange-200 rounded-md shadow-sm p-2 bg-white focus:ring-hav-orange-500 focus:border-hav-orange-500" />
                        <div className="flex gap-2 mt-1">
                            <button onClick={handleUpdate} className="text-xs font-semibold text-green-600">Save</button>
                            <button onClick={() => setIsEditing(false)} className="text-xs text-gray-600">Cancel</button>
                        </div>
                    </div>
                ) : (
                    <p className="mt-1 text-hav-brown text-base">{comment.content}</p>
                )}

                <div className="mt-2 flex items-center gap-4 text-sm">
                    {user && <button onClick={() => setIsReplying(!isReplying)} className="font-semibold text-hav-orange-600 hover:underline">Reply</button>}
                    {canEdit && !isEditing && <button onClick={() => setIsEditing(true)} className="font-semibold text-gray-600 hover:underline">Edit</button>}
                    {canEdit && <button onClick={handleDelete} className="font-semibold text-red-600 hover:underline">Delete</button>}
                </div>
                
                {isReplying && user && (
                    <CommentForm
                        postId={postId}
                        user={user}
                        parentCommentId={comment.id}
                        onCommentAdded={onCommentChange}
                        onCancel={() => setIsReplying(false)}
                    />
                )}
                
                {comment.replies.length > 0 && (
                    <div className="mt-4 pl-6 border-l-2 border-hav-orange-100 space-y-4">
                        {comment.replies.map(reply => (
                            <Comment key={reply.id} comment={reply} user={user} postId={postId} onCommentChange={onCommentChange} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};


const CommentSection: React.FC<CommentSectionProps> = ({ postId, user }) => {
  const [comments, setComments] = useState<BlogComment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchComments = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('blog_comments')
      .select('*, profiles(name)')
      .eq('post_id', postId)
      .order('created_at', { ascending: true });
    
    if (error) {
      console.error("Error fetching comments:", error);
    } else {
      setComments(data as BlogComment[]);
    }
    setLoading(false);
  };
  
  useEffect(() => {
    fetchComments();
  }, [postId]);

  const commentTree = useMemo(() => {
    const commentMap: Record<string, CommentWithReplies> = {};
    const tree: CommentWithReplies[] = [];

    for (const comment of comments) {
      commentMap[comment.id] = { ...comment, replies: [] };
    }

    for (const comment of comments) {
      if (comment.parent_comment_id && commentMap[comment.parent_comment_id]) {
        commentMap[comment.parent_comment_id].replies.push(commentMap[comment.id]);
      } else {
        tree.push(commentMap[comment.id]);
      }
    }
    return tree;
  }, [comments]);


  return (
    <section>
      <h2 className="text-3xl font-serif font-bold text-hav-orange-900 mb-6 flex items-center gap-3">
        <MessageSquareIcon className="w-8 h-8"/>
        Comments ({comments.length})
      </h2>
      
      {loading ? <LoadingSpinner /> : (
        <div className="space-y-6">
          {commentTree.map(comment => (
            <Comment key={comment.id} comment={comment} user={user} postId={postId} onCommentChange={fetchComments} />
          ))}
        </div>
      )}

      {comments.length === 0 && !loading && (
        <p className="text-center text-gray-500 py-8">Be the first to leave a comment!</p>
      )}

      <div className="mt-12 pt-8 border-t-2 border-hav-orange-100">
        {user ? (
          <CommentForm postId={postId} user={user} onCommentAdded={fetchComments} />
        ) : (
          <p className="text-center">Please log in to post a comment.</p>
        )}
      </div>
    </section>
  );
};

export default CommentSection;
