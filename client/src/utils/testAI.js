// Browser-based AI endpoint testing utility
import axiosInstance from '../lib/axios';

export const testAIEndpoints = async () => {
  console.log('🧪 Testing AI Endpoints with Authentication...\n');
  
  const tests = [
    {
      name: 'AI Health Check',
      test: async () => {
        const response = await fetch('/api/ai/health');
        return await response.json();
      }
    },
    {
      name: 'Smart Replies',
      test: async () => {
        const response = await axiosInstance.post('/api/ai/smart-replies', {
          message: 'How are you doing today?',
          context: []
        });
        return response.data;
      }
    },
    {
      name: 'Sentiment Analysis',
      test: async () => {
        const response = await axiosInstance.post('/api/ai/sentiment', {
          text: 'I love this amazing chat application!'
        });
        return response.data;
      }
    },
    {
      name: 'Translation',
      test: async () => {
        const response = await axiosInstance.post('/api/ai/translate', {
          text: 'Hello, how are you?',
          targetLang: 'es'
        });
        return response.data;
      }
    }
  ];

  const results = {};

  for (const { name, test } of tests) {
    try {
      console.log(`🔍 Testing ${name}...`);
      const result = await test();
      console.log(`✅ ${name} passed:`, result);
      results[name] = { success: true, result };
    } catch (error) {
      console.log(`❌ ${name} failed:`, error.message);
      results[name] = { success: false, error: error.message };
    }
  }

  console.log('\n📊 Test Summary:');
  Object.entries(results).forEach(([name, result]) => {
    console.log(`${result.success ? '✅' : '❌'} ${name}: ${result.success ? 'PASSED' : result.error}`);
  });

  return results;
};

// Make it available globally for console testing
if (typeof window !== 'undefined') {
  window.testAIEndpoints = testAIEndpoints;
}