const express = require('express');
const router = express.Router();

router.get('/plans', (req, res) => {
    res.json({
        plans: {
            monthly: { name: 'Monthly', price: 29.99, duration: 30 },
            quarterly: { name: 'Quarterly', price: 79.99, duration: 90 },
            yearly: { name: 'Yearly', price: 299.99, duration: 365 }
        }
    });
});

module.exports = router;