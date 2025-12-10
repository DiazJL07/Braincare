const mongoose = require('mongoose');

const foroSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  topic: { type: mongoose.Schema.Types.ObjectId, ref: 'Topic', required: true },
  content: { type: String, required: true },
  image: String,
  imagePublicId: String,
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  publicationDate: { type: Date, default: Date.now },
  views: { type: Number, default: 0 },
  viewedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  comments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment'
  }],
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  dislikes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
}, { timestamps: true });

module.exports = mongoose.model('Foro', foroSchema);