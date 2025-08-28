/**
 * Message formatting utility for handling rich text formatting
 * Converts markdown-like syntax to HTML or structured format
 */

export const formatMessage = (text, options = {}) => {
  if (!text || typeof text !== 'string') {
    return text;
  }

  const { 
    outputFormat = 'html', // 'html' or 'structured'
    sanitize = true 
  } = options;

  let formattedText = text;

  // Define formatting patterns
  const patterns = [
    // Bold: **text** or __text__
    {
      regex: /\*\*(.*?)\*\*/g,
      html: '<strong>$1</strong>',
      structured: { type: 'bold', content: '$1' }
    },
    {
      regex: /__(.*?)__/g,
      html: '<strong>$1</strong>',
      structured: { type: 'bold', content: '$1' }
    },
    
    // Italic: *text* or _text_
    {
      regex: /(?<!\*)\*([^*]+)\*(?!\*)/g,
      html: '<em>$1</em>',
      structured: { type: 'italic', content: '$1' }
    },
    {
      regex: /(?<!_)_([^_]+)_(?!_)/g,
      html: '<em>$1</em>',
      structured: { type: 'italic', content: '$1' }
    },
    
    // Strikethrough: ~~text~~
    {
      regex: /~~(.*?)~~/g,
      html: '<del>$1</del>',
      structured: { type: 'strikethrough', content: '$1' }
    },
    
    // Code: `text`
    {
      regex: /`([^`]+)`/g,
      html: '<code>$1</code>',
      structured: { type: 'code', content: '$1' }
    },
    
    // Code block: ```text```
    {
      regex: /```([\s\S]*?)```/g,
      html: '<pre><code>$1</code></pre>',
      structured: { type: 'codeblock', content: '$1' }
    },
    
    // Underline: __text__ (alternative pattern)
    {
      regex: /<u>(.*?)<\/u>/g,
      html: '<u>$1</u>',
      structured: { type: 'underline', content: '$1' }
    }
  ];

  if (outputFormat === 'html') {
    // Apply HTML formatting
    patterns.forEach(pattern => {
      formattedText = formattedText.replace(pattern.regex, pattern.html);
    });
    
    // Convert line breaks to <br> tags
    formattedText = formattedText.replace(/\n/g, '<br>');
    
    return formattedText;
  } else if (outputFormat === 'structured') {
    // Return structured format for frontend processing
    const segments = [];
    let lastIndex = 0;
    
    // This is a simplified version - for full implementation,
    // you'd need a proper parser
    return {
      originalText: text,
      hasFormatting: hasFormattingMarkers(text),
      formattedHtml: formatMessage(text, { outputFormat: 'html' })
    };
  }

  return formattedText;
};

export const hasFormattingMarkers = (text) => {
  if (!text || typeof text !== 'string') {
    return false;
  }

  const formattingPatterns = [
    /\*\*.*?\*\*/,  // Bold
    /__.*?__/,      // Bold alternative
    /(?<!\*)\*[^*]+\*(?!\*)/,  // Italic
    /(?<!_)_[^_]+_(?!_)/,      // Italic alternative
    /~~.*?~~/,      // Strikethrough
    /`[^`]+`/,      // Code
    /```[\s\S]*?```/, // Code block
    /<u>.*?<\/u>/   // Underline
  ];

  return formattingPatterns.some(pattern => pattern.test(text));
};

export const stripFormatting = (text) => {
  if (!text || typeof text !== 'string') {
    return text;
  }

  return text
    .replace(/\*\*(.*?)\*\*/g, '$1')  // Bold
    .replace(/__(.*?)__/g, '$1')     // Bold alternative
    .replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '$1')  // Italic
    .replace(/(?<!_)_([^_]+)_(?!_)/g, '$1')      // Italic alternative
    .replace(/~~(.*?)~~/g, '$1')     // Strikethrough
    .replace(/`([^`]+)`/g, '$1')     // Code
    .replace(/```([\s\S]*?)```/g, '$1') // Code block
    .replace(/<u>(.*?)<\/u>/g, '$1') // Underline
    .trim();
};

export const getFormattingInfo = (text) => {
  if (!text || typeof text !== 'string') {
    return {
      hasFormatting: false,
      types: [],
      originalText: text,
      plainText: text
    };
  }

  const types = [];
  
  if (/\*\*.*?\*\*|__.*?__/.test(text)) types.push('bold');
  if (/(?<!\*)\*[^*]+\*(?!\*)|(?<!_)_[^_]+_(?!_)/.test(text)) types.push('italic');
  if (/~~.*?~~/.test(text)) types.push('strikethrough');
  if (/`[^`]+`/.test(text)) types.push('code');
  if (/```[\s\S]*?```/.test(text)) types.push('codeblock');
  if (/<u>.*?<\/u>/.test(text)) types.push('underline');

  return {
    hasFormatting: types.length > 0,
    types,
    originalText: text,
    plainText: stripFormatting(text),
    formattedHtml: formatMessage(text, { outputFormat: 'html' })
  };
};

// Export default object with all functions
export default {
  formatMessage,
  hasFormattingMarkers,
  stripFormatting,
  getFormattingInfo
};