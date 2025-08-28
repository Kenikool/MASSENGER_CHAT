import Group from "../models/group.model.js";
import Message from "../models/message.model.js";
import User from "../models/user.model.js";
import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketId, io } from "../lib/socket.js";

// Create a new group
export const createGroup = async (req, res) => {
  try {
    const { name, description, members = [], isPrivate = false } = req.body;
    const createdBy = req.user._id;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: "Group name is required." });
    }

    if (name.length > 100) {
      return res.status(400).json({ error: "Group name must be less than 100 characters." });
    }

    // Validate members exist
    const memberIds = [...new Set(members)]; // Remove duplicates
    if (memberIds.length > 0) {
      const validMembers = await User.find({ _id: { $in: memberIds } });
      if (validMembers.length !== memberIds.length) {
        return res.status(400).json({ error: "Some members do not exist." });
      }
    }

    // Create group members array
    const groupMembers = [
      {
        userId: createdBy,
        role: "admin",
        addedBy: createdBy,
        permissions: {
          canAddMembers: true,
          canRemoveMembers: true,
          canEditGroup: true,
          canDeleteMessages: true,
          canPinMessages: true,
        },
      },
      ...memberIds.map(memberId => ({
        userId: memberId,
        role: "member",
        addedBy: createdBy,
      })),
    ];

    const newGroup = new Group({
      name: name.trim(),
      description: description?.trim() || "",
      createdBy,
      members: groupMembers,
      settings: {
        isPrivate,
        requireApproval: isPrivate,
        allowMemberInvites: !isPrivate,
      },
    });

    await newGroup.save();

    // Populate the group with member details
    await newGroup.populate('members.userId', 'fullName profilePic email isOnline');
    await newGroup.populate('createdBy', 'fullName profilePic');

    // Emit socket events to all members
    groupMembers.forEach(member => {
      const memberSocketId = getReceiverSocketId(member.userId.toString());
      if (memberSocketId) {
        io.to(memberSocketId).emit('groupCreated', newGroup);
      }
    });

    res.status(201).json(newGroup);
  } catch (error) {
    console.error("Error in createGroup controller:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Get user's groups
export const getUserGroups = async (req, res) => {
  try {
    const userId = req.user._id;

    const groups = await Group.find({
      'members.userId': userId,
      isArchived: false,
    })
    .populate('members.userId', 'fullName profilePic isOnline')
    .populate('createdBy', 'fullName profilePic')
    .populate('lastMessage')
    .sort({ lastActivity: -1 });

    res.status(200).json(groups);
  } catch (error) {
    console.error("Error in getUserGroups controller:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Get group details
export const getGroupDetails = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user._id;

    const group = await Group.findById(groupId)
      .populate('members.userId', 'fullName profilePic email isOnline')
      .populate('createdBy', 'fullName profilePic')
      .populate('pinnedMessages.messageId')
      .populate('pinnedMessages.pinnedBy', 'fullName');

    if (!group) {
      return res.status(404).json({ error: "Group not found." });
    }

    // Check if user is a member
    if (!group.isMember(userId)) {
      return res.status(403).json({ error: "Access denied. You are not a member of this group." });
    }

    res.status(200).json(group);
  } catch (error) {
    console.error("Error in getGroupDetails controller:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Update group details
export const updateGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { name, description, profilePic } = req.body;
    const userId = req.user._id;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ error: "Group not found." });
    }

    // Check permissions
    if (!group.hasPermission(userId, 'canEditGroup')) {
      return res.status(403).json({ error: "You don't have permission to edit this group." });
    }

    // Update fields
    if (name && name.trim()) {
      if (name.length > 100) {
        return res.status(400).json({ error: "Group name must be less than 100 characters." });
      }
      group.name = name.trim();
    }

    if (description !== undefined) {
      if (description.length > 500) {
        return res.status(400).json({ error: "Description must be less than 500 characters." });
      }
      group.description = description.trim();
    }

    if (profilePic) {
      // Upload to cloudinary if it's a base64 image
      if (profilePic.startsWith('data:image')) {
        const uploadResponse = await cloudinary.uploader.upload(profilePic, {
          folder: 'group_profiles',
        });
        group.profilePic = uploadResponse.secure_url;
      } else {
        group.profilePic = profilePic;
      }
    }

    await group.save();
    await group.populate('members.userId', 'fullName profilePic isOnline');

    // Emit update to all members
    group.members.forEach(member => {
      const memberSocketId = getReceiverSocketId(member.userId._id.toString());
      if (memberSocketId) {
        io.to(memberSocketId).emit('groupUpdated', group);
      }
    });

    res.status(200).json(group);
  } catch (error) {
    console.error("Error in updateGroup controller:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Add members to group
export const addMembers = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { memberIds } = req.body;
    const userId = req.user._id;

    if (!memberIds || !Array.isArray(memberIds) || memberIds.length === 0) {
      return res.status(400).json({ error: "Member IDs are required." });
    }

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ error: "Group not found." });
    }

    // Check permissions
    if (!group.hasPermission(userId, 'canAddMembers')) {
      return res.status(403).json({ error: "You don't have permission to add members." });
    }

    // Validate new members exist
    const uniqueMemberIds = [...new Set(memberIds)];
    const validMembers = await User.find({ _id: { $in: uniqueMemberIds } });
    if (validMembers.length !== uniqueMemberIds.length) {
      return res.status(400).json({ error: "Some users do not exist." });
    }

    // Filter out existing members
    const existingMemberIds = group.members.map(m => m.userId.toString());
    const newMemberIds = uniqueMemberIds.filter(id => !existingMemberIds.includes(id));

    if (newMemberIds.length === 0) {
      return res.status(400).json({ error: "All specified users are already members." });
    }

    // Add new members
    const newMembers = newMemberIds.map(memberId => ({
      userId: memberId,
      role: "member",
      addedBy: userId,
    }));

    group.members.push(...newMembers);
    await group.save();
    await group.populate('members.userId', 'fullName profilePic isOnline');

    // Emit events
    group.members.forEach(member => {
      const memberSocketId = getReceiverSocketId(member.userId._id.toString());
      if (memberSocketId) {
        io.to(memberSocketId).emit('groupMembersAdded', {
          groupId,
          newMembers: newMembers.map(m => m.userId),
          addedBy: userId,
        });
      }
    });

    res.status(200).json({ message: "Members added successfully.", group });
  } catch (error) {
    console.error("Error in addMembers controller:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Remove member from group
export const removeMember = async (req, res) => {
  try {
    const { groupId, memberId } = req.params;
    const userId = req.user._id;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ error: "Group not found." });
    }

    // Check if member exists in group
    const memberIndex = group.members.findIndex(m => m.userId.toString() === memberId);
    if (memberIndex === -1) {
      return res.status(404).json({ error: "Member not found in group." });
    }

    const memberToRemove = group.members[memberIndex];

    // Check permissions
    const isRemovingSelf = userId.toString() === memberId;
    const canRemoveMembers = group.hasPermission(userId, 'canRemoveMembers');
    const isRemovingAdmin = memberToRemove.role === 'admin';
    const isUserAdmin = group.isAdmin(userId);

    if (!isRemovingSelf && !canRemoveMembers) {
      return res.status(403).json({ error: "You don't have permission to remove members." });
    }

    if (isRemovingAdmin && !isUserAdmin) {
      return res.status(403).json({ error: "Only admins can remove other admins." });
    }

    // Prevent removing the group creator if they're the only admin
    if (memberToRemove.role === 'admin') {
      const adminCount = group.members.filter(m => m.role === 'admin').length;
      if (adminCount === 1) {
        return res.status(400).json({ error: "Cannot remove the last admin. Promote another member first." });
      }
    }

    // Remove member
    group.members.splice(memberIndex, 1);
    await group.save();

    // Emit events
    group.members.forEach(member => {
      const memberSocketId = getReceiverSocketId(member.userId.toString());
      if (memberSocketId) {
        io.to(memberSocketId).emit('groupMemberRemoved', {
          groupId,
          removedMemberId: memberId,
          removedBy: userId,
        });
      }
    });

    // Notify the removed member
    const removedMemberSocketId = getReceiverSocketId(memberId);
    if (removedMemberSocketId) {
      io.to(removedMemberSocketId).emit('removedFromGroup', {
        groupId,
        groupName: group.name,
        removedBy: userId,
      });
    }

    res.status(200).json({ message: "Member removed successfully." });
  } catch (error) {
    console.error("Error in removeMember controller:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Update member role
export const updateMemberRole = async (req, res) => {
  try {
    const { groupId, memberId } = req.params;
    const { role } = req.body;
    const userId = req.user._id;

    if (!['admin', 'moderator', 'member'].includes(role)) {
      return res.status(400).json({ error: "Invalid role." });
    }

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ error: "Group not found." });
    }

    // Only admins can change roles
    if (!group.isAdmin(userId)) {
      return res.status(403).json({ error: "Only admins can change member roles." });
    }

    const memberIndex = group.members.findIndex(m => m.userId.toString() === memberId);
    if (memberIndex === -1) {
      return res.status(404).json({ error: "Member not found in group." });
    }

    const member = group.members[memberIndex];
    const oldRole = member.role;

    // Prevent demoting the last admin
    if (oldRole === 'admin' && role !== 'admin') {
      const adminCount = group.members.filter(m => m.role === 'admin').length;
      if (adminCount === 1) {
        return res.status(400).json({ error: "Cannot demote the last admin." });
      }
    }

    // Update role and permissions
    member.role = role;
    if (role === 'admin') {
      member.permissions = {
        canAddMembers: true,
        canRemoveMembers: true,
        canEditGroup: true,
        canDeleteMessages: true,
        canPinMessages: true,
      };
    } else if (role === 'moderator') {
      member.permissions = {
        canAddMembers: true,
        canRemoveMembers: false,
        canEditGroup: false,
        canDeleteMessages: true,
        canPinMessages: true,
      };
    } else {
      member.permissions = {
        canAddMembers: false,
        canRemoveMembers: false,
        canEditGroup: false,
        canDeleteMessages: false,
        canPinMessages: false,
      };
    }

    await group.save();

    // Emit events
    group.members.forEach(member => {
      const memberSocketId = getReceiverSocketId(member.userId.toString());
      if (memberSocketId) {
        io.to(memberSocketId).emit('groupMemberRoleUpdated', {
          groupId,
          memberId,
          oldRole,
          newRole: role,
          updatedBy: userId,
        });
      }
    });

    res.status(200).json({ message: "Member role updated successfully." });
  } catch (error) {
    console.error("Error in updateMemberRole controller:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Leave group
export const leaveGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user._id;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ error: "Group not found." });
    }

    const memberIndex = group.members.findIndex(m => m.userId.toString() === userId.toString());
    if (memberIndex === -1) {
      return res.status(404).json({ error: "You are not a member of this group." });
    }

    const member = group.members[memberIndex];

    // Check if user is the last admin
    if (member.role === 'admin') {
      const adminCount = group.members.filter(m => m.role === 'admin').length;
      if (adminCount === 1 && group.members.length > 1) {
        return res.status(400).json({ 
          error: "You are the last admin. Promote another member to admin before leaving." 
        });
      }
    }

    // Remove member
    group.members.splice(memberIndex, 1);

    // If no members left, archive the group
    if (group.members.length === 0) {
      group.isArchived = true;
      group.archivedAt = new Date();
      group.archivedBy = userId;
    }

    await group.save();

    // Emit events to remaining members
    group.members.forEach(member => {
      const memberSocketId = getReceiverSocketId(member.userId.toString());
      if (memberSocketId) {
        io.to(memberSocketId).emit('groupMemberLeft', {
          groupId,
          leftMemberId: userId,
        });
      }
    });

    res.status(200).json({ message: "Left group successfully." });
  } catch (error) {
    console.error("Error in leaveGroup controller:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Generate invite link
export const generateInviteLink = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { expiryHours = 24 } = req.body;
    const userId = req.user._id;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ error: "Group not found." });
    }

    if (!group.hasPermission(userId, 'canAddMembers')) {
      return res.status(403).json({ error: "You don't have permission to create invite links." });
    }

    // Generate unique invite code
    let inviteCode;
    let isUnique = false;
    while (!isUnique) {
      inviteCode = group.generateInviteCode();
      const existingGroup = await Group.findOne({ inviteCode });
      if (!existingGroup) {
        isUnique = true;
      }
    }

    group.inviteCode = inviteCode;
    group.inviteExpiry = new Date(Date.now() + expiryHours * 60 * 60 * 1000);
    await group.save();

    const inviteLink = `${process.env.FRONTEND_URL}/join-group/${inviteCode}`;

    res.status(200).json({
      inviteLink,
      inviteCode,
      expiresAt: group.inviteExpiry,
    });
  } catch (error) {
    console.error("Error in generateInviteLink controller:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Join group via invite
export const joinGroupViaInvite = async (req, res) => {
  try {
    const { inviteCode } = req.params;
    const userId = req.user._id;

    const group = await Group.findOne({ 
      inviteCode,
      inviteExpiry: { $gt: new Date() },
      isArchived: false,
    });

    if (!group) {
      return res.status(404).json({ error: "Invalid or expired invite link." });
    }

    // Check if user is already a member
    if (group.isMember(userId)) {
      return res.status(400).json({ error: "You are already a member of this group." });
    }

    // Add user to group
    group.members.push({
      userId,
      role: "member",
      addedBy: null, // Joined via invite
    });

    await group.save();
    await group.populate('members.userId', 'fullName profilePic isOnline');

    // Emit events
    group.members.forEach(member => {
      const memberSocketId = getReceiverSocketId(member.userId._id.toString());
      if (memberSocketId) {
        io.to(memberSocketId).emit('groupMemberJoined', {
          groupId: group._id,
          newMember: userId,
          joinedViaInvite: true,
        });
      }
    });

    res.status(200).json({ message: "Joined group successfully.", group });
  } catch (error) {
    console.error("Error in joinGroupViaInvite controller:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Delete group
export const deleteGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user._id;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ error: "Group not found." });
    }

    // Only group creator can delete the group
    if (group.createdBy.toString() !== userId.toString()) {
      return res.status(403).json({ error: "Only the group creator can delete the group." });
    }

    // Get all members before deletion
    const memberIds = group.members.map(m => m.userId.toString());

    // Delete all group messages
    await Message.deleteMany({ groupId });

    // Delete the group
    await Group.findByIdAndDelete(groupId);

    // Emit events to all members
    memberIds.forEach(memberId => {
      const memberSocketId = getReceiverSocketId(memberId);
      if (memberSocketId) {
        io.to(memberSocketId).emit('groupDeleted', {
          groupId,
          groupName: group.name,
          deletedBy: userId,
        });
      }
    });

    res.status(200).json({ message: "Group deleted successfully." });
  } catch (error) {
    console.error("Error in deleteGroup controller:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};