import React, { useState } from 'react';
import { 
  Bold, 
  Italic, 
  Strikethrough, 
  Code, 
  Hash, 
  AtSign, 
  HelpCircle,
  Type,
  Eye,
  EyeOff
} from 'lucide-react';
import { getFormattingHelp, previewMessage } from '../lib/messageFormatter';

const FormattingToolbar = ({ 
  textareaRef, 
  value, 
  onChange, 
  users = [],
  showPreview = false,
  onTogglePreview 
}) => {
  const [showHelp, setShowHelp] = useState(false);
  
  // Apply formatting to selected text
  const applyFormatting = (before, after = '') => {
    if (!textareaRef.current) return;
    
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    
    let newText;
    let newCursorPos;
    
    if (selectedText) {
      // Text is selected - wrap it
      newText = value.substring(0, start) + before + selectedText + after + value.substring(end);
      newCursorPos = start + before.length + selectedText.length + after.length;
    } else {
      // No selection - insert formatting markers
      newText = value.substring(0, start) + before + after + value.substring(start);
      newCursorPos = start + before.length;
    }
    
    onChange(newText);
    
    // Restore cursor position
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };
  
  const formatButtons = [
    {
      icon: Bold,
      title: 'Bold (Ctrl+B)',
      action: () => applyFormatting('**', '**'),
      shortcut: 'Ctrl+B'
    },
    {
      icon: Italic,
      title: 'Italic (Ctrl+I)',
      action: () => applyFormatting('*', '*'),
      shortcut: 'Ctrl+I'
    },
    {
      icon: Strikethrough,
      title: 'Strikethrough',
      action: () => applyFormatting('~~', '~~')
    },
    {
      icon: Code,
      title: 'Inline Code',
      action: () => applyFormatting('`', '`')
    },
    {
      icon: Type,
      title: 'Code Block',
      action: () => applyFormatting('```\n', '\n```')
    },
    {
      icon: AtSign,
      title: 'Mention User',
      action: () => applyFormatting('@')
    },
    {
      icon: Hash,
      title: 'Hashtag',
      action: () => applyFormatting('#')
    }
  ];
  
  // Handle keyboard shortcuts
  const handleKeyDown = (e) => {
    if (e.ctrlKey || e.metaKey) {
      switch (e.key.toLowerCase()) {
        case 'b':
          e.preventDefault();
          applyFormatting('**', '**');
          break;
        case 'i':
          e.preventDefault();
          applyFormatting('*', '*');
          break;
        case 'u':
          e.preventDefault();
          applyFormatting('~~', '~~');
          break;
        case '`':
          e.preventDefault();
          applyFormatting('`', '`');
          break;
      }
    }
  };
  
  const preview = previewMessage(value, users);
  
  return (
    <div className="border-t border-base-300 bg-base-200/50">
      {/* Formatting Buttons */}
      <div className="flex items-center justify-between p-2">
        <div className="flex items-center gap-1">
          {formatButtons.map((button, index) => {
            const Icon = button.icon;
            return (
              <button
                key={index}
                type="button"
                className="btn btn-ghost btn-xs hover:btn-primary"
                onClick={button.action}
                title={button.title}
              >
                <Icon size={14} />
              </button>
            );
          })}
        </div>
        
        <div className="flex items-center gap-1">
          {/* Preview Toggle */}
          {onTogglePreview && (
            <button
              type="button"
              className={`btn btn-xs ${
                showPreview ? 'btn-primary' : 'btn-ghost'
              }`}
              onClick={onTogglePreview}
              title={showPreview ? 'Hide Preview' : 'Show Preview'}
            >
              {showPreview ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          )}
          
          {/* Help Button */}
          <button
            type="button"
            className="btn btn-ghost btn-xs"
            onClick={() => setShowHelp(!showHelp)}
            title="Formatting Help"
          >
            <HelpCircle size={14} />
          </button>
        </div>
      </div>
      
      {/* Message Stats */}
      {(preview.mentions.length > 0 || preview.hashtags.length > 0 || preview.hasFormatting) && (
        <div className="px-2 pb-2">
          <div className="flex items-center gap-3 text-xs text-base-content/60">
            {preview.hasFormatting && (
              <span className="flex items-center gap-1">
                <Type size={12} />
                Formatted
              </span>
            )}
            {preview.mentions.length > 0 && (
              <span className="flex items-center gap-1">
                <AtSign size={12} />
                {preview.mentions.length} mention{preview.mentions.length !== 1 ? 's' : ''}
              </span>
            )}
            {preview.hashtags.length > 0 && (
              <span className="flex items-center gap-1">
                <Hash size={12} />
                {preview.hashtags.length} hashtag{preview.hashtags.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>
      )}
      
      {/* Preview */}
      {showPreview && value.trim() && (
        <div className="border-t border-base-300 p-3">
          <div className="text-xs text-base-content/60 mb-2 font-medium">Preview:</div>
          <div 
            className="prose prose-sm max-w-none bg-base-100 p-3 rounded-lg border"
            dangerouslySetInnerHTML={{ __html: preview.formatted }}
          />
        </div>
      )}
      
      {/* Help Modal */}
      {showHelp && (
        <div className="border-t border-base-300 p-3">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium text-sm">Formatting Help</h3>
            <button
              className="btn btn-ghost btn-xs"
              onClick={() => setShowHelp(false)}
            >
              ×
            </button>
          </div>
          
          <div className="space-y-2">
            {getFormattingHelp().map((item, index) => (
              <div key={index} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <code className="bg-base-300 px-1 py-0.5 rounded font-mono">
                    {item.syntax}
                  </code>
                  <span className="text-base-content/70">{item.description}</span>
                </div>
                <button
                  className="btn btn-ghost btn-xs"
                  onClick={() => {
                    const textarea = textareaRef.current;
                    if (textarea) {
                      const start = textarea.selectionStart;
                      const newText = value.substring(0, start) + item.example + value.substring(start);
                      onChange(newText);
                      setTimeout(() => {
                        textarea.focus();
                        textarea.setSelectionRange(
                          start + item.example.length,
                          start + item.example.length
                        );
                      }, 0);
                    }
                    setShowHelp(false);
                  }}
                  title="Insert example"
                >
                  Insert
                </button>
              </div>
            ))}
          </div>
          
          <div className="mt-3 pt-2 border-t border-base-300 text-xs text-base-content/60">
            <strong>Keyboard Shortcuts:</strong> Ctrl+B (bold), Ctrl+I (italic), Ctrl+U (strikethrough)
          </div>
        </div>
      )}
      
      {/* Add keyboard event listener */}
      <div 
        onKeyDown={handleKeyDown}
        style={{ position: 'absolute', left: '-9999px', opacity: 0 }}
        tabIndex={-1}
      />
    </div>
  );
};

export default FormattingToolbar;