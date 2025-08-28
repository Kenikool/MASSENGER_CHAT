import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Play, Pause, Bug } from 'lucide-react';

const VoiceTimerDebug = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [logs, setLogs] = useState([]);
  const timerRef = useRef(null);
  const startTimeRef = useRef(null);

  const addLog = (message) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev.slice(-10), `${timestamp}: ${message}`]);
    console.log(`🐛 [VoiceTimerDebug] ${message}`);
  };

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

  const startTimer = () => {
    addLog('🎬 Starting timer...');
    
    // Clear any existing timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      addLog('🧹 Cleared existing timer');
    }

    setIsRecording(true);
    setDuration(0);
    startTimeRef.current = Date.now();
    
    addLog('⏰ Setting up interval...');
    
    // Method 1: Simple increment
    let count = 0;
    timerRef.current = setInterval(() => {
      count += 1;
      addLog(`📊 Timer tick: ${count}`);
      
      setDuration(prevDuration => {
        addLog(`🔄 State update: ${prevDuration} -> ${count}`);
        return count;
      });
    }, 1000);
    
    addLog(`✅ Timer started with ID: ${timerRef.current}`);
  };

  const stopTimer = () => {
    addLog('🛑 Stopping timer...');
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
      addLog('✅ Timer cleared');
    }
    
    setIsRecording(false);
    addLog(`🏁 Final duration: ${duration}s`);
  };

  const resetTimer = () => {
    addLog('🔄 Resetting timer...');
    stopTimer();
    setDuration(0);
    setLogs([]);
  };

  return (
    <div className="card w-full max-w-2xl bg-base-100 shadow-xl">
      <div className="card-body">
        <h2 className="card-title flex items-center gap-2">
          <Bug size={20} />
          Voice Timer Debug Tool
        </h2>
        
        {/* Timer Display */}
        <div className="text-center p-6 bg-base-200 rounded-lg">
          <div className="text-6xl font-mono font-bold mb-2">
            {formatTime(duration)}
          </div>
          <div className="text-sm text-base-content/60">
            Status: {isRecording ? '🔴 Recording' : '⚫ Stopped'} | 
            Timer ID: {timerRef.current || 'None'} | 
            Duration State: {duration}
          </div>
        </div>

        {/* Controls */}
        <div className="flex justify-center gap-3 my-4">
          {!isRecording ? (
            <button
              onClick={startTimer}
              className="btn btn-primary gap-2"
            >
              <Mic size={16} />
              Start Timer
            </button>
          ) : (
            <button
              onClick={stopTimer}
              className="btn btn-error gap-2"
            >
              <Square size={16} />
              Stop Timer
            </button>
          )}
          
          <button
            onClick={resetTimer}
            className="btn btn-ghost gap-2"
          >
            Reset
          </button>
        </div>

        {/* Debug Info */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <h3 className="font-semibold mb-2">State Info:</h3>
            <div className="space-y-1 font-mono text-xs">
              <div>isRecording: {isRecording.toString()}</div>
              <div>duration: {duration}</div>
              <div>timerRef.current: {timerRef.current || 'null'}</div>
              <div>startTime: {startTimeRef.current || 'null'}</div>
            </div>
          </div>
          
          <div>
            <h3 className="font-semibold mb-2">Browser Info:</h3>
            <div className="space-y-1 font-mono text-xs">
              <div>setInterval: {typeof setInterval}</div>
              <div>clearInterval: {typeof clearInterval}</div>
              <div>Date.now(): {Date.now()}</div>
              <div>React.version: {React.version}</div>
            </div>
          </div>
        </div>

        {/* Logs */}
        <div className="mt-4">
          <h3 className="font-semibold mb-2">Debug Logs:</h3>
          <div className="bg-base-300 p-3 rounded-lg h-40 overflow-y-auto">
            {logs.length === 0 ? (
              <div className="text-base-content/60 text-sm">No logs yet...</div>
            ) : (
              <div className="space-y-1">
                {logs.map((log, index) => (
                  <div key={index} className="text-xs font-mono">
                    {log}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Test Instructions */}
        <div className="alert alert-info mt-4">
          <div className="text-sm">
            <h4 className="font-semibold">Test Instructions:</h4>
            <ol className="list-decimal list-inside mt-2 space-y-1">
              <li>Click "Start Timer" and watch the display</li>
              <li>Check if the timer updates every second</li>
              <li>Monitor the debug logs for state updates</li>
              <li>Compare with the main voice recording timer</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoiceTimerDebug;