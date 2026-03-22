const express = require('express');
const router = express.Router();
const { getPredictions, getPredictionStats } = require('../controllers/predictionController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, getPredictions);
router.get('/stats', getPredictionStats);

module.exports = router;