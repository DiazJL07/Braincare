const mongoose = require('mongoose')

const chatSchema = new mongoose.Schema({
  psychologist: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now },
  lastMessageAt: { type: Date, default: Date.now },
  userLastReadAt: { type: Date, default: new Date(0) },
  psychLastReadAt: { type: Date, default: new Date(0) }
})

chatSchema.index({ psychologist: 1, lastMessageAt: -1 })
chatSchema.index({ user: 1 })
chatSchema.index({ psychologist: 1, user: 1 }, { unique: true })

module.exports = mongoose.model('Chat', chatSchema)
