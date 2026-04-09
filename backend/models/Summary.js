const mongoose = require('mongoose');

const SummarySchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  originalText: String,
  summary: String,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Summary', SummarySchema);
