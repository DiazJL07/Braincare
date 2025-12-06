const mongoose = require('mongoose')

const psychologistServiceSchema = new mongoose.Schema({
  psychologist: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  problems: [{ type: String }],
  problemsCustom: { type: String, default: '' },
  sessionKind: { type: String, enum: ['30min', '60min', 'couple', 'group'], required: true },
  serviceType: { type: String, required: true },
  price: { type: Number, required: true },
  durationMinutes: { type: Number, required: true },
  description: { type: String, default: '' },
  specialty: { type: mongoose.Schema.Types.ObjectId, ref: 'Specialty' },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  status: { type: String, enum: ['active', 'completed'], default: 'active' }
}, { timestamps: true })

psychologistServiceSchema.index({ psychologist: 1, createdAt: -1 })

module.exports = mongoose.model('PsychologistService', psychologistServiceSchema)
