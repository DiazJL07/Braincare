const mongoose = require('mongoose')

const psychologistProfileSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', unique: true, required: true },
  photoUrl: { type: String, default: '' },
  bio: { type: String, default: '' },
  specialties: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Specialty' }],
  price: { type: Number, default: 0 },
  durationMinutes: { type: Number, enum: [30, 45, 60], default: 60 },
  languages: [{ type: String }],
  experienceYears: { type: Number, default: 0 },
  topics: [{ type: String }],
  ratingAverage: { type: Number, default: 0 },
  ratingCount: { type: Number, default: 0 },
  active: { type: Boolean, default: true }
}, { timestamps: true })

psychologistProfileSchema.index({ user: 1 })

module.exports = mongoose.model('PsychologistProfile', psychologistProfileSchema)
