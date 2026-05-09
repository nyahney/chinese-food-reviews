import express from 'express';
import {
  listRestaurants,
  getRestaurant,
  createRestaurant,
  listReviewsForRestaurant,
} from '../controllers/restaurantController.js';
import { requireAuth } from '../auth/middleware.js';

const router = express.Router();

router.get('/', listRestaurants);
router.get('/:id', getRestaurant);
router.post('/', requireAuth, createRestaurant);
router.get('/:id/reviews', listReviewsForRestaurant);

export default router;