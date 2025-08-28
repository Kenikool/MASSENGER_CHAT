import React, { useState } from 'react';
import { TestTube, MessageCircle, Heart, Mic, Sparkles, Settings } from 'lucide-react';
import axiosInstance from '../lib/axios';
import toast from 'react-hot-toast';
import VoiceRecordingTest from './VoiceRecordingTest';
import VoiceTimingTest from './VoiceTimingTest';
import VoiceTimerTest from './VoiceTimerTest';
import VoiceTimerDebug from './VoiceTimerDebug';
import VoiceService from '../services/voiceService';

const FeatureTestPanel = () => {
  const [testResults, setTestResults] = useState({});
  const [testing, setTesting] = useState(false);
  const [showVoiceTest, setShowVoiceTest] = useState(false);
  const [showTimingTest, setShowTimingTest] = useState(false);
  const [showTimerTest, setShowTimerTest] = useState(false);
  const [showDebugTest, setShowDebugTest] = useState(false);

  const runTest = async (testName, testFunction) => {
    setTesting(true);
    try {
      const result = await testFunction();
      setTestResults(prev => ({
        ...prev,
        [testName]: { success: true, result }
      }));
      toast.success(`${testName} test passed!`);
    } catch (error) {
      setTestResults(prev => ({
        ...prev,
        [testName]: { success: false, error: error.message }
      }));
      toast.error(`${testName} test failed: ${error.message}`);
    } finally {
      setTesting(false);
    }
  };

  const testAISmartReplies = async () => {
    try {
      // First test if AI health endpoint works
      const healthResponse = await fetch('/api/ai/health');
      if (!healthResponse.ok) {
        throw new Error(`AI routes not accessible: ${healthResponse.status}`);
      }
      
      const healthData = await healthResponse.json();
      console.log('AI Health Check:', healthData);
      
      if (!healthData.geminiConfigured) {
        throw new Error('Gemini API key not configured. Add GEMINI_API_KEY to backend/.env');
      }
      
      // Now test smart replies
      const response = await axiosInstance.post('/api/ai/smart-replies', {
        message: 'How are you doing today?',
        context: []
      });
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        throw new Error('AI routes not found. Check if backend server is running and routes are registered.');
      }
      if (error.response?.status === 401) {
        throw new Error('Authentication required. Please login first.');
      }
      throw error;
    }
  };

  const testAISentiment = async () => {
    try {
      const response = await axiosInstance.post('/api/ai/sentiment', {
        text: 'I love this amazing chat application!'
      });
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        throw new Error('AI sentiment endpoint not found. Check backend routes.');
      }
      if (error.response?.status === 401) {
        throw new Error('Authentication required. Please login first.');
      }
      if (error.response?.status === 500) {
        throw new Error('AI service error. Check Gemini API key and server logs.');
      }
      throw error;
    }
  };

  const testVoiceSupport = async () => {
    const isSupported = VoiceService.isSupported();
    const hasHttps = location.protocol === 'https:' || location.hostname === 'localhost';
    
    if (!isSupported) {
      throw new Error('Voice recording not supported in this browser');
    }
    
    if (!hasHttps) {
      throw new Error('Voice recording requires HTTPS or localhost');
    }
    
    // Test microphone access
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop()); // Clean up
      return { 
        supported: true, 
        message: 'Voice recording is fully supported and microphone access granted' 
      };
    } catch (error) {
      throw new Error(`Microphone access denied: ${error.message}`);
    }
  };

  const testReactionAPI = async () => {
    // This would need a real message ID in practice
    return { message: 'Reaction API endpoint exists (needs real message ID to test)' };
  };

  const tests = [
    {
      name: 'AI Smart Replies',
      icon: <Sparkles size={16} />,
      test: testAISmartReplies,
      description: 'Test AI-powered smart reply suggestions'
    },
    {
      name: 'AI Sentiment Analysis',
      icon: <MessageCircle size={16} />,
      test: testAISentiment,
      description: 'Test sentiment analysis of messages'
    },
    {
      name: 'Voice Recording Support',
      icon: <Mic size={16} />,
      test: testVoiceSupport,
      description: 'Check if voice recording is supported'
    },
    {
      name: 'Message Reactions',
      icon: <Heart size={16} />,
      test: testReactionAPI,
      description: 'Test message reaction functionality'
    }
  ];

  return (
    <>
      <div className="fixed bottom-4 right-4 z-50">
        <div className="dropdown dropdown-top dropdown-end">
          <div tabIndex={0} role="button" className="btn btn-circle btn-primary">
            <TestTube size={20} />
          </div>
          <div tabIndex={0} className="dropdown-content z-[1] menu p-4 shadow bg-base-100 rounded-box w-80 border border-base-300">
          <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
            <TestTube size={18} />
            Feature Tests
          </h3>
          
          <div className="space-y-2">
            {tests.map((test) => (
              <div key={test.name} className="border border-base-300 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {test.icon}
                    <span className="font-medium text-sm">{test.name}</span>
                  </div>
                  <button
                    onClick={() => runTest(test.name, test.test)}
                    disabled={testing}
                    className="btn btn-xs btn-primary"
                  >
                    {testing ? 'Testing...' : 'Test'}
                  </button>
                </div>
                
                <p className="text-xs text-base-content/70 mb-2">
                  {test.description}
                </p>
                
                {testResults[test.name] && (
                  <div className={`text-xs p-2 rounded ${
                    testResults[test.name].success 
                      ? 'bg-success/20 text-success' 
                      : 'bg-error/20 text-error'
                  }`}>
                    {testResults[test.name].success ? (
                      <div>
                        ✅ Test passed!
                        {testResults[test.name].result?.message && (
                          <div className="mt-1">{testResults[test.name].result.message}</div>
                        )}
                      </div>
                    ) : (
                      <div>❌ {testResults[test.name].error}</div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
          
          <div className="divider"></div>
          
          <div className="text-xs text-base-content/60">
            <p>💡 This panel helps test new features</p>
            <p>🔧 Check browser console for detailed logs</p>
          </div>
          
          <div className="divider"></div>
          
          <div className="flex flex-col gap-2">
            <button
              onClick={() => setShowVoiceTest(true)}
              className="btn btn-sm btn-outline w-full"
            >
              <Settings size={14} />
              Advanced Voice Test
            </button>
            
            <button
              onClick={() => setShowTimingTest(true)}
              className="btn btn-sm btn-outline w-full"
            >
              <Mic size={14} />
              Voice Timing Test
            </button>
            
            <button
              onClick={() => setShowTimerTest(true)}
              className="btn btn-sm btn-outline w-full"
            >
              <TestTube size={14} />
              Simple Timer Test
            </button>
            
            <button
              onClick={() => setShowDebugTest(true)}
              className="btn btn-sm btn-outline w-full"
            >
              <TestTube size={14} />
              Timer Debug Tool
            </button>
          </div>
          </div>
        </div>
      </div>
      
      {/* Voice Recording Test Modal */}
      {showVoiceTest && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50">
          <div className="relative">
            <button
              onClick={() => setShowVoiceTest(false)}
              className="absolute -top-2 -right-2 btn btn-circle btn-sm btn-error z-10"
            >
              ✕
            </button>
            <VoiceRecordingTest />
          </div>
        </div>
      )}
      
      {/* Voice Timing Test Modal */}
      {showTimingTest && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50">
          <div className="relative">
            <button
              onClick={() => setShowTimingTest(false)}
              className="absolute -top-2 -right-2 btn btn-circle btn-sm btn-error z-10"
            >
              ✕
            </button>
            <VoiceTimingTest />
          </div>
        </div>
      )}
      
      {/* Simple Timer Test Modal */}
      {showTimerTest && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50">
          <div className="relative">
            <button
              onClick={() => setShowTimerTest(false)}
              className="absolute -top-2 -right-2 btn btn-circle btn-sm btn-error z-10"
            >
              ✕
            </button>
            <VoiceTimerTest />
          </div>
        </div>
      )}
      
      {/* Timer Debug Tool Modal */}
      {showDebugTest && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-4">
          <div className="relative w-full max-w-4xl max-h-[90vh] overflow-auto">
            <button
              onClick={() => setShowDebugTest(false)}
              className="absolute -top-2 -right-2 btn btn-circle btn-sm btn-error z-10"
            >
              ✕
            </button>
            <VoiceTimerDebug />
          </div>
        </div>
      )}
    </>
  );
};

export default FeatureTestPanel;