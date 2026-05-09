import express from 'express';
import {
  listReviews,
  getReview,
  createReview,
  updateReview,
  deleteReview,
} from '../controllers/reviewController.js';
import { requireAuth } from '../auth/middleware.js';

const router = express.Router();

router.get('/', listReviews);
router.get('/:id', getReview);
router.post('/', requireAuth, createReview);
router.patch('/:id', requireAuth, updateReview);
router.delete('/:id', requireAuth, deleteReview);

export default router;