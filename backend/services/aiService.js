// AI service using Google Gemini API
// Add your GEMINI_API_KEY to the .env file

class AIService {
  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY;
    this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';
    
    if (!this.apiKey) {
      console.warn('⚠️ GEMINI_API_KEY not found in environment variables');
      console.warn('📝 Add GEMINI_API_KEY=your_api_key_here to your .env file');
    }
  }

  async makeRequest(prompt, options = {}) {
    try {
      if (!this.apiKey) {
        throw new Error('Gemini API key not configured');
      }

      const response = await fetch(`${this.baseUrl}?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
            ...options
          }
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Gemini API error! status: ${response.status}, message: ${errorData}`);
      }

      const data = await response.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    } catch (error) {
      console.error('AI Service Error:', error);
      throw error;
    }
  }

  // Smart reply suggestions
  async generateSmartReplies(message, conversationContext = []) {
    try {
      const context = conversationContext.slice(-5).join('\n');
      const prompt = `Generate 3 short, natural reply suggestions for this message: "${message}"

Context: ${context}

Provide only the reply suggestions, one per line, without numbering or extra text. Keep each reply under 10 words.`;
      
      const response = await this.makeRequest(prompt, {
        maxOutputTokens: 100,
        temperature: 0.8
      });

      const suggestions = response.split('\n')
        .map(line => line.trim())
        .filter(line => line && !line.match(/^\d+[.)]/)) // Remove numbered lines
        .slice(0, 3);

      return suggestions.length > 0 ? suggestions : ['Thanks!', 'Got it!', 'Sounds good!'];
    } catch (error) {
      console.error('Error generating smart replies:', error);
      return ['Thanks!', 'Got it!', 'Sounds good!'];
    }
  }

  // Sentiment analysis
  async analyzeSentiment(text) {
    try {
      const prompt = `Analyze the sentiment of this text: "${text}"

Respond with only one word: POSITIVE, NEGATIVE, or NEUTRAL`;
      
      const response = await this.makeRequest(prompt, {
        maxOutputTokens: 10,
        temperature: 0.1
      });

      const sentiment = response.trim().toUpperCase();
      const validSentiments = ['POSITIVE', 'NEGATIVE', 'NEUTRAL'];
      const label = validSentiments.includes(sentiment) ? sentiment : 'NEUTRAL';
      
      // Calculate a score based on the sentiment
      const score = label === 'POSITIVE' ? 0.8 : label === 'NEGATIVE' ? 0.2 : 0.5;
      
      return {
        label,
        score,
        emoji: this.getSentimentEmoji(label),
      };
    } catch (error) {
      console.error('Error analyzing sentiment:', error);
      return { label: 'NEUTRAL', score: 0.5, emoji: '😐' };
    }
  }

  // Message translation
  async translateMessage(text, targetLang = 'es') {
    try {
      const langNames = {
        'es': 'Spanish',
        'fr': 'French',
        'de': 'German',
        'it': 'Italian',
        'pt': 'Portuguese',
        'ru': 'Russian',
        'ja': 'Japanese',
        'ko': 'Korean',
        'zh': 'Chinese'
      };
      
      const targetLanguage = langNames[targetLang] || 'Spanish';
      const prompt = `Translate this text to ${targetLanguage}: "${text}"

Provide only the translation, no additional text.`;
      
      const response = await this.makeRequest(prompt, {
        maxOutputTokens: 200,
        temperature: 0.3
      });

      const translatedText = response.trim();
      
      return {
        originalText: text,
        translatedText: translatedText || text,
        targetLanguage: targetLang,
      };
    } catch (error) {
      console.error('Error translating message:', error);
      return { originalText: text, translatedText: text, targetLanguage: targetLang };
    }
  }

  // Conversation summarization
  async summarizeConversation(messages) {
    try {
      const conversation = messages.map(m => `${m.sender}: ${m.text}`).join('\n');
      
      if (conversation.length < 100) {
        return 'Conversation too short to summarize';
      }

      const prompt = `Summarize this conversation in 2-3 sentences:

${conversation}

Summary:`;

      const response = await this.makeRequest(prompt, {
        maxOutputTokens: 150,
        temperature: 0.5
      });

      return response.trim() || 'Unable to generate summary';
    } catch (error) {
      console.error('Error summarizing conversation:', error);
      return 'Unable to generate summary';
    }
  }

  // Spam detection (using sentiment + keyword analysis)
  async detectSpam(text) {
    try {
      const spamKeywords = [
        'click here', 'free money', 'urgent', 'winner', 'congratulations',
        'limited time', 'act now', 'call now', 'cash', 'prize'
      ];

      const sentiment = await this.analyzeSentiment(text);
      const hasSpamKeywords = spamKeywords.some(keyword => 
        text.toLowerCase().includes(keyword.toLowerCase())
      );

      const spamScore = hasSpamKeywords ? 0.8 : 0.2;
      
      return {
        isSpam: spamScore > 0.5,
        confidence: spamScore,
        reasons: hasSpamKeywords ? ['Contains spam keywords'] : [],
      };
    } catch (error) {
      console.error('Error detecting spam:', error);
      return { isSpam: false, confidence: 0, reasons: [] };
    }
  }

  // Auto-complete suggestions
  async getAutoComplete(partialText) {
    try {
      if (partialText.length < 3) {
        return [];
      }

      const commonCompletions = [
        'How are you?',
        'What are you doing?',
        'See you later!',
        'Thanks for your help!',
        'Have a great day!',
        'Let me know if you need anything',
        'Talk to you soon!',
      ];

      // Simple matching for now, can be enhanced with AI
      return commonCompletions.filter(completion =>
        completion.toLowerCase().startsWith(partialText.toLowerCase())
      ).slice(0, 3);
    } catch (error) {
      console.error('Error getting auto-complete:', error);
      return [];
    }
  }

  getSentimentEmoji(label) {
    const emojiMap = {
      'POSITIVE': '😊',
      'NEGATIVE': '😔',
      'NEUTRAL': '😐',
      'LABEL_0': '😔', // Negative
      'LABEL_1': '😐', // Neutral  
      'LABEL_2': '😊', // Positive
    };
    return emojiMap[label] || '😐';
  }

  // Content moderation
  async moderateContent(text) {
    try {
      const inappropriateWords = [
        // Add your moderation keywords here
        'spam', 'abuse', 'hate'
      ];

      const hasInappropriateContent = inappropriateWords.some(word =>
        text.toLowerCase().includes(word.toLowerCase())
      );

      const sentiment = await this.analyzeSentiment(text);
      const isNegative = sentiment.label === 'NEGATIVE' && sentiment.score > 0.8;

      return {
        needsModeration: hasInappropriateContent || isNegative,
        reasons: [
          ...(hasInappropriateContent ? ['Contains inappropriate language'] : []),
          ...(isNegative ? ['Highly negative sentiment'] : []),
        ],
        sentiment,
      };
    } catch (error) {
      console.error('Error moderating content:', error);
      return { needsModeration: false, reasons: [], sentiment: null };
    }
  }
}

export default new AIService();