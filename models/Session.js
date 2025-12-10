const mongoose = require('mongoose')

const sessionSchema = new mongoose.Schema({
  psychologist: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  start: { type: Date, required: true },
  end: { type: Date, required: true },
  status: { type: String, enum: ['pending', 'confirmed', 'completed', 'canceled'], default: 'confirmed' },
  videoLink: { type: String, default: '' },
  chatThreadId: { type: String, default: '' },
  price: { type: Number, default: 0 },
  commissionPercent: { type: Number, default: 0 },
  commissionAmount: { type: Number, default: 0 },
  netAmount: { type: Number, default: 0 },
  availabilitySlot: { type: mongoose.Schema.Types.ObjectId, ref: 'AvailabilitySlot' }
}, { timestamps: true })

sessionSchema.index({ psychologist: 1, user: 1, start: 1 })

module.exports = mongoose.model('Session', sessionSchema)
