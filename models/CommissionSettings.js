const mongoose = require('mongoose')

const commissionSettingsSchema = new mongoose.Schema({
  percent: { type: Number, min: 0, max: 100, required: true },
  effectiveFrom: { type: Date, default: Date.now },
  active: { type: Boolean, default: true }
}, { timestamps: true })

module.exports = mongoose.model('CommissionSettings', commissionSettingsSchema)
