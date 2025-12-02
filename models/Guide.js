const mongoose = require('mongoose');

const guideSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    topic: {
        type: String,
        required: true,
        enum: ['Transtornos', 'Recomendaciones', 'Tratamientos', 'Prevencion', 'Investigacion']
    },
    image: {
        type: String,
        required: false
    },
    pdfFile: {
        type: String,
        required: true
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    publicationDate: {
        type: Date,
        default: Date.now
    },
    views: {
        type: Number,
        default: 0
    },
    viewedBy: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    viewsLog: [{ type: Date }],
    downloads: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

const Guide = mongoose.model('Guide', guideSchema);

module.exports = Guide;