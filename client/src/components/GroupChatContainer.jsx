import React, { useState, useRef, useEffect } from 'react';
import { 
  Users, 
  Settings, 
  UserPlus, 
  Crown, 
  Shield, 
  MoreVertical,
  Pin,
  Search,
  ArrowDown,
  User,
  MessageCircle
} from 'lucide-react';
import { formatMessageTime } from '../lib/utils';
import { formatMessage } from '../lib/messageFormatter';
import { useAuthStore } from '../store/useAuthStore';
import { useChatStore } from '../store/useChatStore';
import { useSocketContext } from '../hooks/useSocketContext';
import MessageThread, { ThreadReplyButton, ThreadPreview } from './MessageThread';
import AdvancedSearch from './AdvancedSearch';
import EnhancedMessageInput from './EnhancedMessageInput';
import MessageSkeleton from './skeletons/MessageSkeleton';
import axiosInstance from '../lib/axios';
import toast from 'react-hot-toast';

// Group Header Component
const GroupHeader = ({ group, onShowMembers, onShowSettings, isTyping }) => {
  const { authUser } = useAuthStore();
  const [showSearch, setShowSearch] = useState(false);
  
  const onlineMembers = group?.members?.filter(member => 
    member.userId?.isOnline
  ) || [];
  
  const userRole = group?.members?.find(member => 
    member.userId?._id === authUser._id
  )?.role;

  return (
    <div className="bg-base-200 border-b border-base-300 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Group Avatar */}
          <div className="avatar">
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
              {group?.profilePic ? (
                <img 
                  src={group.profilePic} 
                  alt={group.name}
                  className="w-full h-full object-cover rounded-full"
                />
              ) : (
                <Users className="w-6 h-6 text-primary" />
              )}
            </div>
          </div>
          
          {/* Group Info */}
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h2 className="font-semibold text-lg">{group?.name}</h2>
              {group?.settings?.isPrivate && (
                <Shield className="w-4 h-4 text-warning" title="Private Group" />
              )}
            </div>
            
            <div className="flex items-center gap-2 text-sm text-base-content/60">
              <span>{group?.memberCount || 0} members</span>
              {onlineMembers.length > 0 && (
                <>
                  <span>•</span>
                  <span className="text-green-500">
                    {onlineMembers.length} online
                  </span>
                </>
              )}
              {userRole && (
                <>
                  <span>•</span>
                  <span className="capitalize flex items-center gap-1">
                    {userRole === 'admin' && <Crown className="w-3 h-3" />}
                    {userRole === 'moderator' && <Shield className="w-3 h-3" />}
                    {userRole}
                  </span>
                </>
              )}
            </div>
            
            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex items-center gap-2 text-sm text-primary mt-1">
                <div className="flex gap-1">
                  <div className="w-1 h-1 bg-primary rounded-full animate-bounce"></div>
                  <div className="w-1 h-1 bg-primary rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                  <div className="w-1 h-1 bg-primary rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                </div>
                <span>Someone is typing...</span>
              </div>
            )}
          </div>
        </div>
        
        {/* Header Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSearch(!showSearch)}
            className="btn btn-ghost btn-sm btn-circle"
            title="Search messages"
          >
            <Search className="w-4 h-4" />
          </button>
          
          <button
            onClick={onShowMembers}
            className="btn btn-ghost btn-sm btn-circle"
            title="View members"
          >
            <Users className="w-4 h-4" />
          </button>
          
          <button
            onClick={onShowSettings}
            className="btn btn-ghost btn-sm btn-circle"
            title="Group settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      {/* Search Bar */}
      {showSearch && (
        <div className="mt-3 pt-3 border-t border-base-300">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-base-content/40" size={16} />
            <input
              type="text"
              placeholder="Search in this group..."
              className="input input-bordered w-full pl-10"
            />
          </div>
        </div>
      )}
    </div>
  );
};

// Group Message Component
const GroupMessage = ({ 
  message, 
  authUser, 
  group,
  onReact,
  onEdit,
  onDelete,
  onStartThread,
  threadMessages 
}) => {
  const isMyMessage = message.senderId === authUser._id;
  const sender = group?.members?.find(member => 
    member.userId?._id === message.senderId
  )?.userId;
  
  const senderRole = group?.members?.find(member => 
    member.userId?._id === message.senderId
  )?.role;

  return (
    <div className="group hover:bg-base-200/30 transition-colors p-3 rounded-lg">
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="avatar">
          <div className="w-10 h-10 rounded-full">
            <img 
              src={sender?.profilePic || '/avatar.png'} 
              alt={sender?.fullName || 'User'}
              className="w-full h-full object-cover"
            />
          </div>
        </div>
        
        {/* Message Content */}
        <div className="flex-1 min-w-0">
          {/* Message Header */}
          <div className="flex items-center gap-2 mb-1">
            <span className={`font-medium ${
              isMyMessage ? 'text-primary' : ''
            }`}>
              {isMyMessage ? 'You' : (sender?.fullName || 'Unknown User')}
            </span>
            
            {/* Role Badge */}
            {senderRole && senderRole !== 'member' && (
              <span className={`badge badge-xs ${
                senderRole === 'admin' ? 'badge-warning' : 'badge-info'
              }`}>
                {senderRole === 'admin' && <Crown className="w-2 h-2 mr-1" />}
                {senderRole === 'moderator' && <Shield className="w-2 h-2 mr-1" />}
                {senderRole}
              </span>
            )}
            
            <span className="text-xs text-base-content/60">
              {formatMessageTime(message.createdAt)}
            </span>
            
            {message.isEdited && (
              <span className="text-xs text-base-content/50">(edited)</span>
            )}
          </div>
          
          {/* Message Text */}
          {message.text && (
            <div className="text-sm break-words">
              {message.hasFormatting ? (
                <div 
                  className="prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ 
                    __html: formatMessage(message.text) 
                  }}
                />
              ) : (
                <p className="whitespace-pre-wrap">{message.text}</p>
              )}
            </div>
          )}
          
          {/* Message Images */}
          {message.image && (
            <div className="mt-2">
              <img 
                src={message.image} 
                alt="Attachment"
                className="max-w-xs rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
              />
            </div>
          )}
          
          {/* Voice Message */}
          {message.voiceUrl && (
            <div className="mt-2 p-3 bg-base-200/50 rounded-lg max-w-xs">
              <div className="flex items-center gap-2 mb-2">
                <MessageCircle className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">Voice Message</span>
                {message.voiceDuration && (
                  <span className="text-xs text-base-content/60">
                    {Math.floor(message.voiceDuration / 60)}:{(message.voiceDuration % 60).toString().padStart(2, '0')}
                  </span>
                )}
              </div>
              <audio controls src={message.voiceUrl} className="w-full" />
            </div>
          )}
          
          {/* Message Reactions */}
          {message.reactions && message.reactions.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {message.reactions.map((reaction, index) => {
                const hasUserReacted = reaction.users?.includes(authUser._id);
                return (
                  <button
                    key={index}
                    className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs transition-all duration-200 hover:scale-105 ${
                      hasUserReacted 
                        ? 'bg-primary/20 border border-primary/40 text-primary' 
                        : 'bg-base-200 hover:bg-base-300 border border-transparent'
                    }`}
                    onClick={() => onReact(message._id, reaction.emoji)}
                    title={`${reaction.count} reaction${reaction.count !== 1 ? 's' : ''} ${hasUserReacted ? '(You reacted)' : ''}`}
                  >
                    <span className="text-sm">{reaction.emoji}</span>
                    <span className="text-xs font-medium">{reaction.count}</span>
                  </button>
                );
              })}
            </div>
          )}
          
          {/* Thread Preview */}
          {message.threadReplies && message.threadReplies.length > 0 && (
            <ThreadPreview
              message={message}
              threadReplies={threadMessages[message._id] || []}
              onClick={() => onStartThread(message)}
            />
          )}
        </div>
        
        {/* Message Actions */}
        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
          <ThreadReplyButton
            message={message}
            onStartThread={onStartThread}
            replyCount={message.threadReplies?.length || 0}
          />
          
          <button
            className="btn btn-ghost btn-xs"
            onClick={() => onReact(message._id, '👍')}
            title="Quick react"
          >
            👍
          </button>
          
          {isMyMessage && (
            <div className="dropdown dropdown-end">
              <button className="btn btn-ghost btn-xs" tabIndex={0}>
                <MoreVertical className="w-3 h-3" />
              </button>
              <ul className="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-32">
                <li>
                  <button onClick={() => onEdit(message)} className="text-xs">
                    Edit
                  </button>
                </li>
                <li>
                  <button onClick={() => onDelete(message._id)} className="text-xs text-error">
                    Delete
                  </button>
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Main Group Chat Container
const GroupChatContainer = ({ group }) => {
  const {
    messages,
    getGroupMessages,
    loading,
    sendMessage,
  } = useChatStore();
  
  const { authUser } = useAuthStore();
  const { socket } = useSocketContext();
  
  const [showMembers, setShowMembers] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [activeThread, setActiveThread] = useState(null);
  const [threadMessages, setThreadMessages] = useState({});
  const [isTyping, setIsTyping] = useState(false);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  
  const messageEndRef = useRef(null);
  const messagesContainerRef = useRef(null);

  useEffect(() => {
    if (group?._id) {
      getGroupMessages(group._id);
    }
  }, [group?._id, getGroupMessages]);

  useEffect(() => {
    if (messageEndRef.current) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Socket event handlers
  useEffect(() => {
    if (!socket || !group?._id) return;

    // Join group room
    socket.emit('joinGroup', group._id);

    socket.on('groupTyping', ({ senderId, groupId }) => {
      if (groupId === group._id && senderId !== authUser._id) {
        setIsTyping(true);
      }
    });

    socket.on('groupStopTyping', ({ senderId, groupId }) => {
      if (groupId === group._id && senderId !== authUser._id) {
        setIsTyping(false);
      }
    });

    return () => {
      socket.emit('leaveGroup', group._id);
      socket.off('groupTyping');
      socket.off('groupStopTyping');
    };
  }, [socket, group?._id, authUser._id]);

  const handleStartThread = (message) => {
    setActiveThread(message);
    if (!threadMessages[message._id]) {
      fetchThreadReplies(message._id);
    }
  };
  
  const fetchThreadReplies = async (messageId) => {
    try {
      const response = await axiosInstance.get(`/messages/thread/${messageId}`);
      setThreadMessages(prev => ({
        ...prev,
        [messageId]: response.data.replies
      }));
    } catch (error) {
      console.error('Failed to fetch thread replies:', error);
    }
  };
  
  const closeThread = () => {
    setActiveThread(null);
  };

  const handleReactToMessage = async (messageId, emoji) => {
    try {
      const response = await axiosInstance.post(`/api/reactions/${messageId}`, {
        emoji: emoji
      });
      
      if (response.data.success) {
        // Update message reactions in store
        toast.success('Reaction added!');
      }
    } catch (error) {
      console.error('Error reacting to message:', error);
      toast.error('Failed to add reaction');
    }
  };

  const handleEditMessage = (message) => {
    // Implementation for editing messages
    console.log('Edit message:', message);
  };

  const handleDeleteMessage = async (messageId) => {
    if (!window.confirm('Are you sure you want to delete this message?')) return;
    
    try {
      await axiosInstance.delete(`/messages/${messageId}`);
      toast.success('Message deleted.');
    } catch (error) {
      toast.error('Failed to delete message.');
    }
  };

  const handleScroll = () => {
    if (messagesContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      setShowScrollToBottom(!isNearBottom);
    }
  };

  const scrollToBottom = () => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col overflow-auto bg-base-100">
        <GroupHeader group={group} />
        <MessageSkeleton />
        <EnhancedMessageInput />
      </div>
    );
  }

  if (!group) {
    return (
      <div className="flex-1 flex flex-col overflow-auto items-center justify-center text-base-content/60 bg-base-100">
        <div className="text-center space-y-4">
          <div className="text-6xl">👥</div>
          <h3 className="text-xl font-semibold">Select a Group</h3>
          <p>Choose a group to start messaging</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-auto bg-base-100 relative">
      {/* Group Header */}
      <GroupHeader 
        group={group}
        onShowMembers={() => setShowMembers(true)}
        onShowSettings={() => setShowSettings(true)}
        isTyping={isTyping}
      />

      {/* Messages Container */}
      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-2"
        onScroll={handleScroll}
      >
        {messages.map((message, index) => (
          <GroupMessage
            key={message._id}
            message={message}
            authUser={authUser}
            group={group}
            onReact={handleReactToMessage}
            onEdit={handleEditMessage}
            onDelete={handleDeleteMessage}
            onStartThread={handleStartThread}
            threadMessages={threadMessages}
          />
        ))}
        
        <div ref={messageEndRef}></div>
      </div>

      {/* Scroll to Bottom Button */}
      {showScrollToBottom && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-20 right-4 btn btn-circle btn-primary shadow-lg"
          title="Scroll to bottom"
        >
          <ArrowDown size={18} />
        </button>
      )}

      {/* Thread Panel */}
      {activeThread && (
        <MessageThread
          parentMessage={activeThread}
          threadReplies={threadMessages[activeThread._id] || []}
          onClose={closeThread}
          isOpen={true}
        />
      )}
      
      {/* Enhanced Message Input */}
      <EnhancedMessageInput groupId={group._id} />

      {/* Advanced Search Modal */}
      <AdvancedSearch
        isOpen={showAdvancedSearch}
        onClose={() => setShowAdvancedSearch(false)}
        selectedGroup={group}
      />
    </div>
  );
};

export default GroupChatContainer;