import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  Filter, 
  Calendar, 
  User, 
  FileText, 
  Image, 
  Mic, 
  X, 
  ChevronDown,
  Clock,
  Hash,
  AtSign,
  Download,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { formatMessageTime } from '../lib/utils';
import { formatMessage } from '../lib/messageFormatter';
import { useAuthStore } from '../store/useAuthStore';
import { useChatStore } from '../store/useChatStore';
import axiosInstance from '../lib/axios';
import toast from 'react-hot-toast';

const AdvancedSearch = ({ isOpen, onClose, selectedUser }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  
  const searchInputRef = useRef(null);
  const { authUser } = useAuthStore();
  const { users } = useChatStore();
  
  // Search filters
  const [filters, setFilters] = useState({
    sender: '', // User ID or 'me' for current user
    messageType: 'all', // all, text, image, voice, file
    dateFrom: '',
    dateTo: '',
    hasAttachment: false,
    hasFormatting: false,
    inThread: false,
    sortBy: 'date', // date, relevance
    sortOrder: 'desc' // desc, asc
  });

  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (searchQuery.trim()) {
      const debounceTimer = setTimeout(() => {
        handleSearch();
      }, 300);
      return () => clearTimeout(debounceTimer);
    } else {
      setSearchResults([]);
      setTotalResults(0);
    }
  }, [searchQuery, filters]);

  const handleSearch = async (page = 1) => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    try {
      const searchParams = {
        query: searchQuery.trim(),
        page,
        limit: 20,
        conversationWith: selectedUser?._id,
        ...filters
      };
      
      const response = await axiosInstance.post('/api/messages/search', searchParams);
      
      if (page === 1) {
        setSearchResults(response.data.messages);
      } else {
        setSearchResults(prev => [...prev, ...response.data.messages]);
      }
      
      setTotalResults(response.data.total);
      setHasMore(response.data.hasMore);
      setCurrentPage(page);
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Search failed. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleLoadMore = () => {
    if (hasMore && !isSearching) {
      handleSearch(currentPage + 1);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({
      sender: '',
      messageType: 'all',
      dateFrom: '',
      dateTo: '',
      hasAttachment: false,
      hasFormatting: false,
      inThread: false,
      sortBy: 'date',
      sortOrder: 'desc'
    });
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.sender) count++;
    if (filters.messageType !== 'all') count++;
    if (filters.dateFrom) count++;
    if (filters.dateTo) count++;
    if (filters.hasAttachment) count++;
    if (filters.hasFormatting) count++;
    if (filters.inThread) count++;
    if (filters.sortBy !== 'date' || filters.sortOrder !== 'desc') count++;
    return count;
  };

  const highlightSearchTerm = (text, query) => {
    if (!query.trim()) return text;
    
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.replace(regex, '<mark class="bg-yellow-200 text-yellow-900 px-1 rounded">$1</mark>');
  };

  const getMessageTypeIcon = (message) => {
    if (message.image) return <Image size={14} className="text-blue-500" />;
    if (message.voiceUrl) return <Mic size={14} className="text-green-500" />;
    if (message.fileUrl) return <FileText size={14} className="text-purple-500" />;
    return <FileText size={14} className="text-gray-500" />;
  };

  const exportSearchResults = async () => {
    try {
      const exportData = {
        query: searchQuery,
        filters,
        results: searchResults,
        exportedAt: new Date().toISOString(),
        totalResults
      };
      
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json'
      });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `search-results-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success('Search results exported!');
    } catch (error) {
      toast.error('Failed to export results');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-4">
      <div className="w-full max-w-4xl bg-base-100 rounded-xl shadow-xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-base-300">
          <div className="flex items-center gap-3">
            <Search className="text-primary" size={20} />
            <h2 className="text-lg font-semibold">Advanced Search</h2>
            {selectedUser && (
              <span className="text-sm text-base-content/60">
                in conversation with {selectedUser.fullName}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="btn btn-ghost btn-sm btn-circle"
          >
            <X size={16} />
          </button>
        </div>

        {/* Search Input */}
        <div className="p-4 border-b border-base-300">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-base-content/40" size={16} />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search messages, @mentions, #hashtags..."
              className="input input-bordered w-full pl-10 pr-12"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {isSearching && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <span className="loading loading-spinner loading-sm" />
              </div>
            )}
          </div>
          
          {/* Quick Search Suggestions */}
          <div className="flex flex-wrap gap-2 mt-3">
            <button
              onClick={() => setSearchQuery('@')}
              className="btn btn-ghost btn-xs"
            >
              <AtSign size={12} /> Mentions
            </button>
            <button
              onClick={() => setSearchQuery('#')}
              className="btn btn-ghost btn-xs"
            >
              <Hash size={12} /> Hashtags
            </button>
            <button
              onClick={() => handleFilterChange('hasAttachment', true)}
              className="btn btn-ghost btn-xs"
            >
              <Image size={12} /> With Images
            </button>
            <button
              onClick={() => handleFilterChange('messageType', 'voice')}
              className="btn btn-ghost btn-xs"
            >
              <Mic size={12} /> Voice Messages
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="border-b border-base-300">
          <div className="flex items-center justify-between p-4">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="btn btn-ghost btn-sm gap-2"
            >
              <Filter size={16} />
              Filters
              {getActiveFilterCount() > 0 && (
                <span className="badge badge-primary badge-sm">
                  {getActiveFilterCount()}
                </span>
              )}
              <ChevronDown 
                size={14} 
                className={`transition-transform ${showFilters ? 'rotate-180' : ''}`} 
              />
            </button>
            
            <div className="flex items-center gap-2">
              {totalResults > 0 && (
                <span className="text-sm text-base-content/60">
                  {totalResults} result{totalResults !== 1 ? 's' : ''}
                </span>
              )}
              {searchResults.length > 0 && (
                <button
                  onClick={exportSearchResults}
                  className="btn btn-ghost btn-sm gap-2"
                  title="Export results"
                >
                  <Download size={14} />
                  Export
                </button>
              )}
            </div>
          </div>
          
          {showFilters && (
            <div className="p-4 pt-0 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Sender Filter */}
              <div className="form-control">
                <label className="label label-text-alt">Sender</label>
                <select
                  className="select select-bordered select-sm"
                  value={filters.sender}
                  onChange={(e) => handleFilterChange('sender', e.target.value)}
                >
                  <option value="">All users</option>
                  <option value="me">Me</option>
                  {users?.map(user => (
                    <option key={user._id} value={user._id}>
                      {user.fullName}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Message Type Filter */}
              <div className="form-control">
                <label className="label label-text-alt">Message Type</label>
                <select
                  className="select select-bordered select-sm"
                  value={filters.messageType}
                  onChange={(e) => handleFilterChange('messageType', e.target.value)}
                >
                  <option value="all">All types</option>
                  <option value="text">Text only</option>
                  <option value="image">Images</option>
                  <option value="voice">Voice messages</option>
                  <option value="file">Files</option>
                </select>
              </div>
              
              {/* Date From */}
              <div className="form-control">
                <label className="label label-text-alt">From Date</label>
                <input
                  type="date"
                  className="input input-bordered input-sm"
                  value={filters.dateFrom}
                  onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                />
              </div>
              
              {/* Date To */}
              <div className="form-control">
                <label className="label label-text-alt">To Date</label>
                <input
                  type="date"
                  className="input input-bordered input-sm"
                  value={filters.dateTo}
                  onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                />
              </div>
              
              {/* Sort Options */}
              <div className="form-control">
                <label className="label label-text-alt">Sort By</label>
                <div className="flex gap-2">
                  <select
                    className="select select-bordered select-sm flex-1"
                    value={filters.sortBy}
                    onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                  >
                    <option value="date">Date</option>
                    <option value="relevance">Relevance</option>
                  </select>
                  <button
                    onClick={() => handleFilterChange('sortOrder', filters.sortOrder === 'desc' ? 'asc' : 'desc')}
                    className="btn btn-ghost btn-sm btn-square"
                    title={`Sort ${filters.sortOrder === 'desc' ? 'ascending' : 'descending'}`}
                  >
                    {filters.sortOrder === 'desc' ? <ArrowDown size={14} /> : <ArrowUp size={14} />}
                  </button>
                </div>
              </div>
              
              {/* Boolean Filters */}
              <div className="form-control">
                <label className="label label-text-alt">Additional Filters</label>
                <div className="space-y-2">
                  <label className="label cursor-pointer justify-start gap-2">
                    <input
                      type="checkbox"
                      className="checkbox checkbox-sm"
                      checked={filters.hasAttachment}
                      onChange={(e) => handleFilterChange('hasAttachment', e.target.checked)}
                    />
                    <span className="label-text-alt">Has attachments</span>
                  </label>
                  <label className="label cursor-pointer justify-start gap-2">
                    <input
                      type="checkbox"
                      className="checkbox checkbox-sm"
                      checked={filters.hasFormatting}
                      onChange={(e) => handleFilterChange('hasFormatting', e.target.checked)}
                    />
                    <span className="label-text-alt">Has formatting</span>
                  </label>
                  <label className="label cursor-pointer justify-start gap-2">
                    <input
                      type="checkbox"
                      className="checkbox checkbox-sm"
                      checked={filters.inThread}
                      onChange={(e) => handleFilterChange('inThread', e.target.checked)}
                    />
                    <span className="label-text-alt">In threads</span>
                  </label>
                </div>
              </div>
            </div>
          )}
          
          {getActiveFilterCount() > 0 && (
            <div className="px-4 pb-4">
              <button
                onClick={clearFilters}
                className="btn btn-ghost btn-xs"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>

        {/* Search Results */}
        <div className="flex-1 overflow-y-auto p-4">
          {searchResults.length === 0 && !isSearching && searchQuery.trim() && (
            <div className="text-center py-8 text-base-content/60">
              <Search size={48} className="mx-auto mb-4 opacity-50" />
              <p>No messages found matching your search.</p>
              <p className="text-sm mt-2">Try adjusting your search terms or filters.</p>
            </div>
          )}
          
          {searchResults.length === 0 && !searchQuery.trim() && (
            <div className="text-center py-8 text-base-content/60">
              <Search size={48} className="mx-auto mb-4 opacity-50" />
              <p>Start typing to search messages...</p>
              <p className="text-sm mt-2">Search supports text, @mentions, #hashtags, and more.</p>
            </div>
          )}
          
          <div className="space-y-3">
            {searchResults.map((message, index) => {
              const isMyMessage = message.senderId === authUser._id;
              const sender = isMyMessage ? authUser : users?.find(u => u._id === message.senderId);
              
              return (
                <div key={`${message._id}-${index}`} className="p-4 bg-base-200/50 rounded-lg border border-base-300/50 hover:bg-base-200/70 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="avatar">
                      <div className="w-10 h-10 rounded-full">
                        <img 
                          src={sender?.profilePic || '/avatar.png'} 
                          alt={sender?.fullName || 'User'}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium">
                          {isMyMessage ? 'You' : (sender?.fullName || 'Unknown User')}
                        </span>
                        <span className="text-xs text-base-content/60">
                          {formatMessageTime(message.createdAt)}
                        </span>
                        {getMessageTypeIcon(message)}
                        {message.isThreadReply && (
                          <span className="badge badge-primary badge-xs">Thread</span>
                        )}
                        {message.hasFormatting && (
                          <span className="badge badge-secondary badge-xs">Formatted</span>
                        )}
                      </div>
                      
                      <div className="text-sm">
                        {message.hasFormatting ? (
                          <div 
                            className="prose prose-sm max-w-none"
                            dangerouslySetInnerHTML={{ 
                              __html: highlightSearchTerm(formatMessage(message.text), searchQuery)
                            }}
                          />
                        ) : (
                          <p 
                            className="whitespace-pre-wrap"
                            dangerouslySetInnerHTML={{
                              __html: highlightSearchTerm(message.text || '', searchQuery)
                            }}
                          />
                        )}
                      </div>
                      
                      {/* Message Context */}
                      {message.replyTo && (
                        <div className="mt-2 p-2 bg-base-300/50 rounded border-l-2 border-primary/50">
                          <span className="text-xs text-base-content/60">Replying to:</span>
                          <p className="text-xs text-base-content/80 line-clamp-1">
                            {message.replyTo.text}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* Load More */}
          {hasMore && (
            <div className="text-center mt-6">
              <button
                onClick={handleLoadMore}
                disabled={isSearching}
                className="btn btn-outline btn-sm"
              >
                {isSearching ? (
                  <>
                    <span className="loading loading-spinner loading-xs" />
                    Loading...
                  </>
                ) : (
                  'Load More Results'
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdvancedSearch;