import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  Settings, 
  Crown, 
  Shield, 
  User, 
  X, 
  Edit3, 
  Trash2, 
  Copy, 
  Link as LinkIcon,
  Calendar,
  Globe,
  Lock,
  UserMinus,
  MoreVertical,
  Camera,
  Save
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useChatStore } from '../store/useChatStore';
import axiosInstance from '../lib/axios';
import toast from 'react-hot-toast';

// Create Group Modal
export const CreateGroupModal = ({ isOpen, onClose, onGroupCreated }) => {
  const [groupName, setGroupName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [isPrivate, setIsPrivate] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const { users } = useChatStore();
  const { authUser } = useAuthStore();

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!groupName.trim()) {
      toast.error('Group name is required');
      return;
    }

    setIsCreating(true);
    try {
      const response = await axiosInstance.post('/api/groups/create', {
        name: groupName.trim(),
        description: description.trim(),
        members: selectedMembers,
        isPrivate
      });

      toast.success('Group created successfully!');
      onGroupCreated(response.data);
      onClose();
      
      // Reset form
      setGroupName('');
      setDescription('');
      setSelectedMembers([]);
      setIsPrivate(false);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to create group');
    } finally {
      setIsCreating(false);
    }
  };

  const toggleMember = (userId) => {
    setSelectedMembers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md bg-base-100 rounded-xl shadow-xl">
        <div className="flex items-center justify-between p-4 border-b border-base-300">
          <h2 className="text-lg font-semibold">Create New Group</h2>
          <button onClick={onClose} className="btn btn-ghost btn-sm btn-circle">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleCreateGroup} className="p-4 space-y-4">
          {/* Group Name */}
          <div className="form-control">
            <label className="label">
              <span className="label-text">Group Name *</span>
            </label>
            <input
              type="text"
              placeholder="Enter group name"
              className="input input-bordered"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              maxLength={100}
              required
            />
          </div>

          {/* Description */}
          <div className="form-control">
            <label className="label">
              <span className="label-text">Description</span>
            </label>
            <textarea
              placeholder="Group description (optional)"
              className="textarea textarea-bordered"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={500}
              rows={3}
            />
          </div>

          {/* Privacy Setting */}
          <div className="form-control">
            <label className="label cursor-pointer">
              <span className="label-text flex items-center gap-2">
                {isPrivate ? <Lock size={16} /> : <Globe size={16} />}
                Private Group
              </span>
              <input
                type="checkbox"
                className="toggle toggle-primary"
                checked={isPrivate}
                onChange={(e) => setIsPrivate(e.target.checked)}
              />
            </label>
            <label className="label">
              <span className="label-text-alt text-base-content/60">
                {isPrivate ? 'Only invited members can join' : 'Anyone with invite link can join'}
              </span>
            </label>
          </div>

          {/* Member Selection */}
          <div className="form-control">
            <label className="label">
              <span className="label-text">Add Members</span>
              <span className="label-text-alt">{selectedMembers.length} selected</span>
            </label>
            <div className="max-h-40 overflow-y-auto border border-base-300 rounded-lg">
              {users?.filter(user => user._id !== authUser._id).map(user => (
                <label key={user._id} className="flex items-center gap-3 p-3 hover:bg-base-200 cursor-pointer">
                  <input
                    type="checkbox"
                    className="checkbox checkbox-sm"
                    checked={selectedMembers.includes(user._id)}
                    onChange={() => toggleMember(user._id)}
                  />
                  <div className="avatar">
                    <div className="w-8 h-8 rounded-full">
                      <img src={user.profilePic || '/avatar.png'} alt={user.fullName} />
                    </div>
                  </div>
                  <span className="text-sm">{user.fullName}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-ghost flex-1"
              disabled={isCreating}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary flex-1"
              disabled={isCreating || !groupName.trim()}
            >
              {isCreating ? (
                <>
                  <span className="loading loading-spinner loading-sm" />
                  Creating...
                </>
              ) : (
                'Create Group'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Group Members Modal
export const GroupMembersModal = ({ isOpen, onClose, group }) => {
  const { authUser } = useAuthStore();
  const [showAddMembers, setShowAddMembers] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const { users } = useChatStore();

  const userRole = group?.members?.find(member => 
    member.userId?._id === authUser._id
  )?.role;

  const canManageMembers = userRole === 'admin' || userRole === 'moderator';

  const handleAddMembers = async () => {
    if (selectedUsers.length === 0) return;

    setIsLoading(true);
    try {
      await axiosInstance.post(`/api/groups/${group._id}/members`, {
        memberIds: selectedUsers
      });
      toast.success('Members added successfully!');
      setSelectedUsers([]);
      setShowAddMembers(false);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to add members');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveMember = async (memberId) => {
    if (!window.confirm('Are you sure you want to remove this member?')) return;

    try {
      await axiosInstance.delete(`/api/groups/${group._id}/members/${memberId}`);
      toast.success('Member removed successfully!');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to remove member');
    }
  };

  const handleChangeRole = async (memberId, newRole) => {
    try {
      await axiosInstance.put(`/api/groups/${group._id}/members/${memberId}/role`, {
        role: newRole
      });
      toast.success('Member role updated!');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to update role');
    }
  };

  if (!isOpen || !group) return null;

  const availableUsers = users?.filter(user => 
    !group.members?.some(member => member.userId?._id === user._id)
  ) || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl bg-base-100 rounded-xl shadow-xl max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-base-300">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Users size={20} />
            Group Members ({group.memberCount})
          </h2>
          <button onClick={onClose} className="btn btn-ghost btn-sm btn-circle">
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {/* Add Members Section */}
          {canManageMembers && (
            <div className="mb-6">
              {!showAddMembers ? (
                <button
                  onClick={() => setShowAddMembers(true)}
                  className="btn btn-primary btn-sm gap-2"
                >
                  <UserPlus size={16} />
                  Add Members
                </button>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">Add New Members</h3>
                    <button
                      onClick={() => {
                        setShowAddMembers(false);
                        setSelectedUsers([]);
                      }}
                      className="btn btn-ghost btn-xs"
                    >
                      Cancel
                    </button>
                  </div>
                  
                  <div className="max-h-32 overflow-y-auto border border-base-300 rounded-lg">
                    {availableUsers.map(user => (
                      <label key={user._id} className="flex items-center gap-3 p-2 hover:bg-base-200 cursor-pointer">
                        <input
                          type="checkbox"
                          className="checkbox checkbox-sm"
                          checked={selectedUsers.includes(user._id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedUsers(prev => [...prev, user._id]);
                            } else {
                              setSelectedUsers(prev => prev.filter(id => id !== user._id));
                            }
                          }}
                        />
                        <div className="avatar">
                          <div className="w-6 h-6 rounded-full">
                            <img src={user.profilePic || '/avatar.png'} alt={user.fullName} />
                          </div>
                        </div>
                        <span className="text-sm">{user.fullName}</span>
                      </label>
                    ))}
                  </div>
                  
                  {selectedUsers.length > 0 && (
                    <button
                      onClick={handleAddMembers}
                      disabled={isLoading}
                      className="btn btn-primary btn-sm"
                    >
                      {isLoading ? (
                        <span className="loading loading-spinner loading-xs" />
                      ) : (
                        `Add ${selectedUsers.length} member${selectedUsers.length !== 1 ? 's' : ''}`
                      )}
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Members List */}
          <div className="space-y-2">
            {group.members?.map(member => {
              const isMe = member.userId?._id === authUser._id;
              const canRemove = canManageMembers && !isMe && 
                (userRole === 'admin' || member.role !== 'admin');
              const canChangeRole = userRole === 'admin' && !isMe;

              return (
                <div key={member.userId?._id} className="flex items-center justify-between p-3 bg-base-200/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="avatar">
                      <div className="w-10 h-10 rounded-full">
                        <img 
                          src={member.userId?.profilePic || '/avatar.png'} 
                          alt={member.userId?.fullName || 'User'}
                        />
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {isMe ? 'You' : (member.userId?.fullName || 'Unknown User')}
                        </span>
                        
                        {/* Role Badge */}
                        <span className={`badge badge-xs ${
                          member.role === 'admin' ? 'badge-warning' : 
                          member.role === 'moderator' ? 'badge-info' : 'badge-ghost'
                        }`}>
                          {member.role === 'admin' && <Crown className="w-2 h-2 mr-1" />}
                          {member.role === 'moderator' && <Shield className="w-2 h-2 mr-1" />}
                          {member.role}
                        </span>
                        
                        {/* Online Status */}
                        {member.userId?.isOnline && (
                          <div className="w-2 h-2 bg-green-500 rounded-full" title="Online" />
                        )}
                      </div>
                      
                      <div className="text-xs text-base-content/60">
                        Joined {new Date(member.joinedAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  
                  {/* Member Actions */}
                  {(canRemove || canChangeRole) && (
                    <div className="dropdown dropdown-end">
                      <button className="btn btn-ghost btn-xs" tabIndex={0}>
                        <MoreVertical size={14} />
                      </button>
                      <ul className="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-40">
                        {canChangeRole && (
                          <>
                            {member.role !== 'admin' && (
                              <li>
                                <button 
                                  onClick={() => handleChangeRole(member.userId._id, 'admin')}
                                  className="text-xs"
                                >
                                  <Crown size={12} />
                                  Make Admin
                                </button>
                              </li>
                            )}
                            {member.role !== 'moderator' && (
                              <li>
                                <button 
                                  onClick={() => handleChangeRole(member.userId._id, 'moderator')}
                                  className="text-xs"
                                >
                                  <Shield size={12} />
                                  Make Moderator
                                </button>
                              </li>
                            )}
                            {member.role !== 'member' && (
                              <li>
                                <button 
                                  onClick={() => handleChangeRole(member.userId._id, 'member')}
                                  className="text-xs"
                                >
                                  <User size={12} />
                                  Make Member
                                </button>
                              </li>
                            )}
                            <li><hr /></li>
                          </>
                        )}
                        {canRemove && (
                          <li>
                            <button 
                              onClick={() => handleRemoveMember(member.userId._id)}
                              className="text-xs text-error"
                            >
                              <UserMinus size={12} />
                              Remove
                            </button>
                          </li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

// Group Settings Modal
export const GroupSettingsModal = ({ isOpen, onClose, group }) => {
  const { authUser } = useAuthStore();
  const [groupName, setGroupName] = useState(group?.name || '');
  const [description, setDescription] = useState(group?.description || '');
  const [isPrivate, setIsPrivate] = useState(group?.settings?.isPrivate || false);
  const [inviteLink, setInviteLink] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [showInviteSection, setShowInviteSection] = useState(false);

  const userRole = group?.members?.find(member => 
    member.userId?._id === authUser._id
  )?.role;

  const canEditGroup = userRole === 'admin';
  const canInvite = userRole === 'admin' || userRole === 'moderator';

  useEffect(() => {
    if (group) {
      setGroupName(group.name || '');
      setDescription(group.description || '');
      setIsPrivate(group.settings?.isPrivate || false);
    }
  }, [group]);

  const handleUpdateGroup = async (e) => {
    e.preventDefault();
    if (!groupName.trim()) {
      toast.error('Group name is required');
      return;
    }

    setIsUpdating(true);
    try {
      await axiosInstance.put(`/api/groups/${group._id}`, {
        name: groupName.trim(),
        description: description.trim()
      });
      toast.success('Group updated successfully!');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to update group');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleGenerateInvite = async () => {
    try {
      const response = await axiosInstance.post(`/api/groups/${group._id}/invite`, {
        expiryHours: 24
      });
      setInviteLink(response.data.inviteLink);
      setShowInviteSection(true);
      toast.success('Invite link generated!');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to generate invite link');
    }
  };

  const handleCopyInvite = () => {
    navigator.clipboard.writeText(inviteLink);
    toast.success('Invite link copied to clipboard!');
  };

  const handleLeaveGroup = async () => {
    if (!window.confirm('Are you sure you want to leave this group?')) return;

    try {
      await axiosInstance.post(`/api/groups/${group._id}/leave`);
      toast.success('Left group successfully');
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to leave group');
    }
  };

  const handleDeleteGroup = async () => {
    if (!window.confirm('Are you sure you want to delete this group? This action cannot be undone.')) return;

    try {
      await axiosInstance.delete(`/api/groups/${group._id}`);
      toast.success('Group deleted successfully');
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to delete group');
    }
  };

  if (!isOpen || !group) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md bg-base-100 rounded-xl shadow-xl max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-base-300">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Settings size={20} />
            Group Settings
          </h2>
          <button onClick={onClose} className="btn btn-ghost btn-sm btn-circle">
            <X size={16} />
          </button>
        </div>

        <div className="p-4 space-y-6">
          {/* Group Info */}
          {canEditGroup && (
            <form onSubmit={handleUpdateGroup} className="space-y-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Group Name</span>
                </label>
                <input
                  type="text"
                  className="input input-bordered"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  maxLength={100}
                  required
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Description</span>
                </label>
                <textarea
                  className="textarea textarea-bordered"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  maxLength={500}
                  rows={3}
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary w-full"
                disabled={isUpdating}
              >
                {isUpdating ? (
                  <>
                    <span className="loading loading-spinner loading-sm" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    Update Group
                  </>
                )}
              </button>
            </form>
          )}

          {/* Invite Section */}
          {canInvite && (
            <div className="space-y-3">
              <h3 className="font-medium flex items-center gap-2">
                <LinkIcon size={16} />
                Invite Members
              </h3>
              
              {!showInviteSection ? (
                <button
                  onClick={handleGenerateInvite}
                  className="btn btn-outline w-full"
                >
                  Generate Invite Link
                </button>
              ) : (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      className="input input-bordered flex-1 text-xs"
                      value={inviteLink}
                      readOnly
                    />
                    <button
                      onClick={handleCopyInvite}
                      className="btn btn-outline btn-sm"
                    >
                      <Copy size={14} />
                    </button>
                  </div>
                  <p className="text-xs text-base-content/60">
                    Link expires in 24 hours
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Group Stats */}
          <div className="space-y-3">
            <h3 className="font-medium">Group Information</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-base-content/60">Created</span>
                <span>{new Date(group.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-base-content/60">Members</span>
                <span>{group.memberCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-base-content/60">Messages</span>
                <span>{group.messageCount || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-base-content/60">Privacy</span>
                <span className="flex items-center gap-1">
                  {group.settings?.isPrivate ? (
                    <><Lock size={12} /> Private</>
                  ) : (
                    <><Globe size={12} /> Public</>
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="space-y-3">
            <h3 className="font-medium text-error">Danger Zone</h3>
            
            <button
              onClick={handleLeaveGroup}
              className="btn btn-outline btn-error w-full"
            >
              <UserMinus size={16} />
              Leave Group
            </button>
            
            {userRole === 'admin' && group.createdBy === authUser._id && (
              <button
                onClick={handleDeleteGroup}
                className="btn btn-error w-full"
              >
                <Trash2 size={16} />
                Delete Group
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default {
  CreateGroupModal,
  GroupMembersModal,
  GroupSettingsModal
};