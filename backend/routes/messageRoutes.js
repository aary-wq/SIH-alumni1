const express = require('express');
const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const User = require('../models/User');
const auth = require('../middleware/auth');
const mongoose = require('mongoose');

const router = express.Router();

// Send a message
router.post('/send', auth, async (req, res) => {
  try {
    const { receiverId, content, messageType = 'text', attachmentUrl } = req.body;
    const senderId = req.user.id;

    console.log(`📤 Sending message from ${senderId} to ${receiverId}: ${content}`);

    // Validate receiver exists
    const receiver = await User.findById(receiverId);
    if (!receiver) {
      return res.status(404).json({ message: 'Receiver not found' });
    }

    // Create conversation ID
    const participants = [senderId, receiverId].sort();
    const conversationId = participants.join('-');

    // Create message
    const newMessage = new Message({
      sender: senderId,
      recipient: receiverId,
      content: content.trim(),
      messageType,
      attachmentUrl,
      conversationId,
      isDelivered: true,
      deliveredAt: new Date()
    });

    await newMessage.save();
    
    // Populate sender information
    await newMessage.populate('sender', 'firstName lastName profileUrl');
    await newMessage.populate('recipient', 'firstName lastName profileUrl');

    // Update or create conversation
    let conversation = await Conversation.findOne({ conversationId });
    
    if (!conversation) {
      conversation = new Conversation({
        participants: [senderId, receiverId],
        conversationId,
        lastMessage: newMessage._id,
        lastActivity: new Date()
      });
    } else {
      conversation.lastMessage = newMessage._id;
      conversation.lastActivity = new Date();
      
      // Increment unread count for receiver
      const unreadCount = conversation.unreadCount || new Map();
      unreadCount.set(receiverId, (unreadCount.get(receiverId) || 0) + 1);
      conversation.unreadCount = unreadCount;
    }
    
    await conversation.save();

    // Emit real-time event via Socket.IO (if you have io instance available)
    if (req.app.get('io')) {
      const io = req.app.get('io');
      io.to(receiverId).emit('newMessage', {
        _id: newMessage._id,
        senderId: senderId,
        recipientId: receiverId,
        content: content,
        messageType,
        timestamp: newMessage.createdAt,
        sender: newMessage.sender,
        isDelivered: true
      });
    }

    console.log(`✅ Message sent successfully: ${newMessage._id}`);
    
    res.status(201).json({
      message: 'Message sent successfully',
      messageId: newMessage._id,
      data: newMessage,
      timestamp: newMessage.createdAt
    });

  } catch (error) {
    console.error('❌ Error sending message:', error);
    res.status(500).json({ 
      message: 'Failed to send message', 
      error: error.message 
    });
  }
});

// Get messages between two users
router.get('/:userId', auth, async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const otherUserId = req.params.userId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    console.log(`📡 Fetching messages between ${currentUserId} and ${otherUserId}`);

    // Create conversation ID
    const participants = [currentUserId, otherUserId].sort();
    const conversationId = participants.join('-');

    // Fetch messages
    const messages = await Message.find({ conversationId })
      .populate('sender', 'firstName lastName profileUrl email')
      .populate('recipient', 'firstName lastName profileUrl email')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip);

    // Reverse to get chronological order
    messages.reverse();

    // Mark messages as read for current user
    await Message.updateMany(
      {
        conversationId,
        recipient: currentUserId,
        isRead: false
      },
      {
        isRead: true,
        readAt: new Date()
      }
    );

    // Update conversation unread count
    const conversation = await Conversation.findOne({ conversationId });
    if (conversation) {
      const unreadCount = conversation.unreadCount || new Map();
      unreadCount.set(currentUserId, 0);
      conversation.unreadCount = unreadCount;
      await conversation.save();
    }

    console.log(`💬 Retrieved ${messages.length} messages`);

    res.json({
      messages,
      pagination: {
        currentPage: page,
        totalMessages: await Message.countDocuments({ conversationId }),
        hasMore: messages.length === limit
      }
    });

  } catch (error) {
    console.error('❌ Error fetching messages:', error);
    res.status(500).json({ 
      message: 'Failed to fetch messages', 
      error: error.message 
    });
  }
});

// Get all conversations for a user
router.get('/', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    console.log(`📋 Fetching conversations for user: ${userId}`);

    const conversations = await Conversation.find({
      participants: userId
    })
      .populate('participants', 'firstName lastName profileUrl email')
      .populate({
        path: 'lastMessage',
        populate: {
          path: 'sender',
          select: 'firstName lastName profileUrl'
        }
      })
      .sort({ lastActivity: -1 });

    // Format conversations for frontend
    const formattedConversations = conversations.map(conv => {
      const otherParticipant = conv.participants.find(p => p._id.toString() !== userId);
      const unreadCount = conv.unreadCount?.get(userId) || 0;

      return {
        _id: conv._id,
        conversationId: conv.conversationId,
        participant: otherParticipant,
        lastMessage: conv.lastMessage,
        lastActivity: conv.lastActivity,
        unreadCount,
        isOnline: false // This would need to be updated with actual online status
      };
    });

    console.log(`✅ Retrieved ${formattedConversations.length} conversations`);
    res.json({ conversations: formattedConversations });

  } catch (error) {
    console.error('❌ Error fetching conversations:', error);
    res.status(500).json({ 
      message: 'Failed to fetch conversations', 
      error: error.message 
    });
  }
});

// Mark messages as read
router.put('/read/:conversationId', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { conversationId } = req.params;

    // Mark all messages in conversation as read for this user
    await Message.updateMany(
      {
        conversationId,
        recipient: userId,
        isRead: false
      },
      {
        isRead: true,
        readAt: new Date()
      }
    );

    // Update conversation unread count
    const conversation = await Conversation.findOne({ conversationId });
    if (conversation) {
      const unreadCount = conversation.unreadCount || new Map();
      unreadCount.set(userId, 0);
      conversation.unreadCount = unreadCount;
      await conversation.save();
    }

    // Emit read receipt via Socket.IO
    if (req.app.get('io')) {
      const io = req.app.get('io');
      const otherUserId = conversationId.split('-').find(id => id !== userId);
      io.to(otherUserId).emit('messagesRead', { conversationId, readBy: userId });
    }

    res.json({ message: 'Messages marked as read' });

  } catch (error) {
    console.error('❌ Error marking messages as read:', error);
    res.status(500).json({ 
      message: 'Failed to mark messages as read', 
      error: error.message 
    });
  }
});

// Delete a message
router.delete('/:messageId', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { messageId } = req.params;

    const message = await Message.findOne({
      _id: messageId,
      sender: userId
    });

    if (!message) {
      return res.status(404).json({ message: 'Message not found or unauthorized' });
    }

    await Message.findByIdAndDelete(messageId);

    // Emit message deletion via Socket.IO
    if (req.app.get('io')) {
      const io = req.app.get('io');
      io.to(message.recipient.toString()).emit('messageDeleted', { messageId });
    }

    res.json({ message: 'Message deleted successfully' });

  } catch (error) {
    console.error('❌ Error deleting message:', error);
    res.status(500).json({ 
      message: 'Failed to delete message', 
      error: error.message 
    });
  }
});

// Search messages
router.get('/search/:query', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { query } = req.params;
    const limit = parseInt(req.query.limit) || 20;

    const messages = await Message.find({
      $or: [
        { sender: userId },
        { recipient: userId }
      ],
      content: { $regex: query, $options: 'i' }
    })
      .populate('sender', 'firstName lastName profileUrl')
      .populate('recipient', 'firstName lastName profileUrl')
      .sort({ createdAt: -1 })
      .limit(limit);

    res.json({ messages });

  } catch (error) {
    console.error('❌ Error searching messages:', error);
    res.status(500).json({ 
      message: 'Failed to search messages', 
      error: error.message 
    });
  }
});

module.exports = router;