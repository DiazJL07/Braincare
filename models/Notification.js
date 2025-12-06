const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['report_resolved', 'warning', 'ban', 'unban', 'new_report', 'psychologist_request_approved', 'psychologist_request_rejected', 'new_session', 'service_expired', 'chat_consent_request', 'chat_consent_accepted', 'chat_consent_rejected'],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  relatedReport: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Report'
  },
  payload: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  actionTaken: {
    type: String,
    enum: ['none', 'warning', 'temp_ban', 'permanent_ban'],
    default: 'none'
  },
  banDuration: {
    type: Number, // días de baneo
    default: null
  },
  read: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Índice para mejorar consultas
notificationSchema.index({ recipient: 1, read: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
