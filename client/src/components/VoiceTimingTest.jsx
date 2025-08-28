import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Play, Pause } from 'lucide-react';
import VoiceService from '../services/voiceService';
import toast from 'react-hot-toast';

const VoiceTimingTest = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const voiceServiceRef = useRef(null);
  const recordingTimerRef = useRef(null);
  const autoStopTimeoutRef = useRef(null);
  const audioRef = useRef(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
      if (autoStopTimeoutRef.current) {
        clearTimeout(autoStopTimeoutRef.current);
      }
      if (voiceServiceRef.current && isRecording) {
        voiceServiceRef.current.cancelRecording();
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [isRecording, audioUrl]);

  const startRecording = async () => {
    try {
      if (!VoiceService.isSupported()) {
        toast.error('Voice recording not supported');
        return;
      }

      voiceServiceRef.current = new VoiceService();
      await voiceServiceRef.current.startRecording();
      
      setIsRecording(true);
      setRecordingDuration(0);
      toast.success('Recording started');

      // Start timer - updates every second
      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration(prev => {
          const newDuration = prev + 1;
          console.log(`Recording duration: ${newDuration}s`);
          
          // Auto-stop after 10 seconds for testing (instead of 60)
          if (newDuration >= 10) {
            console.log('Auto-stopping recording at 10 seconds');
            stopRecording();
          }
          return newDuration;
        });
      }, 1000);

      // Backup timeout
      autoStopTimeoutRef.current = setTimeout(() => {
        console.log('Backup timeout triggered');
        stopRecording();
      }, 10000);

    } catch (error) {
      console.error('Recording error:', error);
      toast.error(error.message || 'Failed to start recording');
    }
  };

  const stopRecording = async () => {
    try {
      if (voiceServiceRef.current && isRecording) {
        console.log(`Stopping recording at ${recordingDuration}s`);
        
        const result = await voiceServiceRef.current.stopRecording();
        
        setIsRecording(false);
        setAudioBlob(result.blob);
        setAudioUrl(result.url);

        // Clear timers
        if (recordingTimerRef.current) {
          clearInterval(recordingTimerRef.current);
          recordingTimerRef.current = null;
        }
        
        if (autoStopTimeoutRef.current) {
          clearTimeout(autoStopTimeoutRef.current);
          autoStopTimeoutRef.current = null;
        }

        console.log(`Recording completed:`, {
          timerDuration: recordingDuration,
          serviceDuration: result.duration,
          blobSize: result.blob.size
        });

        toast.success(`Recording completed (${recordingDuration}s)`);
      }
    } catch (error) {
      console.error('Stop recording error:', error);
      toast.error('Failed to stop recording');
      
      // Reset state on error
      setIsRecording(false);
      setRecordingDuration(0);
      
      // Clear timers
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
      
      if (autoStopTimeoutRef.current) {
        clearTimeout(autoStopTimeoutRef.current);
        autoStopTimeoutRef.current = null;
      }
    }
  };

  const cancelRecording = () => {
    console.log('Cancelling recording');
    
    if (voiceServiceRef.current) {
      voiceServiceRef.current.cancelRecording();
    }
    
    setIsRecording(false);
    setAudioBlob(null);
    setAudioUrl(null);
    setRecordingDuration(0);
    
    // Clear timers
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    
    if (autoStopTimeoutRef.current) {
      clearTimeout(autoStopTimeoutRef.current);
      autoStopTimeoutRef.current = null;
    }
    
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    
    toast.info('Recording cancelled');
  };

  const playAudio = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="card w-96 bg-base-100 shadow-xl">
      <div className="card-body">
        <h2 className="card-title">Voice Timing Test</h2>
        
        {/* Recording Status */}
        {isRecording && (
          <div className="alert alert-warning">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
              <span>Recording... {formatTime(recordingDuration)}</span>
            </div>
          </div>
        )}
        
        {/* Audio Preview */}
        {audioUrl && (
          <div className="bg-base-200 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Recorded Audio</span>
              <span className="text-xs text-base-content/60">
                Duration: {formatTime(recordingDuration)}
              </span>
            </div>
            
            <audio
              ref={audioRef}
              src={audioUrl}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onEnded={() => setIsPlaying(false)}
              className="w-full mb-2"
              controls
            />
            
            <button
              onClick={playAudio}
              className="btn btn-sm btn-primary"
            >
              {isPlaying ? <Pause size={16} /> : <Play size={16} />}
              {isPlaying ? 'Pause' : 'Play'}
            </button>
          </div>
        )}
        
        {/* Controls */}
        <div className="card-actions justify-center">
          {!isRecording && !audioBlob && (
            <button
              onClick={startRecording}
              className="btn btn-primary btn-lg"
              disabled={!VoiceService.isSupported()}
            >
              <Mic size={20} />
              Start Recording (10s max)
            </button>
          )}
          
          {isRecording && (
            <div className="flex gap-2">
              <button
                onClick={stopRecording}
                className="btn btn-success"
              >
                <Square size={16} />
                Stop
              </button>
              
              <button
                onClick={cancelRecording}
                className="btn btn-error"
              >
                Cancel
              </button>
            </div>
          )}
          
          {audioBlob && (
            <button
              onClick={() => {
                setAudioBlob(null);
                setAudioUrl(null);
                setRecordingDuration(0);
                if (audioUrl) URL.revokeObjectURL(audioUrl);
              }}
              className="btn btn-ghost"
            >
              Record Again
            </button>
          )}
        </div>
        
        {/* Debug Info */}
        <div className="text-xs text-base-content/60 mt-4">
          <div>Current Duration: {recordingDuration}s</div>
          <div>Recording: {isRecording ? 'Yes' : 'No'}</div>
          <div>Timer Active: {recordingTimerRef.current ? 'Yes' : 'No'}</div>
          <div>Auto-stop Active: {autoStopTimeoutRef.current ? 'Yes' : 'No'}</div>
        </div>
      </div>
    </div>
  );
};

export default VoiceTimingTest;