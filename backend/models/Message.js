const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true,
    trim: true
  },
  messageType: {
    type: String,
    enum: ['text', 'image', 'file', 'audio', 'video'],
    default: 'text'
  },
  isDelivered: {
    type: Boolean,
    default: false
  },
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date
  },
  deliveredAt: {
    type: Date
  },
  attachmentUrl: {
    type: String // For file/image messages
  },
  conversationId: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

// Create conversation ID from sender and recipient IDs
messageSchema.pre('save', function(next) {
  if (!this.conversationId) {
    const participants = [this.sender.toString(), this.recipient.toString()].sort();
    this.conversationId = participants.join('-');
  }
  next();
});

// Indexes for better performance
messageSchema.index({ sender: 1, recipient: 1 });
messageSchema.index({ conversationId: 1, createdAt: -1 });
messageSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Message', messageSchema);