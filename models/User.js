const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Por favor ingrese su nombre']
  },
  email: {
    type: String,
    required: [true, 'Por favor ingrese su email'],
    unique: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Por favor ingrese un email válido']
  },
  password: {
    type: String,
    required: [true, 'Por favor ingrese una contraseña'],
    minlength: [8, 'La contraseña debe tener al menos 8 caracteres'],
    select: false
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'psychologist'],
    default: 'user'
  },
  
  // Campos para fotos de perfil
  profileImage: {
    type: String,
    default: null
  },
  profileImagePublicId: {
    type: String,
    default: null
  },
  
  coverImage: {
    type: String,
    default: null
  },
  coverImagePublicId: {
    type: String,
    default: null
  },
  
  // Campos para sistema de baneos
  isBanned: {
    type: Boolean,
    default: false
  },
  
  banReason: {
    type: String
  },
  
  banDate: {
    type: Date
  },
  
  banExpiresAt: {
    type: Date
  },
  
  bannedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Historial de reportes recibidos
  reportsReceived: {
    type: Number,
    default: 0
  },
  
  // Contador de advertencias recibidas
  warningsReceived: {
    type: Number,
    default: 0
  },
  
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Encriptar contraseña antes de guardar
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Método para comparar contraseñas
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Método helper para obtener la URL de la foto de perfil
userSchema.methods.getProfileImageUrl = function() {
  if (this.profileImage) {
    return this.profileImage;
  }
  return '/img/default-avatar.svg'; // Mostrar imagen por defecto
};

// Método helper para obtener la URL de la foto de portada
userSchema.methods.getCoverImageUrl = function() {
  if (this.coverImage && this.coverImage !== '/img/default-cover.svg') {
    return this.coverImage;
  }
  return '/img/default-cover.svg';
};

module.exports = mongoose.model('User', userSchema);
