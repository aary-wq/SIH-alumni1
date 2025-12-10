const mongoose = require('mongoose');

const campaignSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, trim: true },
  universityName: { type: String, trim: true },
  isCollegeDevelopment: { type: Boolean, default: false },
  goal: { type: Number, default: 0 },
  collected: { type: Number, default: 0 },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  active: { type: Boolean, default: true },
  posterUrl: { type: String },
  donations: [
    {
      donor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      amount: { type: Number, default: 0 },
      txHash: { type: String },
      createdAt: { type: Date, default: Date.now }
    }
  ]
}, { timestamps: true });

module.exports = mongoose.model('Campaign', campaignSchema);
