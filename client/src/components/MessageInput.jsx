// components/MessageInput.jsx
import { useRef, useState, useEffect, useCallback } from "react";
import { useChatStore } from "../store/useChatStore";
import {
  Image,
  Send,
  X,
  Download,
  Mic,
  StopCircle,
  Trash2,
} from "lucide-react";
import toast from "react-hot-toast";
import { useSocketContext } from "../hooks/useSocketContext";
import { useAuthStore } from "../store/useAuthStore";

const MessageInput = () => {
  const [text, setText] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isSending, setIsSending] = useState(false);
  const fileInputRef = useRef(null);
  const { sendMessage, selectedUser } = useChatStore();
  const { socket } = useSocketContext();
  const { authUser } = useAuthStore();
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef(null);

  // Voice recording states
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [audioChunks, setAudioChunks] = useState([]);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioDuration, setAudioDuration] = useState(0);
  const audioTimerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        if (socket && selectedUser && authUser && isTyping) {
          socket.emit("stopTyping", {
            receiverId: selectedUser._id,
            senderId: authUser._id,
          });
        }
      }
    };
  }, [socket, selectedUser, authUser, isTyping]);

  // Voice recording useEffect to cleanup MediaRecorder
  useEffect(() => {
    return () => {
      if (mediaRecorder && mediaRecorder.state !== "inactive") {
        mediaRecorder.stop();
      }
      if (audioTimerRef.current) {
        clearInterval(audioTimerRef.current);
      }
    };
  }, [mediaRecorder]);

  const handleImageChange = useCallback((e) => {
    const file = e.target.files[0];
    if (!file || !file.type.startsWith("image/")) {
      toast.error("Please select an image file");
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
  }, []);

  const removeImage = useCallback(() => {
    setImagePreview(null);
    setUploadProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  const handleDownload = useCallback(
    (e) => {
      e.preventDefault();
      if (!imagePreview) return;

      const link = document.createElement("a");
      link.href = imagePreview;
      link.download = `chat-image-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    },
    [imagePreview]
  );

  // Voice recording functions
  const startRecording = useCallback(async () => {
    if (imagePreview) {
      toast.error("Cannot record voice while an image is selected.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      setMediaRecorder(recorder);
      setAudioChunks([]);
      setAudioBlob(null);
      setAudioDuration(0);

      recorder.ondataavailable = (event) => {
        setAudioChunks((prev) => [...prev, event.data]);
      };

      recorder.onstop = () => {
        const blob = new Blob(audioChunks, { type: "audio/webm" });
        setAudioBlob(blob);
        stream.getTracks().forEach((track) => track.stop()); // Stop the microphone
      };

      recorder.start();
      setIsRecording(true);
      toast.success("Recording started...");

      audioTimerRef.current = setInterval(() => {
        setAudioDuration((prev) => prev + 1);
      }, 1000);
    } catch (error) {
      console.error("Error starting recording:", error);
      toast.error(
        "Failed to start voice recording. Please check microphone permissions."
      );
    }
  }, [imagePreview, audioChunks]);

  const stopRecording = useCallback(() => {
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
      mediaRecorder.stop();
      setIsRecording(false);
      clearInterval(audioTimerRef.current);
      audioTimerRef.current = null;
      toast.success("Recording stopped.");
    }
  }, [mediaRecorder]);

  const cancelRecording = useCallback(() => {
    stopRecording(); // Ensure recorder is stopped
    setAudioBlob(null);
    setAudioChunks([]);
    setAudioDuration(0);
    setMediaRecorder(null);
    toast.info("Voice recording cancelled.");
  }, [stopRecording]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!text.trim() && !imagePreview && !audioBlob) return;
    if (!selectedUser) {
      toast.error("Please select a user to chat with.");
      return;
    }
    setIsSending(true);

    try {
      const messagePayload = {
        text: text.trim(),
        image: imagePreview,
        onUploadProgress: setUploadProgress,
      };

      if (audioBlob) {
        // Convert audioBlob to base64 for now, will handle proper blob upload in useChatStore
        messagePayload.voiceMessage = audioBlob;
        messagePayload.voiceDuration = audioDuration;
      }

      await sendMessage({
        ...messagePayload,
        receiverId: selectedUser._id, // Pass receiverId explicitly
      });

      setText("");
      setImagePreview(null);
      setUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = "";
      cancelRecording(); // Clear voice recording states after sending
    } catch (error) {
      console.error("Failed to send message:", error);
      toast.error("Failed to send message. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes < 10 ? "0" : ""}${minutes}:${
      remainingSeconds < 10 ? "0" : ""
    }${remainingSeconds}`;
  };

  return (
    <div className="p-4 w-full">
      {(imagePreview || audioBlob) && (
        <div className="mb-3 flex items-center gap-2">
          {imagePreview && (
            <div className="relative">
              <img
                src={imagePreview}
                alt="Preview"
                className={`w-20 h-20 object-cover rounded-lg border border-zinc-700
                ${isSending && uploadProgress < 100 ? "blur-sm" : ""}`}
              />
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
              {!isSending && (
                <button
                  onClick={handleDownload}
                  className="absolute inset-0 flex items-center justify-center bg-black/40 text-white rounded-lg transition-opacity opacity-0 hover:opacity-100"
                  type="button"
                >
                  <Download className="size-6" />
                </button>
              )}
              {!isSending && (
                <button
                  onClick={removeImage}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-base-300 flex items-center justify-center"
                  type="button"
                >
                  <X className="size-3" />
                </button>
              )}
            </div>
          )}

          {audioBlob && (
            <div className="relative flex items-center justify-between gap-2 p-2 pr-4 bg-base-200 rounded-lg border border-zinc-700">
              <audio
                src={URL.createObjectURL(audioBlob)}
                controls
                className="w-48"
              ></audio>
              <span className="text-xs text-zinc-400">
                {formatTime(audioDuration)}
              </span>
              {!isSending && (
                <button
                  onClick={cancelRecording}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-base-300 flex items-center justify-center"
                  type="button"
                >
                  <X className="size-3" />
                </button>
              )}
            </div>
          )}
        </div>
      )}

      <form onSubmit={handleSendMessage} className="flex items-center gap-2">
        <div className="flex-1 flex gap-2">
          <input
            type="text"
            className="w-full input input-bordered rounded-lg input-sm sm:input-md"
            placeholder={
              isRecording ? "Recording voice..." : "Type a message..."
            }
            value={text}
            onChange={(e) => {
              setText(e.target.value);
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
            }}
            disabled={isSending || isRecording || !!audioBlob}
          />
          <input
            type="file"
            accept="image/*"
            className="hidden"
            ref={fileInputRef}
            onChange={handleImageChange}
            disabled={isSending || isRecording || !!audioBlob}
          />

          <button
            type="button"
            className={`hidden sm:flex btn btn-circle
                    ${imagePreview ? "text-emerald-500" : "text-zinc-400"}`}
            onClick={() => fileInputRef.current?.click()}
            disabled={isSending || isRecording || !!audioBlob}
          >
            <Image size={20} />
          </button>

          {!isRecording && !audioBlob && !imagePreview && (
            <button
              type="button"
              className="btn btn-circle text-zinc-400"
              onClick={startRecording}
              disabled={isSending || !!text.trim()}
            >
              <Mic size={20} />
            </button>
          )}

          {isRecording && (
            <>
              <button
                type="button"
                className="btn btn-circle text-red-500"
                onClick={stopRecording}
                disabled={isSending}
              >
                <StopCircle size={20} />
              </button>
              <button
                type="button"
                className="btn btn-circle text-zinc-400"
                onClick={cancelRecording}
                disabled={isSending}
              >
                <Trash2 size={20} />
              </button>
            </>
          )}
        </div>
        <button
          type="submit"
          className="btn btn-sm btn-circle"
          disabled={isSending || (!text.trim() && !imagePreview && !audioBlob)}
        >
          {isSending ? (
            <span className="loading loading-spinner loading-md" />
          ) : (
            <Send size={22} />
          )}
        </button>
      </form>
    </div>
  );
};

export default MessageInput;
