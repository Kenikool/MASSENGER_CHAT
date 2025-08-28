import React, { useState, useRef, useEffect } from 'react';
import { 
  Reply, 
  MessageCircle, 
  ChevronDown, 
  ChevronUp, 
  Send, 
  X,
  Users,
  Clock
} from 'lucide-react';
import { formatMessageTime } from '../lib/utils';
import { formatMessage } from '../lib/messageFormatter';
import { useAuthStore } from '../store/useAuthStore';
import { useChatStore } from '../store/useChatStore';
import toast from 'react-hot-toast';

const MessageThread = ({ 
  parentMessage, 
  threadReplies = [], 
  onReply, 
  onClose,
  isOpen = false 
}) => {
  const [replyText, setReplyText] = useState('');
  const [isExpanded, setIsExpanded] = useState(isOpen);
  const [isSending, setIsSending] = useState(false);
  const replyInputRef = useRef(null);
  const { authUser } = useAuthStore();
  const { sendMessage, selectedUser } = useChatStore();

  useEffect(() => {
    if (isExpanded && replyInputRef.current) {
      replyInputRef.current.focus();
    }
  }, [isExpanded]);

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim()) return;

    setIsSending(true);
    try {
      await sendMessage({
        text: replyText.trim(),
        replyTo: parentMessage._id,
        threadId: parentMessage.threadId || parentMessage._id,
        isThreadReply: true
      });
      
      setReplyText('');
      toast.success('Reply sent!');
    } catch (error) {
      console.error('Failed to send reply:', error);
      toast.error('Failed to send reply');
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendReply(e);
    }
  };

  const getUniqueParticipants = () => {
    const participants = new Set();
    participants.add(parentMessage.senderId);
    threadReplies.forEach(reply => {
      participants.add(reply.senderId);
    });
    return Array.from(participants);
  };

  const uniqueParticipants = getUniqueParticipants();

  return (
    <div className="message-thread">
      {/* Thread Header */}
      <div className="flex items-center justify-between p-3 bg-base-200/50 border-t border-base-300">
        <div className="flex items-center gap-2">
          <MessageCircle size={16} className="text-primary" />
          <span className="text-sm font-medium">
            Thread ({threadReplies.length} {threadReplies.length === 1 ? 'reply' : 'replies'})
          </span>
          {uniqueParticipants.length > 1 && (
            <div className="flex items-center gap-1 text-xs text-base-content/60">
              <Users size={12} />
              <span>{uniqueParticipants.length} participants</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="btn btn-ghost btn-xs"
            title={isExpanded ? 'Collapse thread' : 'Expand thread'}
          >
            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="btn btn-ghost btn-xs"
              title="Close thread"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Thread Content */}
      {isExpanded && (
        <div className="thread-content bg-base-100/50">
          {/* Original Message Preview */}
          <div className="p-3 border-b border-base-300/50 bg-base-200/30">
            <div className="flex items-start gap-3">
              <div className="avatar">
                <div className="w-8 h-8 rounded-full">
                  <img 
                    src={parentMessage.sender?.profilePic || '/avatar.png'} 
                    alt={parentMessage.sender?.fullName || 'User'}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium">
                    {parentMessage.sender?.fullName || 'Unknown User'}
                  </span>
                  <span className="text-xs text-base-content/60">
                    {formatMessageTime(parentMessage.createdAt)}
                  </span>
                </div>
                <div className="text-sm text-base-content/80">
                  {parentMessage.hasFormatting ? (
                    <div 
                      className="prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ 
                        __html: formatMessage(parentMessage.text) 
                      }}
                    />
                  ) : (
                    <p className="line-clamp-2">{parentMessage.text}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Thread Replies */}
          {threadReplies.length > 0 && (
            <div className="thread-replies max-h-64 overflow-y-auto">
              {threadReplies.map((reply, index) => {
                const isMyReply = reply.senderId === authUser._id;
                return (
                  <div key={reply._id} className="p-3 border-b border-base-300/30 hover:bg-base-200/30 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className="avatar">
                        <div className="w-7 h-7 rounded-full">
                          <img 
                            src={reply.sender?.profilePic || '/avatar.png'} 
                            alt={reply.sender?.fullName || 'User'}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-sm font-medium ${
                            isMyReply ? 'text-primary' : ''
                          }`}>
                            {isMyReply ? 'You' : (reply.sender?.fullName || 'Unknown User')}
                          </span>
                          <span className="text-xs text-base-content/60">
                            {formatMessageTime(reply.createdAt)}
                          </span>
                          {reply.isEdited && (
                            <span className="text-xs text-base-content/50">(edited)</span>
                          )}
                        </div>
                        <div className="text-sm">
                          {reply.hasFormatting ? (
                            <div 
                              className="prose prose-sm max-w-none"
                              dangerouslySetInnerHTML={{ 
                                __html: formatMessage(reply.text) 
                              }}
                            />
                          ) : (
                            <p className="whitespace-pre-wrap">{reply.text}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Reply Input */}
          <div className="p-3 border-t border-base-300/50">
            <form onSubmit={handleSendReply} className="flex items-end gap-2">
              <div className="flex-1">
                <textarea
                  ref={replyInputRef}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Reply to thread..."
                  className="textarea textarea-bordered textarea-sm w-full resize-none"
                  rows={2}
                  disabled={isSending}
                />
              </div>
              <button
                type="submit"
                disabled={!replyText.trim() || isSending}
                className={`btn btn-sm btn-circle ${
                  replyText.trim() ? 'btn-primary' : 'btn-ghost'
                }`}
                title="Send reply"
              >
                {isSending ? (
                  <span className="loading loading-spinner loading-xs" />
                ) : (
                  <Send size={14} />
                )}
              </button>
            </form>
            
            {/* Thread Stats */}
            {threadReplies.length > 0 && (
              <div className="flex items-center gap-4 mt-2 text-xs text-base-content/60">
                <div className="flex items-center gap-1">
                  <Clock size={12} />
                  <span>
                    Last reply {formatMessageTime(threadReplies[threadReplies.length - 1]?.createdAt)}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <MessageCircle size={12} />
                  <span>{threadReplies.length} replies</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Thread Reply Button Component
export const ThreadReplyButton = ({ message, onStartThread, replyCount = 0 }) => {
  return (
    <button
      onClick={() => onStartThread(message)}
      className="btn btn-ghost btn-xs opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-105"
      title="Reply in thread"
    >
      <div className="flex items-center gap-1">
        <Reply size={12} />
        {replyCount > 0 && (
          <span className="text-xs font-medium">{replyCount}</span>
        )}
      </div>
    </button>
  );
};

// Thread Preview Component (for showing thread summary)
export const ThreadPreview = ({ message, threadReplies, onClick }) => {
  if (!threadReplies || threadReplies.length === 0) return null;

  const lastReply = threadReplies[threadReplies.length - 1];
  const uniqueParticipants = new Set([
    message.senderId,
    ...threadReplies.map(reply => reply.senderId)
  ]);

  return (
    <div 
      onClick={onClick}
      className="mt-2 p-2 bg-base-200/50 rounded-lg border border-base-300/50 cursor-pointer hover:bg-base-200/70 transition-colors"
    >
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <MessageCircle size={12} className="text-primary" />
          <span className="text-xs font-medium text-primary">
            {threadReplies.length} {threadReplies.length === 1 ? 'reply' : 'replies'}
          </span>
          {uniqueParticipants.size > 1 && (
            <span className="text-xs text-base-content/60">
              • {uniqueParticipants.size} participants
            </span>
          )}
        </div>
        <span className="text-xs text-base-content/60">
          {formatMessageTime(lastReply.createdAt)}
        </span>
      </div>
      
      <div className="text-xs text-base-content/70 line-clamp-1">
        <span className="font-medium">
          {lastReply.sender?.fullName || 'Someone'}:
        </span>
        {' '}{lastReply.text}
      </div>
    </div>
  );
};

export default MessageThread;