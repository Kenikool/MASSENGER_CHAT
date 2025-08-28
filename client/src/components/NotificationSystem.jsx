import React, { useState, useEffect, useRef } from 'react';
import { 
  Bell, 
  BellOff, 
  Settings, 
  X, 
  Check, 
  MessageCircle, 
  Users, 
  UserPlus, 
  Crown, 
  Heart,
  Reply,
  Volume2,
  VolumeX,
  Moon,
  Clock,
  Filter,
  MoreVertical,
  Trash2,
  CheckCheck
} from 'lucide-react';
import { formatMessageTime } from '../lib/utils';
import { useAuthStore } from '../store/useAuthStore';
import { useSocketContext } from '../hooks/useSocketContext';
import axiosInstance from '../lib/axios';
import toast from 'react-hot-toast';

// Notification Item Component
const NotificationItem = ({ notification, onMarkAsRead, onDelete, onClick }) => {
  const getNotificationIcon = () => {
    switch (notification.type) {
      case 'message':
        return <MessageCircle className="w-4 h-4 text-blue-500" />;
      case 'group_message':
        return <Users className="w-4 h-4 text-green-500" />;
      case 'group_invite':
        return <UserPlus className="w-4 h-4 text-purple-500" />;
      case 'group_role_change':
        return <Crown className="w-4 h-4 text-yellow-500" />;
      case 'reaction':
        return <Heart className="w-4 h-4 text-red-500" />;
      case 'thread_reply':
        return <Reply className="w-4 h-4 text-indigo-500" />;
      default:
        return <Bell className="w-4 h-4 text-gray-500" />;
    }
  };

  const getNotificationText = () => {
    switch (notification.type) {
      case 'message':
        return `${notification.sender?.fullName} sent you a message`;
      case 'group_message':
        return `${notification.sender?.fullName} sent a message in ${notification.group?.name}`;
      case 'group_invite':
        return `You were invited to join ${notification.group?.name}`;
      case 'group_role_change':
        return `Your role in ${notification.group?.name} was changed to ${notification.data?.newRole}`;
      case 'reaction':
        return `${notification.sender?.fullName} reacted ${notification.data?.emoji} to your message`;
      case 'thread_reply':
        return `${notification.sender?.fullName} replied to a thread you're in`;
      default:
        return notification.message || 'New notification';
    }
  };

  return (
    <div 
      className={`p-3 border-b border-base-300 hover:bg-base-200/50 transition-colors cursor-pointer ${
        !notification.isRead ? 'bg-primary/5 border-l-2 border-l-primary' : ''
      }`}
      onClick={() => onClick(notification)}
    >
      <div className="flex items-start gap-3">
        {/* Notification Icon */}
        <div className="flex-shrink-0 mt-1">
          {getNotificationIcon()}
        </div>
        
        {/* Notification Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <p className="text-sm font-medium text-base-content">
                {getNotificationText()}
              </p>
              
              {/* Notification Preview */}
              {notification.preview && (
                <p className="text-xs text-base-content/60 mt-1 line-clamp-2">
                  {notification.preview}
                </p>
              )}
              
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs text-base-content/50">
                  {formatMessageTime(notification.createdAt)}
                </span>
                
                {!notification.isRead && (
                  <span className="w-2 h-2 bg-primary rounded-full"></span>
                )}
              </div>
            </div>
            
            {/* Notification Actions */}
            <div className="dropdown dropdown-end">
              <button 
                className="btn btn-ghost btn-xs opacity-0 group-hover:opacity-100"
                tabIndex={0}
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical className="w-3 h-3" />
              </button>
              <ul className="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-32">
                {!notification.isRead && (
                  <li>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        onMarkAsRead(notification._id);
                      }}
                      className="text-xs"
                    >
                      <Check className="w-3 h-3" />
                      Mark as read
                    </button>
                  </li>
                )}
                <li>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(notification._id);
                    }}
                    className="text-xs text-error"
                  >
                    <Trash2 className="w-3 h-3" />
                    Delete
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Notification Settings Modal
const NotificationSettingsModal = ({ isOpen, onClose, settings, onUpdateSettings }) => {
  const [localSettings, setLocalSettings] = useState(settings);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onUpdateSettings(localSettings);
      toast.success('Notification settings updated!');
      onClose();
    } catch (error) {
      toast.error('Failed to update settings');
    } finally {
      setIsSaving(false);
    }
  };

  const updateSetting = (key, value) => {
    setLocalSettings(prev => ({ ...prev, [key]: value }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md bg-base-100 rounded-xl shadow-xl">
        <div className="flex items-center justify-between p-4 border-b border-base-300">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Notification Settings
          </h2>
          <button onClick={onClose} className="btn btn-ghost btn-sm btn-circle">
            <X size={16} />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* General Settings */}
          <div className="space-y-3">
            <h3 className="font-medium">General</h3>
            
            <label className="flex items-center justify-between cursor-pointer">
              <span className="flex items-center gap-2">
                <Bell className="w-4 h-4" />
                Enable notifications
              </span>
              <input
                type="checkbox"
                className="toggle toggle-primary"
                checked={localSettings.enabled}
                onChange={(e) => updateSetting('enabled', e.target.checked)}
              />
            </label>
            
            <label className="flex items-center justify-between cursor-pointer">
              <span className="flex items-center gap-2">
                <Volume2 className="w-4 h-4" />
                Sound notifications
              </span>
              <input
                type="checkbox"
                className="toggle toggle-primary"
                checked={localSettings.sound}
                onChange={(e) => updateSetting('sound', e.target.checked)}
                disabled={!localSettings.enabled}
              />
            </label>
            
            <label className="flex items-center justify-between cursor-pointer">
              <span className="flex items-center gap-2">
                <Bell className="w-4 h-4" />
                Desktop notifications
              </span>
              <input
                type="checkbox"
                className="toggle toggle-primary"
                checked={localSettings.desktop}
                onChange={(e) => updateSetting('desktop', e.target.checked)}
                disabled={!localSettings.enabled}
              />
            </label>
          </div>

          {/* Message Notifications */}
          <div className="space-y-3">
            <h3 className="font-medium">Messages</h3>
            
            <label className="flex items-center justify-between cursor-pointer">
              <span className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4" />
                Direct messages
              </span>
              <input
                type="checkbox"
                className="toggle toggle-primary"
                checked={localSettings.directMessages}
                onChange={(e) => updateSetting('directMessages', e.target.checked)}
                disabled={!localSettings.enabled}
              />
            </label>
            
            <label className="flex items-center justify-between cursor-pointer">
              <span className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Group messages
              </span>
              <input
                type="checkbox"
                className="toggle toggle-primary"
                checked={localSettings.groupMessages}
                onChange={(e) => updateSetting('groupMessages', e.target.checked)}
                disabled={!localSettings.enabled}
              />
            </label>
            
            <label className="flex items-center justify-between cursor-pointer">
              <span className="flex items-center gap-2">
                <Reply className="w-4 h-4" />
                Thread replies
              </span>
              <input
                type="checkbox"
                className="toggle toggle-primary"
                checked={localSettings.threadReplies}
                onChange={(e) => updateSetting('threadReplies', e.target.checked)}
                disabled={!localSettings.enabled}
              />
            </label>
            
            <label className="flex items-center justify-between cursor-pointer">
              <span className="flex items-center gap-2">
                <Heart className="w-4 h-4" />
                Reactions
              </span>
              <input
                type="checkbox"
                className="toggle toggle-primary"
                checked={localSettings.reactions}
                onChange={(e) => updateSetting('reactions', e.target.checked)}
                disabled={!localSettings.enabled}
              />
            </label>
          </div>

          {/* Group Notifications */}
          <div className="space-y-3">
            <h3 className="font-medium">Groups</h3>
            
            <label className="flex items-center justify-between cursor-pointer">
              <span className="flex items-center gap-2">
                <UserPlus className="w-4 h-4" />
                Group invites
              </span>
              <input
                type="checkbox"
                className="toggle toggle-primary"
                checked={localSettings.groupInvites}
                onChange={(e) => updateSetting('groupInvites', e.target.checked)}
                disabled={!localSettings.enabled}
              />
            </label>
            
            <label className="flex items-center justify-between cursor-pointer">
              <span className="flex items-center gap-2">
                <Crown className="w-4 h-4" />
                Role changes
              </span>
              <input
                type="checkbox"
                className="toggle toggle-primary"
                checked={localSettings.roleChanges}
                onChange={(e) => updateSetting('roleChanges', e.target.checked)}
                disabled={!localSettings.enabled}
              />
            </label>
          </div>

          {/* Quiet Hours */}
          <div className="space-y-3">
            <h3 className="font-medium flex items-center gap-2">
              <Moon className="w-4 h-4" />
              Quiet Hours
            </h3>
            
            <label className="flex items-center justify-between cursor-pointer">
              <span>Enable quiet hours</span>
              <input
                type="checkbox"
                className="toggle toggle-primary"
                checked={localSettings.quietHours.enabled}
                onChange={(e) => updateSetting('quietHours', {
                  ...localSettings.quietHours,
                  enabled: e.target.checked
                })}
                disabled={!localSettings.enabled}
              />
            </label>
            
            {localSettings.quietHours.enabled && (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="label label-text-alt">From</label>
                  <input
                    type="time"
                    className="input input-bordered input-sm w-full"
                    value={localSettings.quietHours.start}
                    onChange={(e) => updateSetting('quietHours', {
                      ...localSettings.quietHours,
                      start: e.target.value
                    })}
                  />
                </div>
                <div>
                  <label className="label label-text-alt">To</label>
                  <input
                    type="time"
                    className="input input-bordered input-sm w-full"
                    value={localSettings.quietHours.end}
                    onChange={(e) => updateSetting('quietHours', {
                      ...localSettings.quietHours,
                      end: e.target.value
                    })}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-2 p-4 border-t border-base-300">
          <button
            onClick={onClose}
            className="btn btn-ghost flex-1"
            disabled={isSaving}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="btn btn-primary flex-1"
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <span className="loading loading-spinner loading-sm" />
                Saving...
              </>
            ) : (
              'Save Settings'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// Main Notification System Component
const NotificationSystem = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [filter, setFilter] = useState('all'); // all, unread, messages, groups
  const [isLoading, setIsLoading] = useState(false);
  
  const { authUser } = useAuthStore();
  const { socket } = useSocketContext();
  const dropdownRef = useRef(null);
  
  // Default notification settings
  const [settings, setSettings] = useState({
    enabled: true,
    sound: true,
    desktop: true,
    directMessages: true,
    groupMessages: true,
    threadReplies: true,
    reactions: true,
    groupInvites: true,
    roleChanges: true,
    quietHours: {
      enabled: false,
      start: '22:00',
      end: '08:00'
    }
  });

  // Load notifications on mount
  useEffect(() => {
    loadNotifications();
    loadNotificationSettings();
  }, []);

  // Socket event listeners
  useEffect(() => {
    if (!socket) return;

    socket.on('newNotification', (notification) => {
      setNotifications(prev => [notification, ...prev]);
      setUnreadCount(prev => prev + 1);
      
      // Show desktop notification if enabled
      if (settings.desktop && settings.enabled) {
        showDesktopNotification(notification);
      }
      
      // Play sound if enabled
      if (settings.sound && settings.enabled) {
        playNotificationSound();
      }
    });

    return () => {
      socket.off('newNotification');
    };
  }, [socket, settings]);

  const loadNotifications = async () => {
    setIsLoading(true);
    try {
      const response = await axiosInstance.get('/api/notifications');
      setNotifications(response.data.notifications);
      setUnreadCount(response.data.unreadCount);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadNotificationSettings = async () => {
    try {
      const response = await axiosInstance.get('/api/notifications/settings');
      setSettings(response.data);
    } catch (error) {
      console.error('Failed to load notification settings:', error);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await axiosInstance.put(`/api/notifications/${notificationId}/read`);
      setNotifications(prev => 
        prev.map(notif => 
          notif._id === notificationId 
            ? { ...notif, isRead: true }
            : notif
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      toast.error('Failed to mark notification as read');
    }
  };

  const markAllAsRead = async () => {
    try {
      await axiosInstance.put('/api/notifications/read-all');
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, isRead: true }))
      );
      setUnreadCount(0);
      toast.success('All notifications marked as read');
    } catch (error) {
      toast.error('Failed to mark all notifications as read');
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      await axiosInstance.delete(`/api/notifications/${notificationId}`);
      setNotifications(prev => 
        prev.filter(notif => notif._id !== notificationId)
      );
      toast.success('Notification deleted');
    } catch (error) {
      toast.error('Failed to delete notification');
    }
  };

  const updateNotificationSettings = async (newSettings) => {
    try {
      await axiosInstance.put('/api/notifications/settings', newSettings);
      setSettings(newSettings);
    } catch (error) {
      throw error;
    }
  };

  const showDesktopNotification = (notification) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      const title = getNotificationTitle(notification);
      const body = getNotificationBody(notification);
      
      new Notification(title, {
        body,
        icon: '/favicon.ico',
        tag: notification._id
      });
    }
  };

  const playNotificationSound = () => {
    const audio = new Audio('/notification-sound.mp3');
    audio.volume = 0.5;
    audio.play().catch(() => {
      // Ignore errors (user might not have interacted with page yet)
    });
  };

  const getNotificationTitle = (notification) => {
    switch (notification.type) {
      case 'message':
        return 'New Message';
      case 'group_message':
        return `New message in ${notification.group?.name}`;
      case 'group_invite':
        return 'Group Invitation';
      case 'reaction':
        return 'New Reaction';
      default:
        return 'Notification';
    }
  };

  const getNotificationBody = (notification) => {
    switch (notification.type) {
      case 'message':
        return `${notification.sender?.fullName}: ${notification.preview || 'New message'}`;
      case 'group_message':
        return `${notification.sender?.fullName}: ${notification.preview || 'New message'}`;
      case 'group_invite':
        return `You were invited to join ${notification.group?.name}`;
      case 'reaction':
        return `${notification.sender?.fullName} reacted to your message`;
      default:
        return notification.message || 'You have a new notification';
    }
  };

  const handleNotificationClick = (notification) => {
    // Mark as read if unread
    if (!notification.isRead) {
      markAsRead(notification._id);
    }
    
    // Navigate to relevant chat/group
    // This would integrate with your routing system
    setIsOpen(false);
  };

  const filteredNotifications = notifications.filter(notification => {
    switch (filter) {
      case 'unread':
        return !notification.isRead;
      case 'messages':
        return ['message', 'group_message', 'thread_reply'].includes(notification.type);
      case 'groups':
        return ['group_message', 'group_invite', 'group_role_change'].includes(notification.type);
      default:
        return true;
    }
  });

  return (
    <>
      {/* Notification Bell */}
      <div className="dropdown dropdown-end" ref={dropdownRef}>
        <button
          className="btn btn-ghost btn-circle relative"
          onClick={() => setIsOpen(!isOpen)}
          title="Notifications"
        >
          {settings.enabled ? (
            <Bell className="w-5 h-5" />
          ) : (
            <BellOff className="w-5 h-5 text-base-content/50" />
          )}
          
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-error text-error-content text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>

        {/* Notification Dropdown */}
        {isOpen && (
          <div className="dropdown-content mt-2 w-80 bg-base-100 border border-base-300 rounded-lg shadow-xl z-50">
            {/* Header */}
            <div className="flex items-center justify-between p-3 border-b border-base-300">
              <h3 className="font-semibold">Notifications</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowSettings(true)}
                  className="btn btn-ghost btn-xs"
                  title="Notification settings"
                >
                  <Settings className="w-4 h-4" />
                </button>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="btn btn-ghost btn-xs"
                    title="Mark all as read"
                  >
                    <CheckCheck className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex border-b border-base-300">
              {[
                { key: 'all', label: 'All' },
                { key: 'unread', label: 'Unread' },
                { key: 'messages', label: 'Messages' },
                { key: 'groups', label: 'Groups' }
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setFilter(tab.key)}
                  className={`flex-1 px-3 py-2 text-xs font-medium transition-colors ${
                    filter === tab.key
                      ? 'text-primary border-b-2 border-primary'
                      : 'text-base-content/60 hover:text-base-content'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Notifications List */}
            <div className="max-h-96 overflow-y-auto">
              {isLoading ? (
                <div className="flex items-center justify-center p-8">
                  <span className="loading loading-spinner loading-md" />
                </div>
              ) : filteredNotifications.length === 0 ? (
                <div className="text-center p-8 text-base-content/60">
                  <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">
                    {filter === 'unread' ? 'No unread notifications' : 'No notifications'}
                  </p>
                </div>
              ) : (
                <div className="group">
                  {filteredNotifications.map(notification => (
                    <NotificationItem
                      key={notification._id}
                      notification={notification}
                      onMarkAsRead={markAsRead}
                      onDelete={deleteNotification}
                      onClick={handleNotificationClick}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Notification Settings Modal */}
      <NotificationSettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        settings={settings}
        onUpdateSettings={updateNotificationSettings}
      />
    </>
  );
};

export default NotificationSystem;