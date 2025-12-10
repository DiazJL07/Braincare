const mongoose = require('mongoose')

const specialtySchema = new mongoose.Schema({
  name: { type: String, unique: true, required: true },
  active: { type: Boolean, default: true }
}, { timestamps: true })

specialtySchema.index({ name: 1 })

module.exports = mongoose.model('Specialty', specialtySchema)
