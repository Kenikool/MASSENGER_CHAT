import React, { useState, useEffect } from 'react';
import { Sparkles, RefreshCw } from 'lucide-react';
import axiosInstance from '../lib/axios';

const SmartReplies = ({ lastMessage, conversationHistory, onSelectReply }) => {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    if (lastMessage && lastMessage.text) {
      generateSuggestions();
    }
  }, [lastMessage]);

  const generateSuggestions = async () => {
    if (!lastMessage?.text) return;

    setLoading(true);
    try {
      const response = await axiosInstance.post('/ai/smart-replies', {
        message: lastMessage.text,
        context: conversationHistory.slice(-5).map(m => m.text).filter(Boolean),
      });

      setSuggestions(response.data.suggestions || []);
      setShowSuggestions(true);
    } catch (error) {
      console.error('Error generating smart replies:', error);
      // Fallback to predefined responses
      setSuggestions(getContextualReplies(lastMessage.text));
      setShowSuggestions(true);
    } finally {
      setLoading(false);
    }
  };

  const getContextualReplies = (message) => {
    const lowerMessage = message.toLowerCase();
    
    // Question responses
    if (lowerMessage.includes('how are you') || lowerMessage.includes('how\'s it going')) {
      return ['I\'m doing great, thanks!', 'Pretty good, how about you?', 'All good here! 😊'];
    }
    
    // Greeting responses
    if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
      return ['Hello! 👋', 'Hey there!', 'Hi! How\'s your day going?'];
    }
    
    // Thank you responses
    if (lowerMessage.includes('thank') || lowerMessage.includes('thanks')) {
      return ['You\'re welcome!', 'No problem! 😊', 'Happy to help!'];
    }
    
    // Agreement/disagreement
    if (lowerMessage.includes('agree') || lowerMessage.includes('right')) {
      return ['Absolutely!', 'I think so too', 'Exactly! 💯'];
    }
    
    // Plans/invitations
    if (lowerMessage.includes('want to') || lowerMessage.includes('let\'s')) {
      return ['Sounds good!', 'I\'m in!', 'Count me in! 🎉'];
    }
    
    // Default responses
    return ['Got it!', 'Thanks for letting me know', 'Sounds good! 👍'];
  };

  const handleSelectReply = (reply) => {
    onSelectReply(reply);
    setShowSuggestions(false);
  };

  const refreshSuggestions = () => {
    generateSuggestions();
  };

  if (!showSuggestions || suggestions.length === 0) {
    return null;
  }

  return (
    <div className=\"px-4 pb-2\">
      <div className=\"flex items-center gap-2 mb-2\">
        <Sparkles size={16} className=\"text-primary\" />
        <span className=\"text-sm font-medium text-base-content/80\">
          Smart Replies
        </span>
        <button
          onClick={refreshSuggestions}
          className=\"btn btn-ghost btn-xs btn-circle ml-auto\"
          disabled={loading}
          title=\"Refresh suggestions\"
        >
          <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>
      
      <div className=\"flex flex-wrap gap-2\">
        {suggestions.map((suggestion, index) => (
          <button
            key={index}
            onClick={() => handleSelectReply(suggestion)}
            className=\"btn btn-sm btn-outline hover:btn-primary transition-colors\"
            disabled={loading}
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
};

export default SmartReplies;