import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Send, X, Play, Pause } from 'lucide-react';
import VoiceService from '../services/voiceService';
import toast from 'react-hot-toast';

const VoiceRecorder = ({ onSendVoice, onCancel }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSupported, setIsSupported] = useState(true);

  const voiceService = useRef(new VoiceService());
  const timerRef = useRef(null);
  const audioRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    setIsSupported(VoiceService.isSupported());
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  const startRecording = async () => {
    try {
      await voiceService.current.startRecording();
      setIsRecording(true);
      setRecordingTime(0);

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

      // Start visualization if canvas is available
      if (canvasRef.current && voiceService.current.stream) {
        voiceService.current.createAudioVisualizer(
          voiceService.current.stream, 
          canvasRef.current
        );
      }

      toast.success('Recording started');
    } catch (error) {
      toast.error(error.message);
    }
  };

  const stopRecording = async () => {
    try {
      const result = await voiceService.current.stopRecording();
      setIsRecording(false);
      setAudioBlob(result.blob);
      setAudioUrl(result.url);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }

      toast.success('Recording completed');
    } catch (error) {
      toast.error('Failed to stop recording');
    }
  };

  const cancelRecording = () => {
    voiceService.current.cancelRecording();
    setIsRecording(false);
    setRecordingTime(0);
    setAudioBlob(null);
    setAudioUrl(null);
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    onCancel();
  };

  const playAudio = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const sendVoiceMessage = async () => {
    if (!audioBlob) return;

    try {
      const base64Audio = await voiceService.current.blobToBase64(audioBlob);
      await onSendVoice({
        audioBlob,
        base64Audio,
        duration: recordingTime,
      });
      
      // Reset state
      setAudioBlob(null);
      setAudioUrl(null);
      setRecordingTime(0);
      
      toast.success('Voice message sent!');
    } catch (error) {
      toast.error('Failed to send voice message');
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isSupported) {
    return (
      <div className="p-4 bg-error/10 border border-error/20 rounded-lg">
        <p className="text-error text-sm">
          Voice recording is not supported in your browser
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 bg-base-200 rounded-lg space-y-4">
      {/* Recording Visualization */}
      {isRecording && (
        <div className="flex justify-center">
          <canvas 
            ref={canvasRef}
            width={300}
            height={100}
            className="border border-base-300 rounded"
          />
        </div>
      )}

      {/* Audio Preview */}
      {audioUrl && (
        <div className="flex items-center gap-3 p-3 bg-base-100 rounded-lg">
          <button
            onClick={playAudio}
            className="btn btn-circle btn-sm"
          >
            {isPlaying ? <Pause size={16} /> : <Play size={16} />}
          </button>
          
          <div className="flex-1">
            <div className="text-sm font-medium">Voice Message</div>
            <div className="text-xs text-base-content/60">
              Duration: {formatTime(recordingTime)}
            </div>
          </div>

          <audio
            ref={audioRef}
            src={audioUrl}
            onEnded={() => setIsPlaying(false)}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
          />
        </div>
      )}

      {/* Recording Timer */}
      {isRecording && (
        <div className="text-center">
          <div className="text-2xl font-mono text-error">
            {formatTime(recordingTime)}
          </div>
          <div className="text-sm text-base-content/60">
            Recording...
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="flex justify-center gap-3">
        {!isRecording && !audioBlob && (
          <button
            onClick={startRecording}
            className="btn btn-circle btn-lg btn-primary"
            title="Start recording"
          >
            <Mic size={24} />
          </button>
        )}

        {isRecording && (
          <button
            onClick={stopRecording}
            className="btn btn-circle btn-lg btn-error animate-pulse"
            title="Stop recording"
          >
            <MicOff size={24} />
          </button>
        )}

        {audioBlob && (
          <>
            <button
              onClick={sendVoiceMessage}
              className="btn btn-circle btn-lg btn-success"
              title="Send voice message"
            >
              <Send size={24} />
            </button>
            
            <button
              onClick={cancelRecording}
              className="btn btn-circle btn-lg btn-ghost"
              title="Cancel"
            >
              <X size={24} />
            </button>
          </>
        )}

        {(isRecording || audioBlob) && (
          <button
            onClick={cancelRecording}
            className="btn btn-circle btn-lg btn-ghost"
            title="Cancel"
          >
            <X size={24} />
          </button>
        )}
      </div>

      {/* Instructions */}
      <div className="text-center text-xs text-base-content/60">
        {!isRecording && !audioBlob && "Tap to start recording"}
        {isRecording && "Tap to stop recording"}
        {audioBlob && "Preview your message and send"}
      </div>
    </div>
  );
};

export default VoiceRecorder;