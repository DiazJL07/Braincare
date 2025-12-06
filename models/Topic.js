const mongoose = require('mongoose');

const topicSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true, 
    trim: true,
    unique: true
  },
  description: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

module.exports = mongoose.model('Topic', topicSchema);