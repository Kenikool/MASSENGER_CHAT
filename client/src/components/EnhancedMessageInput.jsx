import { useRef, useState, useEffect } from "react";
import { useChatStore } from "../store/useChatStore";
import { Image, Send, X, Download, Smile, Paperclip, Mic, Type } from "lucide-react";
import toast from "react-hot-toast";
import { useSocketContext } from "../hooks/useSocketContext";
import { useAuthStore } from "../store/useAuthStore";
import axiosInstance from "../lib/axios";
import EmojiPicker from "./EmojiPicker";
import VoiceService from "../services/voiceService";
import FormattingToolbar from "./FormattingToolbar";
import { formatMessage, hasFormatting } from "../lib/messageFormatter";

const EnhancedMessageInput = () => {
  const [text, setText] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isSending, setIsSending] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [smartReplies, setSmartReplies] = useState([]);
  const [showSmartReplies, setShowSmartReplies] = useState(false);
  const [voiceBlob, setVoiceBlob] = useState(null);
  const [voiceUrl, setVoiceUrl] = useState(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [showFormattingToolbar, setShowFormattingToolbar] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  
  const fileInputRef = useRef(null);
  const textInputRef = useRef(null);
  const voiceServiceRef = useRef(null);
  const recordingTimerRef = useRef(null);
  const autoStopTimeoutRef = useRef(null);
  const recordingStartTimeRef = useRef(null);
  const { sendMessage, selectedUser, users } = useChatStore();
  const { socket } = useSocketContext();
  const { authUser } = useAuthStore();
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    return () => {
      // Cleanup typing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        if (socket && selectedUser && authUser && isTyping) {
          socket.emit("stopTyping", {
            receiverId: selectedUser._id,
            senderId: authUser._id,
          });
        }
      }
      
      // Cleanup voice recording
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
      
      if (autoStopTimeoutRef.current) {
        clearTimeout(autoStopTimeoutRef.current);
      }
      
      if (voiceServiceRef.current && isRecording) {
        voiceServiceRef.current.cancelRecording();
      }
      
      if (voiceUrl) {
        URL.revokeObjectURL(voiceUrl);
      }
    };
  }, [socket, selectedUser, authUser, isTyping, isRecording, voiceUrl]);

  const handleTextChange = (e) => {
    setText(e.target.value);
    
    // Handle typing indicators
    if (socket && selectedUser && authUser) {
      if (!isTyping) {
        setIsTyping(true);
        socket.emit("typing", {
          receiverId: selectedUser._id,
          senderId: authUser._id,
        });
      }
      
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
        socket.emit("stopTyping", {
          receiverId: selectedUser._id,
          senderId: authUser._id,
        });
      }, 1000);
    }
  };

  // Generate smart replies when receiving messages
  const generateSmartReplies = async (lastMessage) => {
    try {
      const response = await axiosInstance.post('/api/ai/smart-replies', {
        message: lastMessage,
        context: [] // You can add conversation context here
      });
      
      if (response.data.suggestions && response.data.suggestions.length > 0) {
        setSmartReplies(response.data.suggestions);
        setShowSmartReplies(true);
      }
    } catch (error) {
      console.error('Error generating smart replies:', error);
      // Fallback replies
      setSmartReplies(['Thanks!', 'Got it!', 'Sounds good!']);
      setShowSmartReplies(true);
    }
  };

  // Handle smart reply selection
  const handleSmartReplySelect = (reply) => {
    setText(reply);
    setShowSmartReplies(false);
    // Auto-focus the input
    if (textInputRef.current) {
      textInputRef.current.focus();
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file || !file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size must be less than 10MB");
      return;
    }

    const reader = new FileReader();
    reader.onloadstart = () => {
      setUploadProgress(0);
    };
    reader.onloadend = () => {
      setImagePreview(reader.result);
      setUploadProgress(0);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImagePreview(null);
    setUploadProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDownload = (e) => {
    e.preventDefault();
    if (!imagePreview) return;

    const link = document.createElement("a");
    link.href = imagePreview;
    link.download = `chat-image-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleEmojiSelect = (emoji) => {
    const input = textInputRef.current;
    if (input) {
      const start = input.selectionStart;
      const end = input.selectionEnd;
      const newText = text.slice(0, start) + emoji + text.slice(end);
      setText(newText);
      
      // Set cursor position after emoji
      setTimeout(() => {
        input.setSelectionRange(start + emoji.length, start + emoji.length);
        input.focus();
      }, 0);
    } else {
      setText(text + emoji);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!text.trim() && !imagePreview) return;
    
    setIsSending(true);

    try {
      // Check if message has formatting
      const messageHasFormatting = hasFormatting(text.trim());
      
      await sendMessage({
        text: text.trim(),
        image: imagePreview,
        hasFormatting: messageHasFormatting,
        onUploadProgress: setUploadProgress,
      });

      setText("");
      setImagePreview(null);
      setUploadProgress(0);
      setShowPreview(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
      
      // Focus back to input
      if (textInputRef.current) {
        textInputRef.current.focus();
      }
    } catch (error) {
      console.error("Failed to send message:", error);
      toast.error("Failed to send message. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  const handleVoiceRecord = async () => {
    try {
      if (!isRecording) {
        // Check browser support
        if (!VoiceService.isSupported()) {
          toast.error('Voice recording is not supported in your browser');
          return;
        }
        
        // Clear any existing timers first
        if (recordingTimerRef.current) {
          clearInterval(recordingTimerRef.current);
          recordingTimerRef.current = null;
        }
        
        // Initialize voice service
        voiceServiceRef.current = new VoiceService();
        
        // Start recording
        await voiceServiceRef.current.startRecording();
        setIsRecording(true);
        setRecordingDuration(0);
        recordingStartTimeRef.current = Date.now();
        toast.success('Recording started');
        
        console.log('🎤 Starting voice recording timer...');
        
        // Use a more reliable timer approach with forced re-renders
        recordingTimerRef.current = setInterval(() => {
          // Force component re-render by updating duration based on elapsed time
          const elapsed = Math.floor((Date.now() - recordingStartTimeRef.current) / 1000);
          console.log(`🕐 Timer tick: ${elapsed}s`);
          
          setRecordingDuration(elapsed);
          
          // Auto-stop after 60 seconds
          if (elapsed >= 60) {
            console.log('⏰ Auto-stopping recording at 60 seconds');
            handleStopRecording();
          }
        }, 1000);
        
        // Backup auto-stop timeout
        autoStopTimeoutRef.current = setTimeout(() => {
          console.log('🚨 Backup timeout triggered');
          handleStopRecording();
        }, 61000);
      } else {
        handleStopRecording();
      }
    } catch (error) {
      console.error('❌ Voice recording error:', error);
      toast.error(error.message || 'Failed to start voice recording');
      setIsRecording(false);
      setRecordingDuration(0);
      
      // Clean up on error
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
    }
  };

  const handleStopRecording = async () => {
    try {
      if (voiceServiceRef.current && isRecording) {
        const result = await voiceServiceRef.current.stopRecording();
        
        setIsRecording(false);
        setVoiceBlob(result.blob);
        setVoiceUrl(result.url);
        
        // Clear all timers
        if (recordingTimerRef.current) {
          clearInterval(recordingTimerRef.current);
          recordingTimerRef.current = null;
        }
        
        if (autoStopTimeoutRef.current) {
          clearTimeout(autoStopTimeoutRef.current);
          autoStopTimeoutRef.current = null;
        }
        
        recordingStartTimeRef.current = null;
        
        // Use the current duration from state, not from VoiceService
        toast.success(`Recording completed (${recordingDuration}s)`);
      }
    } catch (error) {
      console.error('Error stopping recording:', error);
      toast.error('Failed to stop recording');
      setIsRecording(false);
      setRecordingDuration(0);
      
      // Clear timers on error too
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
      
      if (autoStopTimeoutRef.current) {
        clearTimeout(autoStopTimeoutRef.current);
        autoStopTimeoutRef.current = null;
      }
      
      recordingStartTimeRef.current = null;
    }
  };

  const handleCancelVoiceRecording = () => {
    if (voiceServiceRef.current) {
      voiceServiceRef.current.cancelRecording();
    }
    
    setIsRecording(false);
    setVoiceBlob(null);
    setVoiceUrl(null);
    setRecordingDuration(0);
    
    // Clear all timers
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    
    if (autoStopTimeoutRef.current) {
      clearTimeout(autoStopTimeoutRef.current);
      autoStopTimeoutRef.current = null;
    }
    
    recordingStartTimeRef.current = null;
    
    if (voiceUrl) {
      URL.revokeObjectURL(voiceUrl);
    }
    
    toast.info('Recording cancelled');
  };

  const handleSendVoiceMessage = async () => {
    if (!voiceBlob) return;
    
    try {
      setIsSending(true);
      
      // Convert blob to base64 for upload
      const base64Audio = await voiceServiceRef.current.blobToBase64(voiceBlob);
      
      // Send voice message
      await sendMessage({
        voiceMessage: base64Audio,
        voiceDuration: recordingDuration,
        onUploadProgress: setUploadProgress,
      });
      
      // Clear voice recording
      setVoiceBlob(null);
      setVoiceUrl(null);
      setRecordingDuration(0);
      
      if (voiceUrl) {
        URL.revokeObjectURL(voiceUrl);
      }
      
      toast.success('Voice message sent!');
    } catch (error) {
      console.error('Failed to send voice message:', error);
      toast.error('Failed to send voice message');
    } finally {
      setIsSending(false);
    }
  };

  // Format time helper function
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full bg-base-100 border-t border-base-300">
      {/* Smart Replies */}
      {showSmartReplies && smartReplies.length > 0 && (
        <div className="p-3 border-b border-base-300 bg-base-50">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-medium text-primary">💡 Smart Replies:</span>
            <button
              onClick={() => setShowSmartReplies(false)}
              className="btn btn-ghost btn-xs ml-auto"
            >
              <X size={12} />
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {smartReplies.map((reply, index) => (
              <button
                key={index}
                onClick={() => handleSmartReplySelect(reply)}
                className="btn btn-sm btn-outline hover:btn-primary transition-colors"
              >
                {reply}
              </button>
            ))}
          </div>
        </div>
      )}
      
      <div className="p-4">
      {/* Voice Recording Preview */}
      {voiceBlob && (
        <div className="mb-3 p-4 bg-base-200/50 border border-base-300/60 rounded-xl shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary/15 rounded-full flex items-center justify-center">
                <Mic className="text-primary" size={16} />
              </div>
              <div>
                <span className="text-sm font-semibold text-base-content">Voice Message</span>
                <div className="text-xs text-base-content/60">
                  Duration: {formatTime(recordingDuration)}
                </div>
              </div>
            </div>
            <button
              onClick={handleCancelVoiceRecording}
              className="btn btn-ghost btn-sm btn-circle text-error hover:bg-error/10 transition-colors"
              title="Cancel voice message"
            >
              <X size={16} />
            </button>
          </div>
          
          {voiceUrl && (
            <div className="flex items-center gap-3 p-3 bg-base-100/80 rounded-lg border border-base-300/40">
              <audio 
                controls 
                src={voiceUrl} 
                className="flex-1 h-10 rounded-lg"
                style={{ 
                  maxWidth: '250px'
                }}
              />
              <button
                onClick={handleSendVoiceMessage}
                disabled={isSending}
                className="btn btn-primary btn-sm gap-2 shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105"
              >
                {isSending ? (
                  <>
                    <span className="loading loading-spinner loading-xs" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send size={14} />
                    Send
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}
      
      {/* Recording Status */}
      {isRecording && (
        <div className="mb-3 p-4 bg-base-200/60 border border-error/40 rounded-xl shadow-sm">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-4 h-4 bg-error rounded-full animate-ping absolute opacity-75"></div>
              <div className="w-4 h-4 bg-error rounded-full"></div>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-semibold text-error">Recording in progress...</span>
                <div className="flex gap-1">
                  <div className="w-1 h-3 bg-error/60 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
                  <div className="w-1 h-3 bg-error/60 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                  <div className="w-1 h-3 bg-error/60 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
                </div>
              </div>
              <div className="text-lg font-mono font-bold text-error tracking-wider">
                {formatTime(recordingDuration)}
              </div>
              {/* Debug info - remove in production */}
              <div className="text-xs text-base-content/50 mt-1">
                Raw: {recordingDuration}s | Timer: {recordingTimerRef.current ? 'Active' : 'Inactive'}
              </div>
            </div>
            <button
              onClick={handleCancelVoiceRecording}
              className="btn btn-error btn-sm gap-2 hover:btn-error/80 transition-all duration-200"
            >
              <X size={14} />
              Stop
            </button>
          </div>
          
          {/* Progress bar */}
          <div className="mt-3">
            <div className="w-full bg-base-300/50 rounded-full h-1.5">
              <div 
                className="bg-gradient-to-r from-error/80 to-warning/80 h-1.5 rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${Math.min((recordingDuration / 60) * 100, 100)}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-xs text-base-content/60 mt-1">
              <span>0:00</span>
              <span className="text-error font-medium">{recordingDuration >= 55 ? 'Almost done!' : ''}</span>
              <span>1:00</span>
            </div>
          </div>
        </div>
      )}
      
      {/* Image Preview */}
      {imagePreview && (
        <div className="mb-3 flex items-center gap-2">
          <div className="relative">
            <img
              src={imagePreview}
              alt="Preview"
              className={`w-20 h-20 object-cover rounded-lg border border-base-300 ${
                isSending && uploadProgress < 100 ? "blur-sm" : ""
              }`}
            />

            {/* Upload Progress */}
            {isSending && uploadProgress < 100 && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
                <div
                  className="radial-progress text-white"
                  style={{
                    "--value": uploadProgress,
                    "--size": "2rem",
                    "--thickness": "3px",
                  }}
                  role="progressbar"
                >
                  {uploadProgress}%
                </div>
              </div>
            )}

            {/* Download Button */}
            {!isSending && (
              <button
                onClick={handleDownload}
                className="absolute inset-0 flex items-center justify-center bg-black/40 text-white rounded-lg transition-opacity opacity-0 hover:opacity-100"
                type="button"
                title="Download image"
              >
                <Download className="size-6" />
              </button>
            )}

            {/* Remove Button */}
            {!isSending && (
              <button
                onClick={removeImage}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-error text-error-content flex items-center justify-center hover:scale-110 transition-transform"
                type="button"
                title="Remove image"
              >
                <X className="size-3" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Main Input Area */}
      <form onSubmit={handleSendMessage} className="flex items-end gap-2">
        <div className="flex-1 relative">
          {/* Text Input */}
          <div className="relative">
            <textarea
              ref={textInputRef}
              className="w-full textarea textarea-bordered resize-none min-h-[2.5rem] max-h-32 pr-20"
              placeholder="Type a message..."
              value={text}
              onChange={handleTextChange}
              onKeyPress={handleKeyPress}
              disabled={isSending}
              rows={1}
              style={{
                height: 'auto',
                minHeight: '2.5rem'
              }}
              onInput={(e) => {
                e.target.style.height = 'auto';
                e.target.style.height = Math.min(e.target.scrollHeight, 128) + 'px';
              }}
            />
            
            {/* Input Actions */}
            <div className="absolute right-2 bottom-2 flex items-center gap-1">
              {/* Formatting Toolbar Toggle */}
              <button
                type="button"
                onClick={() => setShowFormattingToolbar(!showFormattingToolbar)}
                className={`btn btn-ghost btn-sm btn-circle ${
                  showFormattingToolbar || hasFormatting(text) ? 'bg-primary text-primary-content' : ''
                }`}
                disabled={isSending}
                title="Text formatting"
              >
                <Type size={16} />
              </button>
              
              {/* Emoji Picker Button */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className={`btn btn-ghost btn-sm btn-circle ${
                    showEmojiPicker ? 'bg-primary text-primary-content' : ''
                  }`}
                  disabled={isSending}
                  title="Add emoji"
                >
                  <Smile size={16} />
                </button>
                
                <EmojiPicker
                  isOpen={showEmojiPicker}
                  onEmojiSelect={handleEmojiSelect}
                  onClose={() => setShowEmojiPicker(false)}
                />
              </div>

              {/* File Attachment Button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className={`btn btn-ghost btn-sm btn-circle ${
                  imagePreview ? 'text-success' : ''
                }`}
                disabled={isSending}
                title="Attach image"
              >
                <Paperclip size={16} />
              </button>
            </div>
          </div>

          {/* Hidden File Input */}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            ref={fileInputRef}
            onChange={handleImageChange}
            disabled={isSending}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Voice Record Button */}
          {!voiceBlob ? (
            <button
              type="button"
              onClick={handleVoiceRecord}
              className={`btn btn-circle transition-all duration-200 ${
                isRecording 
                  ? 'btn-error animate-pulse shadow-lg shadow-error/30 scale-110' 
                  : 'btn-ghost hover:btn-primary hover:shadow-md hover:scale-105'
              }`}
              disabled={isSending}
              title={isRecording ? 'Stop recording' : 'Start voice recording'}
            >
              {isRecording ? (
                <div className="relative">
                  <Mic size={18} className="animate-pulse" />
                  <div className="absolute inset-0 rounded-full bg-error/20 animate-ping"></div>
                </div>
              ) : (
                <Mic size={18} />
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSendVoiceMessage}
              className="btn btn-circle btn-success shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105"
              disabled={isSending}
              title="Send voice message"
            >
              {isSending ? (
                <span className="loading loading-spinner loading-sm" />
              ) : (
                <Send size={18} />
              )}
            </button>
          )}

          {/* Send Button */}
          <button
            type="submit"
            className={`btn btn-circle transition-all duration-200 ${
              text.trim() || imagePreview 
                ? 'btn-primary shadow-md hover:shadow-lg hover:scale-105' 
                : 'btn-ghost hover:btn-base-300'
            }`}
            disabled={isSending || (!text.trim() && !imagePreview)}
            title="Send message"
          >
            {isSending ? (
              <span className="loading loading-spinner loading-sm" />
            ) : (
              <Send size={18} />
            )}
          </button>
        </div>
      </form>

      {/* Formatting Toolbar */}
      {showFormattingToolbar && (
        <FormattingToolbar
          textareaRef={textInputRef}
          value={text}
          onChange={setText}
          users={users || []}
          showPreview={showPreview}
          onTogglePreview={() => setShowPreview(!showPreview)}
        />
      )}

      {/* Character Count (optional) */}
      {text.length > 0 && (
        <div className="text-xs text-base-content/60 mt-1 text-right">
          {text.length}/2000 {hasFormatting(text) && <span className="text-primary">• Formatted</span>}
        </div>
      )}
      </div>
    </div>
  );
};

export default EnhancedMessageInput;