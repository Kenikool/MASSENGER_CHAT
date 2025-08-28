import React from 'react';
import { X, Reply } from 'lucide-react';
import { formatMessageTime } from '../lib/utils';

const MessageReply = ({ replyingTo, onCancelReply }) => {
  if (!replyingTo) return null;

  return (
    <div className="bg-base-200 border-l-4 border-primary p-3 mx-4 rounded-r-lg flex items-start gap-3">
      <Reply size={16} className="text-primary mt-1 flex-shrink-0" />
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-medium text-primary">
            Replying to {replyingTo.senderName}
          </span>
          <span className="text-xs text-base-content/60">
            {formatMessageTime(replyingTo.createdAt)}
          </span>
        </div>
        
        <div className="text-sm text-base-content/80 truncate">
          {replyingTo.text || (replyingTo.image ? '📷 Image' : '📎 File')}
        </div>
      </div>
      
      <button
        onClick={onCancelReply}
        className="btn btn-ghost btn-xs btn-circle flex-shrink-0"
        title="Cancel reply"
      >
        <X size={14} />
      </button>
    </div>
  );
};

export default MessageReply;