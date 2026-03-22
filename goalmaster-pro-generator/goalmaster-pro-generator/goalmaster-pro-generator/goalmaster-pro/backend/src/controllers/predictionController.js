const Prediction = require('../models/Prediction');
const User = require('../models/User');

const getPredictions = async (req, res) => {
    try {
        const { date, limit = 50, page = 1 } = req.query;
        
        let query = {};
        if (date) {
            const startDate = new Date(date);
            startDate.setHours(0, 0, 0, 0);
            const endDate = new Date(date);
            endDate.setHours(23, 59, 59, 999);
            query.matchTime = { $gte: startDate, $lte: endDate };
        } else {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            query.matchTime = { $gte: today, $lt: tomorrow };
        }
        
        let userHasVip = false;
        if (req.user) {
            const user = await User.findById(req.user._id);
            userHasVip = user.subscriptionStatus === 'active' && user.subscriptionEndDate > new Date();
        }
        
        if (!userHasVip) {
            query.isVip = false;
        }
        
        const skip = (page - 1) * limit;
        const predictions = await Prediction.find(query)
            .sort({ featured: -1, matchTime: 1 })
            .limit(parseInt(limit))
            .skip(skip);
        
        const total = await Prediction.countDocuments(query);
        
        res.json({
            predictions,
            pagination: {
                total,
                page: parseInt(page),
                pages: Math.ceil(total / limit),
                hasMore: skip + predictions.length < total
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getPredictionStats = async (req, res) => {
    try {
        const total = await Prediction.countDocuments();
        const won = await Prediction.countDocuments({ status: 'won' });
        const lost = await Prediction.countDocuments({ status: 'lost' });
        const vip = await Prediction.countDocuments({ isVip: true });
        
        const winRate = total > 0 ? ((won / (won + lost)) * 100).toFixed(1) : 0;
        
        res.json({
            stats: {
                total,
                won,
                lost,
                vip,
                winRate: parseFloat(winRate)
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getPredictions, getPredictionStats };