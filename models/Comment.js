const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  content: {
    type: String,
    required: true,
    trim: true
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  post: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Foro',
    required: true
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  dislikes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  replies: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment'
  }],
  isReply: {
    type: Boolean,
    default: false
  },
  parentComment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  editable: {
    type: Boolean,
    default: true
  },
  edited: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

// Después de 10 minutos, el comentario no se puede editar
commentSchema.pre('save', function(next) {
  if (this.isModified('content')) {
    const now = new Date();
    const createdAt = new Date(this.createdAt);
    const diffInMinutes = (now - createdAt) / (1000 * 60);
    
    if (diffInMinutes >= 10) {
      this.editable = false;
    }
  }
  next();
});

module.exports = mongoose.model('Comment', commentSchema);