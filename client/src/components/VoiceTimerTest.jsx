import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square } from 'lucide-react';

const VoiceTimerTest = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const startRecording = () => {
    console.log('Starting timer test...');
    setIsRecording(true);
    setDuration(0);

    timerRef.current = setInterval(() => {
      setDuration(prev => {
        const newDuration = prev + 1;
        console.log(`Timer tick: ${newDuration}s`);
        return newDuration;
      });
    }, 1000);
  };

  const stopRecording = () => {
    console.log('Stopping timer test...');
    setIsRecording(false);
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const resetTimer = () => {
    stopRecording();
    setDuration(0);
  };

  return (
    <div className="card w-96 bg-base-100 shadow-xl">
      <div className="card-body">
        <h2 className="card-title">Voice Timer Test</h2>
        
        <div className="text-center">
          <div className="text-4xl font-mono mb-4">
            {formatTime(duration)}
          </div>
          
          <div className="text-sm text-base-content/60 mb-4">
            Status: {isRecording ? 'Recording...' : 'Stopped'}
          </div>
        </div>

        <div className="card-actions justify-center gap-2">
          {!isRecording ? (
            <button
              onClick={startRecording}
              className="btn btn-primary"
            >
              <Mic size={16} />
              Start Timer
            </button>
          ) : (
            <button
              onClick={stopRecording}
              className="btn btn-error"
            >
              <Square size={16} />
              Stop Timer
            </button>
          )}
          
          <button
            onClick={resetTimer}
            className="btn btn-ghost"
          >
            Reset
          </button>
        </div>

        <div className="text-xs text-base-content/60 mt-4">
          <div>Duration state: {duration}</div>
          <div>Is recording: {isRecording.toString()}</div>
          <div>Timer ref: {timerRef.current ? 'Active' : 'Inactive'}</div>
        </div>
      </div>
    </div>
  );
};

export default VoiceTimerTest;