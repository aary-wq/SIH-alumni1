const mongoose = require('mongoose');

const adminDocumentSchema = new mongoose.Schema({
  filename: { type: String },
  originalName: { type: String },
  hash: { type: String, required: true, index: true },
  // optional text hash for PDF/text-based matching (helps with scanned images converted to PDF)
  textHash: { type: String, index: true },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('AdminDocument', adminDocumentSchema);
