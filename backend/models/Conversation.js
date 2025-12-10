const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  lastMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  lastActivity: {
    type: Date,
    default: Date.now
  },
  conversationId: {
    type: String,
    required: true,
    unique: true
  },
  unreadCount: {
    type: Map,
    of: Number,
    default: {}
  },
  isGroup: {
    type: Boolean,
    default: false
  },
  groupName: {
    type: String // For group conversations
  },
  groupAvatar: {
    type: String // For group conversations
  }
}, {
  timestamps: true
});

// Create conversation ID from participants
conversationSchema.pre('save', function(next) {
  if (!this.conversationId && this.participants.length >= 2) {
    const participantIds = this.participants.map(p => p.toString()).sort();
    this.conversationId = participantIds.join('-');
  }
  next();
});

// Indexes
conversationSchema.index({ conversationId: 1 });
conversationSchema.index({ participants: 1 });
conversationSchema.index({ lastActivity: -1 });

module.exports = mongoose.model('Conversation', conversationSchema);