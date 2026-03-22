const mongoose = require('mongoose');

const predictionSchema = new mongoose.Schema({
    homeTeam: {
        type: String,
        required: true
    },
    awayTeam: {
        type: String,
        required: true
    },
    homeTeamLogo: String,
    awayTeamLogo: String,
    league: {
        type: String,
        required: true
    },
    matchTime: {
        type: Date,
        required: true
    },
    tipType: {
        type: String,
        enum: ['OVER_25', 'BTTS', 'DOUBLE_CHANCE', 'CORRECT_SCORE'],
        required: true
    },
    tipValue: {
        type: String,
        required: true
    },
    odds: {
        type: Number,
        required: true
    },
    isVip: {
        type: Boolean,
        default: false
    },
    status: {
        type: String,
        enum: ['pending', 'won', 'lost'],
        default: 'pending'
    },
    confidence: {
        type: Number,
        min: 1,
        max: 5,
        default: 3
    },
    analysis: String,
    views: {
        type: Number,
        default: 0
    },
    featured: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Prediction', predictionSchema);