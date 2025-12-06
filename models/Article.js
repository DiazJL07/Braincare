const mongoose = require('mongoose');

const articleSchema = new mongoose.Schema({
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
    content: {
        type: String,
        required: true
    },
    image: {
        type: String,
        required: false
    },
    imagePublicId: {
        type: String,
        required: false
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
    viewsLog: [{ type: Date }]
}, {
    timestamps: true
});

const Article = mongoose.model('Article', articleSchema);

module.exports = Article;
