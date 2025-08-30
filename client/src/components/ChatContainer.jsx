import { useChatStore } from "../store/useChatStore";
import { useEffect, useRef, useState } from "react";
import { useAuthStore } from "../store/useAuthStore"; // Corrected import
import { formatMessageTime } from "../lib/utils";
import { useSocketContext } from "../hooks/useSocketContext";
import axiosInstance from "../lib/axios";
import toast from "react-hot-toast"; // Import toast

import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import MessageSkeleton from "./skeletons/MessageSkeleton";

// --- ImageViewerModal with Touch Support and Gallery ---
const ImageViewerModal = ({ images, initialIndex, onClose }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(initialIndex);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [touchStartDistance, setTouchStartDistance] = useState(null);

  // Reset zoom and position when image changes
  useEffect(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, [currentImageIndex]);

  // Desktop Mouse Events
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

  // Mobile Touch Events
  const getDistance = (touches) => {
    if (touches.length < 2) return null;
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const handleTouchStart = (e) => {
    if (e.touches.length === 2) {
      setTouchStartDistance(getDistance(e.touches));
    } else if (e.touches.length === 1 && scale > 1) {
      setIsDragging(true);
      setDragStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
    }
  };

  const handleTouchMove = (e) => {
    if (e.touches.length === 2 && touchStartDistance !== null) {
      const newDistance = getDistance(e.touches);
      const newScale = scale * (newDistance / touchStartDistance);
      setScale(Math.max(1, Math.min(newScale, 4)));
      setTouchStartDistance(newDistance);
    } else if (e.touches.length === 1 && isDragging) {
      const dx = e.touches[0].clientX - dragStart.x;
      const dy = e.touches[0].clientY - dragStart.y;
      setPosition({
        x: position.x + dx / scale,
        y: position.y + dy / scale,
      });
      setDragStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
    }
  };

  const handleTouchEnd = () => {
    setTouchStartDistance(null);
    setIsDragging(false);
  };

  // Gallery Navigation
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
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 cursor-default"
      onClick={onClose}
    >
      <div className="relative max-w-full max-h-full w-full h-full p-4 flex items-center justify-center">
        <img
          src={images[currentImageIndex]}
          alt="Zoomed-in message content"
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
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onClick={(e) => e.stopPropagation()}
        />

        {images.length > 1 && (
          <>
            <button
              className="absolute left-4 p-2 rounded-full bg-white/20 text-white text-3xl font-bold hover:bg-white/40 z-10 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handlePrev}
              disabled={currentImageIndex === 0}
            >
              &#8249;
            </button>
            <button
              className="absolute right-4 p-2 rounded-full bg-white/20 text-white text-3xl font-bold hover:bg-white/40 z-10 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleNext}
              disabled={currentImageIndex === images.length - 1}
            >
              &#8250;
            </button>
          </>
        )}
        <button
          className="absolute top-4 right-4 text-white text-3xl font-bold p-2 z-10"
          onClick={onClose}
        >
          &times;
        </button>
      </div>
    </div>
  );
};
// -------------------------------------

// New helper function to format the date header
const formatDateHeader = (date) => {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const messageDate = new Date(date);

  const isToday =
    messageDate.getDate() === today.getDate() &&
    messageDate.getMonth() === today.getMonth() &&
    messageDate.getFullYear() === today.getFullYear();
  const isYesterday =
    messageDate.getDate() === yesterday.getDate() &&
    messageDate.getMonth() === yesterday.getMonth() &&
    messageDate.getFullYear() === yesterday.getFullYear();

  if (isToday) return "Today";
  if (isYesterday) return "Yesterday";

  return messageDate.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

// New helper function to check if a date separator is needed
const shouldShowDateSeparator = (currentMessage, prevMessage) => {
  if (!prevMessage) return true;
  const currentDate = new Date(currentMessage.createdAt);
  const prevDate = new Date(prevMessage.createdAt);
  return currentDate.toDateString() !== prevDate.toDateString();
};

const ChatContainer = () => {
  const {
    messages,
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
  const messageEndRef = useRef(null);
  const { socket } = useSocketContext();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedImages, setSelectedImages] = useState([]);
  const [initialImageIndex, setInitialImageIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editingMessageText, setEditingMessageText] = useState("");

  // New helper function to format the time for audio messages
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes < 10 ? "0" : ""}${minutes}:${
      remainingSeconds < 10 ? "0" : ""
    }${remainingSeconds}`;
  };

  // New useEffect to create a single array of all images
  const allImages = messages.flatMap((message) => {
    if (Array.isArray(message.images)) {
      return message.images;
    } else if (message.image) {
      return [message.image];
    }
    return [];
  });

  const handleImageClick = (imageUrl) => {
    const initialIndex = allImages.indexOf(imageUrl);
    setSelectedImages(allImages);
    setInitialImageIndex(initialIndex);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedImages([]);
    setInitialImageIndex(0);
  };

  useEffect(() => {
    if (selectedUser?._id) {
      console.log(
        "ChatContainer: Fetching messages and subscribing to socket for",
        selectedUser._id
      );
      getMessages(selectedUser._id);
      subscribeToMessages();

      // Mark messages as read when the chat is opened/focused
      axiosInstance
        .put(`/messages/markAsRead/${selectedUser._id}`)
        .catch((error) => {
          console.error("Error marking messages as read:", error);
        });

      return () => {
        console.log("ChatContainer: Unsubscribing from messages");
        unsubscribeFromMessages();
      };
    }
  }, [selectedUser, getMessages, subscribeToMessages, unsubscribeFromMessages]);

  useEffect(() => {
    if (!socket) return;
    console.log("ChatContainer: Setting up socket listeners.");

    socket.on("typing", (senderId) => {
      console.log("ChatContainer: Received typing event from", senderId);
      if (senderId === selectedUser?._id) {
        setIsTyping(true);
      }
    });

    socket.on("stopTyping", (senderId) => {
      console.log("ChatContainer: Received stopTyping event from", senderId);
      if (senderId === selectedUser?._id) {
        setIsTyping(false);
      }
    });

    socket.on("messagesRead", ({ senderId, messageIds }) => {
      console.log("ChatContainer: Received messagesRead event", {
        senderId,
        messageIds,
      });
      if (senderId === selectedUser?._id) {
        markMessagesAsReadStore(messageIds);
      }
    });

    socket.on("messageDelivered", ({ messageId, receiverId }) => {
      console.log("ChatContainer: Received messageDelivered event", {
        messageId,
        receiverId,
      });
      // This event is emitted by the server to the sender when their message is delivered.
      if (receiverId === authUser?._id) {
        markMessagesAsDeliveredStore(messageId);
      }
    });

    socket.on("messageUpdated", (updatedMessage) => {
      console.log(
        "ChatContainer: Received messageUpdated event",
        updatedMessage
      );
      // If a message is edited or deleted, update it in the store
      editMessageStore(updatedMessage);
    });

    // Add listener for new group messages
    socket.on("newGroupMessage", (newMessage) => {
      console.log("ChatContainer: Received newGroupMessage event:", newMessage);
      // Implement group message handling in ChatContainer if needed,
      // though useChatStore should handle adding it to the messages array.
    });

    return () => {
      console.log("ChatContainer: Cleaning up socket listeners.");
      socket.off("typing");
      socket.off("stopTyping");
      socket.off("messagesRead");
      socket.off("messageDelivered");
      socket.off("messageUpdated");
      socket.off("newGroupMessage");
    };
  }, [
    socket,
    selectedUser?._id,
    authUser?._id,
    markMessagesAsReadStore,
    markMessagesAsDeliveredStore,
    editMessageStore,
  ]);

  useEffect(() => {
    if (messageEndRef.current && messages && messages.length > 0) {
      console.log("ChatContainer: Scrolling to end of messages.");
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

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
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to edit message.");
    }
  };

  const handleDeleteMessage = async (messageId) => {
    if (!window.confirm("Are you sure you want to delete this message?"))
      return;
    try {
      await axiosInstance.delete(`/messages/${messageId}`);
      deleteMessageStore(messageId);
      toast.success("Message deleted.");
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to delete message.");
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col overflow-auto bg-base-100">
        <ChatHeader />
        <MessageSkeleton />
        <MessageInput />
      </div>
    );
  }

  if (!selectedUser) {
    return (
      <div className="flex-1 flex flex-col overflow-auto items-center justify-center text-gray-500">
        <p>Please select a user to start a conversation.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-auto bg-base-100">
      <ChatHeader isTyping={isTyping} />
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => {
          const prevMessage = messages[index - 1];
          const messageImages =
            Array.isArray(message.images) && message.images.length > 0
              ? message.images
              : message.image
              ? [message.image]
              : [];

          const isMyMessage = message.senderId === authUser._id;
          const isEditing = editingMessageId === message._id;

          console.log(
            `Message ID: ${message._id}, Sender ID: ${message.senderId}, Auth User ID: ${authUser._id}, isMyMessage: ${isMyMessage}`
          );

          return (
            <div key={message._id}>
              {/* Date Separator */}
              {shouldShowDateSeparator(message, prevMessage) && (
                <div className="divider text-xs text-base-content opacity-50 my-4">
                  {formatDateHeader(message.createdAt)}
                </div>
              )}

              <div
                className={`chat ${isMyMessage ? "chat-end" : "chat-start"}`}
              >
                <div className="chat-image avatar">
                  <div className="size-10 rounded-full border border-base-content/10">
                    <img
                      src={
                        isMyMessage
                          ? authUser.profilePic || "/avatar.png"
                          : selectedUser.profilePic || "/avatar.png"
                      }
                      alt="profile pic"
                    />
                  </div>
                </div>
                <div className="chat-header mb-1 text-xs text-base-content opacity-70 font-medium">
                  <time className="text-xs opacity-80">
                    {formatMessageTime(message.createdAt)}
                  </time>
                  {message.isEdited && (
                    <span className="ml-1 text-[10px]">(Edited)</span>
                  )}
                </div>
                <div
                  className={`chat-bubble flex flex-col max-w-sm rounded-lg p-3 ${
                    isMyMessage ? "chat-bubble-primary" : ""
                  }`}
                >
                  {message.isDeleted ? (
                    <p className="italic text-sm text-base-content/60">
                      This message was deleted.
                    </p>
                  ) : isEditing ? (
                    <div className="flex flex-col gap-2">
                      <input
                        type="text"
                        className="input input-bordered input-sm w-full"
                        value={editingMessageText}
                        onChange={(e) => setEditingMessageText(e.target.value)}
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={handleCancelEdit}
                        >
                          Cancel
                        </button>
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => handleSaveEdit(message._id)}
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Image Display - handles both single image and array */}
                      {messageImages.length > 0 && (
                        <div
                          className={`flex flex-wrap gap-2 ${
                            message.text ? "mb-2" : ""
                          }`}
                        >
                          {messageImages.map((image, imageIndex) => (
                            <img
                              key={imageIndex}
                              src={image}
                              alt="Attachment"
                              className="max-w-[150px] rounded-md cursor-pointer transition-transform duration-300 ease-in-out hover:scale-105"
                              onClick={() => handleImageClick(image)}
                            />
                          ))}
                        </div>
                      )}

                      {message.voiceUrl && (
                        <div className="flex items-center gap-2 bg-base-300 rounded-lg p-2">
                          <audio
                            src={message.voiceUrl}
                            controls
                            className="w-48"
                          ></audio>
                          {message.voiceDuration && (
                            <span className="text-xs text-base-content/60">
                              {formatTime(message.voiceDuration)}
                            </span>
                          )}
                        </div>
                      )}

                      {message.text && (
                        <p className="text-sm">{message.text}</p>
                      )}
                      {isMyMessage && (
                        <div className="flex justify-end gap-2 mt-2">
                          <button
                            className="btn btn-ghost btn-xs"
                            onClick={() => handleEditMessage(message)}
                          >
                            Edit
                          </button>
                          <button
                            className="btn btn-ghost btn-xs text-error"
                            onClick={() => handleDeleteMessage(message._id)}
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
                {isMyMessage && ( // Only show status for messages sent by the current user
                  <div className="chat-footer opacity-50 text-xs flex gap-1 items-center">
                    {message.status === "sent" && (
                      <span title="Sent">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="lucide lucide-check"
                        >
                          <path d="M20 6 9 17l-5-5" />
                        </svg>
                      </span>
                    )}
                    {message.status === "delivered" && (
                      <span title="Delivered">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="lucide lucide-check-check"
                        >
                          <path d="M16 11L20 7L23 10L16 17L11 12" />
                          <path d="M2 11L7 16L12 11" />
                        </svg>
                      </span>
                    )}
                    {message.status === "read" && (
                      <span title="Read" className="text-blue-500">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="lucide lucide-check-check"
                        >
                          <path d="M16 11L20 7L23 10L16 17L11 12" />
                          <path d="M2 11L7 16L12 11" />
                        </svg>
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
        <div ref={messageEndRef}></div>
      </div>
      <MessageInput />
      {isModalOpen && (
        <ImageViewerModal
          images={selectedImages}
          initialIndex={initialImageIndex}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
};

export default ChatContainer;
