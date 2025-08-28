// Message Formatting Utility
// Supports markdown-like formatting for rich text messages

/**
 * Parse and format message text with markdown-like syntax
 * @param {string} text - Raw message text
 * @param {Array} users - Array of users for @mention parsing
 * @returns {string} - Formatted HTML string
 */
export const formatMessage = (text, users = []) => {
  if (!text) return '';
  
  let formattedText = text;
  
  // Escape HTML to prevent XSS
  formattedText = formattedText
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
  
  // Bold: **text** or __text__
  formattedText = formattedText.replace(
    /\*\*(.*?)\*\*|__(.*?)__/g, 
    '<strong class="font-bold">$1$2</strong>'
  );
  
  // Italic: *text* or _text_ (but not if already in bold)
  formattedText = formattedText.replace(
    /(?<!\*)\*([^*]+?)\*(?!\*)|(?<!_)_([^_]+?)_(?!_)/g,
    '<em class="italic">$1$2</em>'
  );
  
  // Strikethrough: ~~text~~
  formattedText = formattedText.replace(
    /~~(.*?)~~/g,
    '<del class="line-through opacity-70">$1</del>'
  );
  
  // Inline code: `code`
  formattedText = formattedText.replace(
    /`([^`]+?)`/g,
    '<code class="bg-base-300 text-primary px-1 py-0.5 rounded text-sm font-mono">$1</code>'
  );
  
  // Code blocks: ```code```
  formattedText = formattedText.replace(
    /```([\s\S]*?)```/g,
    '<pre class="bg-base-300 text-primary p-3 rounded-lg mt-2 mb-2 overflow-x-auto"><code class="font-mono text-sm whitespace-pre">$1</code></pre>'
  );
  
  // Mentions: @username
  if (users && users.length > 0) {
    users.forEach(user => {
      const mentionRegex = new RegExp(`@${user.fullName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'gi');
      formattedText = formattedText.replace(
        mentionRegex,
        `<span class="bg-primary/20 text-primary px-1 py-0.5 rounded font-medium">@${user.fullName}</span>`
      );
    });
  }
  
  // Hashtags: #hashtag
  formattedText = formattedText.replace(
    /#([a-zA-Z0-9_]+)/g,
    '<span class="text-secondary font-medium">#$1</span>'
  );
  
  // URLs: http(s)://...
  formattedText = formattedText.replace(
    /(https?:\/\/[^\s]+)/g,
    '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-primary underline hover:text-primary-focus">$1</a>'
  );
  
  // Email addresses
  formattedText = formattedText.replace(
    /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g,
    '<a href="mailto:$1" class="text-primary underline hover:text-primary-focus">$1</a>'
  );
  
  // Line breaks
  formattedText = formattedText.replace(/\n/g, '<br>');
  
  return formattedText;
};

/**
 * Extract mentions from message text
 * @param {string} text - Message text
 * @param {Array} users - Array of users
 * @returns {Array} - Array of mentioned user IDs
 */
export const extractMentions = (text, users = []) => {
  if (!text || !users.length) return [];
  
  const mentions = [];
  users.forEach(user => {
    const mentionRegex = new RegExp(`@${user.fullName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'gi');
    if (mentionRegex.test(text)) {
      mentions.push(user._id);
    }
  });
  
  return mentions;
};

/**
 * Extract hashtags from message text
 * @param {string} text - Message text
 * @returns {Array} - Array of hashtags
 */
export const extractHashtags = (text) => {
  if (!text) return [];
  
  const hashtagRegex = /#([a-zA-Z0-9_]+)/g;
  const hashtags = [];
  let match;
  
  while ((match = hashtagRegex.exec(text)) !== null) {
    hashtags.push(match[1]);
  }
  
  return hashtags;
};

/**
 * Check if text contains formatting
 * @param {string} text - Message text
 * @returns {boolean} - True if text contains formatting
 */
export const hasFormatting = (text) => {
  if (!text) return false;
  
  const formattingPatterns = [
    /\*\*.*?\*\*/,  // Bold
    /__.*?__/,      // Bold alternative
    /\*.*?\*/,      // Italic
    /_.*?_/,        // Italic alternative
    /~~.*?~~/,      // Strikethrough
    /`.*?`/,        // Inline code
    /```[\s\S]*?```/, // Code block
    /@\w+/,         // Mentions
    /#\w+/,         // Hashtags
  ];
  
  return formattingPatterns.some(pattern => pattern.test(text));
};

/**
 * Get formatting help text
 * @returns {Array} - Array of formatting examples
 */
export const getFormattingHelp = () => {
  return [
    { syntax: '**bold**', description: 'Bold text', example: '**Hello World**' },
    { syntax: '*italic*', description: 'Italic text', example: '*Hello World*' },
    { syntax: '~~strikethrough~~', description: 'Strikethrough text', example: '~~Hello World~~' },
    { syntax: '`code`', description: 'Inline code', example: '`console.log("hello")`' },
    { syntax: '```code block```', description: 'Code block', example: '```\nfunction hello() {\n  return "world";\n}\n```' },
    { syntax: '@username', description: 'Mention user', example: '@John Doe' },
    { syntax: '#hashtag', description: 'Hashtag', example: '#important' },
  ];
};

/**
 * Preview formatted message
 * @param {string} text - Raw message text
 * @param {Array} users - Array of users for mentions
 * @returns {Object} - Object with formatted text and metadata
 */
export const previewMessage = (text, users = []) => {
  const formatted = formatMessage(text, users);
  const mentions = extractMentions(text, users);
  const hashtags = extractHashtags(text);
  const hasFormat = hasFormatting(text);
  
  return {
    formatted,
    mentions,
    hashtags,
    hasFormatting: hasFormat,
    length: text.length
  };
};