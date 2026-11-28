const express = require('express');
const { getReviews, guardarReview } = require('../controllers/reviewController');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
router.get('/:productId', getReviews);
router.post('/:productId', requireAuth, guardarReview);
module.exports = router;
