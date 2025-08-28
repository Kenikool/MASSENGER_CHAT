import { useChatStore } from "../store/useChatStore";
import { useEffect, useRef, useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { formatMessageTime } from "../lib/utils";
import { useSocketContext } from "../hooks/useSocketContext";
import axiosInstance from "../lib/axios";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { 
  MoreVertical, 
  Edit3, 
  Trash2, 
  Copy, 
  Reply, 
  Heart,
  ThumbsUp,
  Search,
  ArrowDown,
  User
} from "lucide-react";

import ChatHeader from "./ChatHeader";
import EnhancedMessageInput from "./EnhancedMessageInput";
import MessageSkeleton from "./skeletons/MessageSkeleton";
import MessageThread, { ThreadReplyButton, ThreadPreview } from "./MessageThread";
import AdvancedSearch from "./AdvancedSearch";
import { formatMessage } from "../lib/messageFormatter";

// Enhanced Image Viewer Modal
const EnhancedImageViewerModal = ({ images, initialIndex, onClose }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(initialIndex);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  useEffect(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, [currentImageIndex]);

  const handleWheel = (e) => {
    e.preventDefault();
    const newScale = e.deltaY > 0 ? scale * 0.9 : scale * 1.1;
    setScale(Math.max(1, Math.min(newScale, 4)));
  };

  const handleMouseDown = (e) => {
    if (scale > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseMove = (e) => {
    if (isDragging) {
      const dx = e.clientX - dragStart.x;
      const dy = e.clientY - dragStart.y;
      setPosition({
        x: position.x + dx / scale,
        y: position.y + dy / scale,
      });
      setDragStart({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleNext = (e) => {
    e.stopPropagation();
    if (currentImageIndex < images.length - 1) {
      setCurrentImageIndex(currentImageIndex + 1);
    }
  };

  const handlePrev = (e) => {
    e.stopPropagation();
    if (currentImageIndex > 0) {
      setCurrentImageIndex(currentImageIndex - 1);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90"
      onClick={onClose}
    >
      <div className="relative max-w-full max-h-full w-full h-full p-4 flex items-center justify-center">
        <img
          src={images[currentImageIndex]}
          alt="Zoomed view"
          className="max-w-full max-h-full object-contain"
          style={{
            transform: `scale(${scale}) translate(${position.x}px, ${position.y}px)`,
            cursor: scale > 1 ? (isDragging ? "grabbing" : "grab") : "pointer",
            transition: isDragging ? "none" : "transform 0.1s ease-out",
          }}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onClick={(e) => e.stopPropagation()}
        />

        {/* Navigation */}
        {images.length > 1 && (
          <>
            <button
              className="absolute left-4 p-3 rounded-full bg-black/50 text-white hover:bg-black/70 disabled:opacity-50"
              onClick={handlePrev}
              disabled={currentImageIndex === 0}
            >
              &#8249;
            </button>
            <button
              className="absolute right-4 p-3 rounded-full bg-black/50 text-white hover:bg-black/70 disabled:opacity-50"
              onClick={handleNext}
              disabled={currentImageIndex === images.length - 1}
            >
              &#8250;
            </button>
          </>
        )}

        {/* Close Button */}
        <button
          className="absolute top-4 right-4 text-white text-3xl font-bold p-2 hover:bg-black/50 rounded-full"
          onClick={onClose}
        >
          &times;
        </button>

        {/* Image Counter */}
        {images.length > 1 && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
            {currentImageIndex + 1} / {images.length}
          </div>
        )}
      </div>
    </div>
  );
};

// Enhanced Message Reactions Component
const MessageReactions = ({ message, onReact }) => {
  const [showReactions, setShowReactions] = useState(false);
  const [activeCategory, setActiveCategory] = useState('popular');
  
  // Enhanced reaction categories
  const reactionCategories = {
    popular: ['❤️', '👍', '👎', '😂', '😮', '😢', '😡', '🔥'],
    emotions: ['😂', '😢', '😡', '😍', '🤔', '😴', '🤯', '🥳'],
    approval: ['👍', '👎', '💯', '🔥', '👏', '🙌', '💪', '✨'],
    celebration: ['🎉', '🥳', '🎊', '🏆', '⭐', '💫', '🌟', '🎈'],
    objects: ['💖', '💝', '🎁', '🌹', '☕', '🍕', '🎵', '📱']
  };
  
  const categoryIcons = {
    popular: '⭐',
    emotions: '😊',
    approval: '👍',
    celebration: '🎉',
    objects: '💝'
  };

  return (
    <div className="relative">
      <button
        className="btn btn-ghost btn-xs opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110"
        onClick={() => setShowReactions(!showReactions)}
        title="Add reaction"
      >
        <span className="text-lg">😊</span>
      </button>
      
      {showReactions && (
        <div className="absolute bottom-full left-0 mb-2 bg-base-100 border border-base-300 rounded-xl p-3 shadow-xl z-20 min-w-80">
          {/* Category Tabs */}
          <div className="flex gap-1 mb-3 p-1 bg-base-200 rounded-lg">
            {Object.keys(reactionCategories).map((category) => (
              <button
                key={category}
                className={`btn btn-xs flex-1 ${
                  activeCategory === category 
                    ? 'btn-primary' 
                    : 'btn-ghost hover:btn-base-300'
                }`}
                onClick={() => setActiveCategory(category)}
                title={category.charAt(0).toUpperCase() + category.slice(1)}
              >
                <span className="text-sm">{categoryIcons[category]}</span>
              </button>
            ))}
          </div>
          
          {/* Reactions Grid */}
          <div className="grid grid-cols-4 gap-2">
            {reactionCategories[activeCategory].map((emoji) => (
              <button
                key={emoji}
                className="btn btn-ghost btn-sm aspect-square hover:bg-primary/20 hover:scale-110 transition-all duration-200"
                onClick={() => {
                  onReact(message._id, emoji);
                  setShowReactions(false);
                }}
                title={`React with ${emoji}`}
              >
                <span className="text-xl">{emoji}</span>
              </button>
            ))}
          </div>
          
          {/* Quick Actions */}
          <div className="flex justify-between items-center mt-3 pt-2 border-t border-base-300">
            <span className="text-xs text-base-content/60">
              {reactionCategories[activeCategory].length} reactions
            </span>
            <button
              className="btn btn-ghost btn-xs"
              onClick={() => setShowReactions(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Message Options Menu
const MessageOptionsMenu = ({ message, onEdit, onDelete, onCopy, isMyMessage }) => {
  const [showMenu, setShowMenu] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.text);
    toast.success('Message copied to clipboard');
    setShowMenu(false);
  };

  return (
    <div className="relative">
      <button
        className="btn btn-ghost btn-xs opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={() => setShowMenu(!showMenu)}
      >
        <MoreVertical size={14} />
      </button>
      
      {showMenu && (
        <div className="absolute top-full right-0 mt-1 bg-base-100 border border-base-300 rounded-lg shadow-lg z-10 min-w-32">
          <button
            className="w-full px-3 py-2 text-left hover:bg-base-200 flex items-center gap-2"
            onClick={handleCopy}
          >
            <Copy size={14} />
            Copy
          </button>
          
          {isMyMessage && (
            <>
              <button
                className="w-full px-3 py-2 text-left hover:bg-base-200 flex items-center gap-2"
                onClick={() => {
                  onEdit(message);
                  setShowMenu(false);
                }}
              >
                <Edit3 size={14} />
                Edit
              </button>
              <button
                className="w-full px-3 py-2 text-left hover:bg-base-200 text-error flex items-center gap-2"
                onClick={() => {
                  onDelete(message._id);
                  setShowMenu(false);
                }}
              >
                <Trash2 size={14} />
                Delete
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

// Typing Indicator Component
const TypingIndicator = ({ isTyping, userName }) => {
  if (!isTyping) return null;

  return (
    <div className="flex items-center gap-2 px-4 py-2 mb-4 text-sm text-base-content/70">
      <div className="flex gap-1">
        <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
        <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
        <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
      </div>
      <span>{userName} is typing...</span>
    </div>
  );
};

// Date Separator Component
const DateSeparator = ({ date }) => (
  <div className="divider text-xs text-base-content/50 my-4">
    {formatDateHeader(date)}
  </div>
);

// Helper function to format date headers
const formatDateHeader = (date) => {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const messageDate = new Date(date);

  const isToday = messageDate.toDateString() === today.toDateString();
  const isYesterday = messageDate.toDateString() === yesterday.toDateString();

  if (isToday) return "Today";
  if (isYesterday) return "Yesterday";

  return messageDate.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

// Helper function to check if date separator is needed
const shouldShowDateSeparator = (currentMessage, prevMessage) => {
  if (!prevMessage) return true;
  const currentDate = new Date(currentMessage.createdAt);
  const prevDate = new Date(prevMessage.createdAt);
  return currentDate.toDateString() !== prevDate.toDateString();
};

// Main Enhanced Chat Container
const EnhancedChatContainer = () => {
  const {
    messages,
    users,
    getMessages,
    loading,
    selectedUser,
    unsubscribeFromMessages,
    subscribeToMessages,
    markMessagesAsRead: markMessagesAsReadStore,
    markMessagesAsDelivered: markMessagesAsDeliveredStore,
    editMessageStore,
    deleteMessageStore,
  } = useChatStore();
  
  const { authUser } = useAuthStore();
  const navigate = useNavigate();
  const messageEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const { socket } = useSocketContext();
  
  // Thread management
  const handleStartThread = (message) => {
    setActiveThread(message);
    // Fetch thread replies if not already loaded
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

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedImages, setSelectedImages] = useState([]);
  const [initialImageIndex, setInitialImageIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editingMessageText, setEditingMessageText] = useState("");
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [activeThread, setActiveThread] = useState(null);
  const [threadMessages, setThreadMessages] = useState({});

  // Get all images for gallery view
  const allImages = messages.flatMap((message) => {
    if (Array.isArray(message.images)) {
      return message.images;
    } else if (message.image) {
      return [message.image];
    }
    return [];
  });

  // Handle image click
  const handleImageClick = (imageUrl) => {
    const initialIndex = allImages.indexOf(imageUrl);
    setSelectedImages(allImages);
    setInitialImageIndex(initialIndex);
    setIsModalOpen(true);
  };
  
  // Handle profile view
  const handleViewProfile = (userId, e) => {
    e.stopPropagation();
    if (userId && userId !== authUser._id) {
      navigate(`/profile/${userId}`);
    } else if (userId === authUser._id) {
      navigate('/profile');
    }
  };

  // Handle scroll to bottom visibility
  const handleScroll = () => {
    if (messagesContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      setShowScrollToBottom(!isNearBottom);
    }
  };

  // Scroll to bottom
  const scrollToBottom = () => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Filter messages based on search
  const filteredMessages = messages.filter(message =>
    !searchQuery || 
    message.text?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    message.senderId === authUser._id && "You".toLowerCase().includes(searchQuery.toLowerCase()) ||
    selectedUser?.fullName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    if (selectedUser?._id && socket) {
      console.log('💬 Loading messages for user:', selectedUser.fullName);
      getMessages(selectedUser._id);
      subscribeToMessages(socket);
      axiosInstance.put(`/messages/markAsRead/${selectedUser._id}`);
      return () => {
        console.log('💬 Unsubscribing from messages for:', selectedUser.fullName);
        unsubscribeFromMessages(socket);
      };
    }
  }, [selectedUser, socket, getMessages, subscribeToMessages, unsubscribeFromMessages]);

  useEffect(() => {
    if (!socket) return;

    socket.on("typing", (senderId) => {
      if (senderId === selectedUser?._id) {
        setIsTyping(true);
      }
    });

    socket.on("stopTyping", (senderId) => {
      if (senderId === selectedUser?._id) {
        setIsTyping(false);
      }
    });

    socket.on("messagesRead", ({ senderId, messageIds }) => {
      if (senderId === selectedUser?._id) {
        markMessagesAsReadStore(messageIds);
      }
    });

    socket.on("messageDelivered", ({ messageId, receiverId }) => {
      if (receiverId === authUser?._id) {
        markMessagesAsDeliveredStore(messageId);
      }
    });

    socket.on("messageUpdated", (updatedMessage) => {
      editMessageStore(updatedMessage);
    });
    
    socket.on("messageReaction", (reactionData) => {
      console.log('Received reaction update:', reactionData);
      const { messageId, reactions } = reactionData;
      const updatedMessage = {
        ...messages.find(m => m._id === messageId),
        reactions: reactions
      };
      editMessageStore(updatedMessage);
    });
    
    socket.on("messageConfirmation", (confirmationData) => {
      console.log('📡 Received message confirmation:', confirmationData);
      const { messageId, status } = confirmationData;
      const updatedMessage = {
        ...messages.find(m => m._id === messageId),
        status: status
      };
      editMessageStore(updatedMessage);
    });
    
    socket.on("testConnectionResponse", (response) => {
      console.log('🧪 Socket test response:', response);
      toast.success('Socket connection test successful!');
    });

    return () => {
      socket.off("typing");
      socket.off("stopTyping");
      socket.off("messagesRead");
      socket.off("messageDelivered");
      socket.off("messageUpdated");
      socket.off("messageReaction");
      socket.off("messageConfirmation");
      socket.off("testConnectionResponse");
    };
  }, [socket, selectedUser?._id, authUser?._id, markMessagesAsReadStore, markMessagesAsDeliveredStore, editMessageStore]);

  useEffect(() => {
    if (messageEndRef.current && messages && messages.length > 0) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Message actions
  const handleEditMessage = (message) => {
    setEditingMessageId(message._id);
    setEditingMessageText(message.text);
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditingMessageText("");
  };

  const handleSaveEdit = async (messageId) => {
    if (!editingMessageText.trim()) {
      toast.error("Message cannot be empty.");
      return;
    }
    try {
      const res = await axiosInstance.put(`/messages/${messageId}`, {
        text: editingMessageText,
      });
      editMessageStore(res.data);
      setEditingMessageId(null);
      setEditingMessageText("");
      toast.success("Message updated");
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to edit message.");
    }
  };

  const handleDeleteMessage = async (messageId) => {
    if (!window.confirm("Are you sure you want to delete this message?")) return;
    try {
      await axiosInstance.delete(`/messages/${messageId}`);
      deleteMessageStore(messageId);
      toast.success("Message deleted.");
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to delete message.");
    }
  };

  const handleReactToMessage = async (messageId, emoji) => {
    try {
      console.log('Adding reaction:', { messageId, emoji });
      const response = await axiosInstance.post(`/reactions/${messageId}`, {
        emoji: emoji
      });
      
      if (response.data.success) {
        // Update the message in the store with new reactions
        const updatedMessage = {
          ...messages.find(m => m._id === messageId),
          reactions: response.data.reactions
        };
        editMessageStore(updatedMessage);
        toast.success('Reaction added!');
      }
    } catch (error) {
      console.error('Error reacting to message:', error);
      toast.error('Failed to add reaction');
    }
  };
  
  // Test socket connection
  const testSocketConnection = () => {
    if (socket) {
      console.log('🧪 Testing socket connection...');
      socket.emit('testConnection', {
        message: 'Test from frontend',
        userId: authUser._id,
        selectedUser: selectedUser?._id,
        timestamp: new Date().toISOString()
      });
    } else {
      toast.error('Socket not connected');
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col overflow-auto bg-base-100">
        <ChatHeader />
        <MessageSkeleton />
        <EnhancedMessageInput />
      </div>
    );
  }

  if (!selectedUser) {
    return (
      <div className="flex-1 flex flex-col overflow-auto items-center justify-center text-base-content/60 bg-base-100">
        <div className="text-center space-y-4">
          <div className="text-6xl">💬</div>
          <h3 className="text-xl font-semibold">Welcome to Chat</h3>
          <p>Select a conversation to start messaging</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-auto bg-base-100 relative">
      {/* Enhanced Chat Header */}
      <div className="relative">
        <ChatHeader isTyping={isTyping} />
        
        {/* Debug Socket Test Button - Remove in production */}
        {process.env.NODE_ENV === 'development' && (
          <div className="absolute top-2 right-2">
            <button
              onClick={testSocketConnection}
              className="btn btn-xs btn-outline btn-info"
              title="Test Socket Connection"
            >
              🧪 Test Socket
            </button>
          </div>
        )}
        
        {/* Search Bar */}
        {showSearch && (
          <div className="p-3 border-b border-base-300">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-base-content/40" size={16} />
                <input
                  type="text"
                  placeholder="Quick search messages..."
                  className="input input-bordered w-full pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <button
                onClick={() => setShowAdvancedSearch(true)}
                className="btn btn-outline btn-sm"
                title="Advanced Search"
              >
                <Search size={16} />
                Advanced
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Messages Container */}
      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-2 max-w-full bg-base-50"
        onScroll={handleScroll}
      >
        {filteredMessages.map((message, index) => {
          const prevMessage = filteredMessages[index - 1];
          const messageImages =
            Array.isArray(message.images) && message.images.length > 0
              ? message.images
              : message.image
              ? [message.image]
              : [];

          const isMyMessage = message.senderId === authUser._id;
          const isEditing = editingMessageId === message._id;

          return (
            <div key={message._id}>
              {/* Date Separator */}
              {shouldShowDateSeparator(message, prevMessage) && (
                <DateSeparator date={message.createdAt} />
              )}

              <div className={`chat ${isMyMessage ? "chat-end" : "chat-start"} group w-full mb-4`}>
                {/* Avatar */}
                <div className="chat-image avatar">
                  <div className="relative size-10 rounded-full border border-base-content/10 cursor-pointer group/avatar"
                       onClick={(e) => handleViewProfile(isMyMessage ? authUser._id : selectedUser._id, e)}
                       title={`View ${isMyMessage ? 'your' : selectedUser?.fullName + "'s"} profile`}
                  >
                    <img
                      src={
                        isMyMessage
                          ? authUser.profilePic || "/avatar.png"
                          : selectedUser.profilePic || "/avatar.png"
                      }
                      alt="profile pic"
                      className="w-full h-full object-cover rounded-full hover:opacity-80 transition-opacity"
                    />
                    {/* Profile view overlay */}
                    <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity">
                      <User size={16} className="text-white" />
                    </div>
                  </div>
                </div>

                {/* Message Header */}
                <div className="chat-header mb-1 text-xs text-base-content/70 font-medium flex items-center gap-2">
                  <time className="text-xs opacity-80">
                    {formatMessageTime(message.createdAt)}
                  </time>
                  {message.isEdited && (
                    <span className="text-[10px] opacity-60">(Edited)</span>
                  )}
                </div>

                {/* Message Bubble */}
                <div className={`chat-bubble flex flex-col max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg rounded-lg p-3 relative break-words ${
                  isEditing ? "bg-warning/20 border-2 border-warning" : 
                  isMyMessage ? "chat-bubble-primary" : "chat-bubble-secondary"
                }`}>
                  {message.isDeleted ? (
                    <p className="italic text-sm text-base-content/60">
                      This message was deleted.
                    </p>
                  ) : isEditing ? (
                    <div className="flex flex-col gap-3 bg-warning/10 p-3 rounded-lg border border-warning/30">
                      <div className="flex items-center gap-2 text-warning font-medium text-sm">
                        <Edit3 size={14} />
                        Editing message
                      </div>
                      <textarea
                        className="textarea textarea-warning textarea-sm w-full resize-none focus:border-warning focus:outline-warning"
                        value={editingMessageText}
                        onChange={(e) => setEditingMessageText(e.target.value)}
                        rows={3}
                        placeholder="Edit your message..."
                        autoFocus
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          className="btn btn-ghost btn-xs hover:bg-error/20 hover:text-error"
                          onClick={handleCancelEdit}
                        >
                          Cancel
                        </button>
                        <button
                          className="btn btn-warning btn-xs text-warning-content"
                          onClick={() => handleSaveEdit(message._id)}
                          disabled={!editingMessageText.trim()}
                        >
                          Save Changes
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Images */}
                      {messageImages.length > 0 && (
                        <div className={`flex flex-wrap gap-2 ${message.text ? "mb-2" : ""}`}>
                          {messageImages.map((image, imageIndex) => (
                            <img
                              key={imageIndex}
                              src={image}
                              alt="Attachment"
                              className="max-w-[200px] rounded-md cursor-pointer transition-transform duration-300 ease-in-out hover:scale-105 border border-base-content/10"
                              onClick={() => handleImageClick(image)}
                            />
                          ))}
                        </div>
                      )}

                      {/* Voice Message */}
                      {message.voiceUrl && (
                        <div className={`flex items-center gap-3 p-3 bg-base-200/40 border border-base-300/50 rounded-lg shadow-sm ${message.text ? "mb-2" : ""}`}>
                          <div className="flex items-center gap-3 flex-1">
                            <div className="w-9 h-9 bg-primary/20 rounded-full flex items-center justify-center">
                              <svg className="w-4 h-4 text-primary" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M7 4a3 3 0 0 1 6 0v4a3 3 0 0 1-6 0V4zm4 10.93A7.001 7.001 0 0 0 17 8a1 1 0 1 0-2 0A5 5 0 0 1 5 8a1 1 0 0 0-2 0 7.001 7.001 0 0 0 6 6.93V17H6a1 1 0 1 0 0 2h8a1 1 0 1 0 0-2h-3v-2.07z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-sm font-medium text-base-content">Voice Message</span>
                                {message.voiceDuration && (
                                  <span className="text-xs text-base-content/60 bg-base-300/60 px-2 py-1 rounded-full">
                                    {Math.floor(message.voiceDuration / 60)}:{(message.voiceDuration % 60).toString().padStart(2, '0')}
                                  </span>
                                )}
                              </div>
                              <div className="bg-base-100/60 p-2 rounded-md border border-base-300/40">
                                <audio 
                                  controls 
                                  src={message.voiceUrl} 
                                  className="w-full h-8 rounded-sm"
                                  style={{ 
                                    maxWidth: '260px'
                                  }}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Text with Formatting Support */}
                      {message.text && (
                        <div className="text-sm break-words">
                          {message.hasFormatting ? (
                            <div 
                              className="prose prose-sm max-w-none"
                              dangerouslySetInnerHTML={{ 
                                __html: formatMessage(message.text, users || []) 
                              }}
                            />
                          ) : (
                            <p className="whitespace-pre-wrap">{message.text}</p>
                          )}
                        </div>
                      )}

                      {/* Enhanced Message Reactions Display */}
                      {message.reactions && message.reactions.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-3">
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
                                onClick={() => handleReactToMessage(message._id, reaction.emoji)}
                                title={`${reaction.count} reaction${reaction.count !== 1 ? 's' : ''} ${hasUserReacted ? '(You reacted)' : ''}`}
                              >
                                <span className="text-sm">{reaction.emoji}</span>
                                <span className="text-xs font-medium">{reaction.count}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {/* Message Actions */}
                      <div className="absolute -top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <ThreadReplyButton
                          message={message}
                          onStartThread={handleStartThread}
                          replyCount={message.threadReplies?.length || 0}
                        />
                        <MessageReactions 
                          message={message} 
                          onReact={handleReactToMessage} 
                        />
                        <MessageOptionsMenu
                          message={message}
                          onEdit={handleEditMessage}
                          onDelete={handleDeleteMessage}
                          isMyMessage={isMyMessage}
                        />
                      </div>
                      
                      {/* Thread Preview */}
                      {message.threadReplies && message.threadReplies.length > 0 && (
                        <ThreadPreview
                          message={message}
                          threadReplies={threadMessages[message._id] || []}
                          onClick={() => handleStartThread(message)}
                        />
                      )}
                    </>
                  )}
                </div>

                {/* Message Status */}
                {isMyMessage && !message.isDeleted && (
                  <div className="chat-footer opacity-50 text-xs flex gap-1 items-center mt-1">
                    {message.status === "sending" && (
                      <span title="Sending" className="text-warning flex items-center gap-1">
                        <span className="loading loading-spinner loading-xs"></span>
                        Sending...
                      </span>
                    )}
                    {message.status === "sent" && (
                      <span title="Sent" className="text-base-content/60">✓</span>
                    )}
                    {message.status === "delivered" && (
                      <span title="Delivered" className="text-base-content/80">✓✓</span>
                    )}
                    {message.status === "read" && (
                      <span title="Read" className="text-primary">✓✓</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Typing Indicator */}
        <TypingIndicator isTyping={isTyping} userName={selectedUser?.fullName} />

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
      <EnhancedMessageInput />

      {/* Advanced Search Modal */}
      <AdvancedSearch
        isOpen={showAdvancedSearch}
        onClose={() => setShowAdvancedSearch(false)}
        selectedUser={selectedUser}
      />
      
      {/* Image Viewer Modal */}
      {isModalOpen && (
        <EnhancedImageViewerModal
          images={selectedImages}
          initialIndex={initialImageIndex}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
};

export default EnhancedChatContainer;