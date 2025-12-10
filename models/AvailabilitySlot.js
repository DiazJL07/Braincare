const mongoose = require('mongoose')

const availabilitySlotSchema = new mongoose.Schema({
  psychologist: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  start: { type: Date, required: true },
  end: { type: Date, required: true },
  isBlocked: { type: Boolean, default: false },
  isBooked: { type: Boolean, default: false }
}, { timestamps: true })

availabilitySlotSchema.index({ psychologist: 1, start: 1, end: 1 })

module.exports = mongoose.model('AvailabilitySlot', availabilitySlotSchema)
