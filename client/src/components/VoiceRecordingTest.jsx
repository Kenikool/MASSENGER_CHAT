import React, { useState, useRef } from 'react';
import { Mic, Play, Pause, Square, Download } from 'lucide-react';
import VoiceService from '../services/voiceService';
import toast from 'react-hot-toast';

const VoiceRecordingTest = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [recordingTime, setRecordingTime] = useState(0);
  
  const voiceServiceRef = useRef(null);
  const audioRef = useRef(null);
  const timerRef = useRef(null);

  const startRecording = async () => {
    try {
      if (!VoiceService.isSupported()) {
        toast.error('Voice recording not supported in this browser');
        return;
      }

      voiceServiceRef.current = new VoiceService();
      await voiceServiceRef.current.startRecording();
      
      setIsRecording(true);
      setRecordingTime(0);
      
      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
      toast.success('Recording started');
    } catch (error) {
      console.error('Recording error:', error);
      toast.error(error.message || 'Failed to start recording');
    }
  };

  const stopRecording = async () => {
    try {
      if (voiceServiceRef.current && isRecording) {
        const result = await voiceServiceRef.current.stopRecording();
        
        setIsRecording(false);
        setAudioBlob(result.blob);
        setAudioUrl(result.url);
        setDuration(result.duration);
        
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
        
        toast.success(`Recording completed (${recordingTime}s)`);
      }
    } catch (error) {
      console.error('Stop recording error:', error);
      toast.error('Failed to stop recording');
    }
  };

  const cancelRecording = () => {
    if (voiceServiceRef.current) {
      voiceServiceRef.current.cancelRecording();
    }
    
    setIsRecording(false);
    setAudioBlob(null);
    setAudioUrl(null);
    setDuration(0);
    setRecordingTime(0);
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
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

  const downloadAudio = () => {
    if (audioBlob) {
      const url = URL.createObjectURL(audioBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `voice-recording-${Date.now()}.webm`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
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
        <h2 className="card-title flex items-center gap-2">
          <Mic size={20} />
          Voice Recording Test
        </h2>
        
        {/* Browser Support Check */}
        <div className="alert alert-info text-sm">
          <span>
            Browser Support: {VoiceService.isSupported() ? '✅ Supported' : '❌ Not Supported'}
          </span>
        </div>
        
        {/* Recording Status */}
        {isRecording && (
          <div className="alert alert-warning">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
              <span>Recording... {formatTime(recordingTime)}</span>
            </div>
          </div>
        )}
        
        {/* Audio Preview */}
        {audioUrl && (
          <div className="bg-base-200 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Recorded Audio</span>
              <span className="text-xs text-base-content/60">
                Duration: {formatTime(duration)}
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
            
            <div className="flex gap-2">
              <button
                onClick={playAudio}
                className="btn btn-sm btn-primary"
              >
                {isPlaying ? <Pause size={16} /> : <Play size={16} />}
                {isPlaying ? 'Pause' : 'Play'}
              </button>
              
              <button
                onClick={downloadAudio}
                className="btn btn-sm btn-ghost"
              >
                <Download size={16} />
                Download
              </button>
            </div>
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
              Start Recording
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
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setAudioBlob(null);
                  setAudioUrl(null);
                  setDuration(0);
                  if (audioUrl) URL.revokeObjectURL(audioUrl);
                }}
                className="btn btn-ghost"
              >
                Record Again
              </button>
            </div>
          )}
        </div>
        
        {/* Debug Info */}
        <div className="text-xs text-base-content/60 mt-4">
          <div>MediaDevices: {navigator.mediaDevices ? '✅' : '❌'}</div>
          <div>getUserMedia: {navigator.mediaDevices?.getUserMedia ? '✅' : '❌'}</div>
          <div>MediaRecorder: {window.MediaRecorder ? '✅' : '❌'}</div>
          <div>HTTPS: {location.protocol === 'https:' ? '✅' : '❌'}</div>
        </div>
      </div>
    </div>
  );
};

export default VoiceRecordingTest;