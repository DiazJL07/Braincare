const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  // Usuario que hace el reporte
  reporter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Usuario reportado
  reportedUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Tipo de contenido reportado
  contentType: {
    type: String,
    required: true,
    enum: ['foro', 'comment']
  },
  
  // ID del contenido reportado (foro o comentario)
  contentId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  
  // Razón del reporte
  reason: {
    type: String,
    required: true,
    enum: [
      'Contenido inapropiado',
      'Spam',
      'Acoso o bullying',
      'Lenguaje ofensivo',
      'Información falsa',
      'Violación de términos',
      'Otro'
    ]
  },
  
  // Descripción adicional del reporte
  description: {
    type: String,
    maxlength: 500
  },
  
  // Estado del reporte
  status: {
    type: String,
    default: 'pending',
    enum: ['pending', 'reviewed', 'resolved', 'dismissed']
  },
  
  // Acción tomada por el admin
  adminAction: {
    type: String,
    enum: ['none', 'warning', 'temporary_ban', 'permanent_ban', 'content_removed']
  },
  
  // Admin que revisó el reporte
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Fecha de revisión
  reviewedAt: {
    type: Date
  },
  
  // Notas del admin
  adminNotes: {
    type: String,
    maxlength: 1000
  }
  
}, { 
  timestamps: true 
});

// Índices para mejorar rendimiento
reportSchema.index({ reportedUser: 1, status: 1 });
reportSchema.index({ reporter: 1 });
reportSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Report', reportSchema);