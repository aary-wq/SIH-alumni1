const mongoose = require('mongoose');

const adminRecordSchema = new mongoose.Schema({
  name: { type: String, required: true },
  institute: { type: String, required: true },
  percentage: { type: String, required: true },
  normalizedHash: { type: String, required: true, index: true },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('AdminRecord', adminRecordSchema);
