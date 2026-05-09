import pool from '../db/index.js';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function parsePagination(query) {
  let limit = parseInt(query.limit, 10);
  let offset = parseInt(query.offset, 10);
  if (isNaN(limit) || limit < 1) limit = 20;
  if (limit > 100) limit = 100;
  if (isNaN(offset) || offset < 0) offset = 0;
  return { limit, offset };
}

export async function listReviews(req, res) {
  const { limit, offset } = parsePagination(req.query);

  try {
    const countResult = await pool.query('SELECT COUNT(*) FROM reviews');
    const total = parseInt(countResult.rows[0].count, 10);

    const result = await pool.query(
      `SELECT rv.id, rv.user_id, rv.restaurant_id, rv.rating, rv.body,
              rv.created_at, rv.updated_at,
              u.username AS author_username,
              r.name AS restaurant_name
       FROM reviews rv
       JOIN users u ON u.id = rv.user_id
       JOIN restaurants r ON r.id = rv.restaurant_id
       ORDER BY rv.created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    return res.json({ reviews: result.rows, total });
  } catch (err) {
    console.error('listReviews error:', err);
    return res.status(500).json({ error: 'Failed to fetch reviews' });
  }
}

export async function getReview(req, res) {
  const { id } = req.params;

  if (!UUID_REGEX.test(id)) {
    return res.status(400).json({ error: 'Invalid review ID' });
  }

  try {
    const result = await pool.query(
      `SELECT rv.id, rv.user_id, rv.restaurant_id, rv.rating, rv.body,
              rv.created_at, rv.updated_at,
              u.username AS author_username,
              r.name AS restaurant_name
       FROM reviews rv
       JOIN users u ON u.id = rv.user_id
       JOIN restaurants r ON r.id = rv.restaurant_id
       WHERE rv.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Review not found' });
    }

    return res.json(result.rows[0]);
  } catch (err) {
    console.error('getReview error:', err);
    return res.status(500).json({ error: 'Failed to fetch review' });
  }
}

export async function createReview(req, res) {
  const { restaurant_id, rating, body } = req.body;

  if (!restaurant_id || !UUID_REGEX.test(restaurant_id)) {
    return res.status(400).json({ error: 'Valid restaurant_id is required' });
  }

  if (rating === undefined || rating === null) {
    return res.status(400).json({ error: 'Rating is required' });
  }

  const ratingInt = parseInt(rating, 10);
  if (!Number.isInteger(ratingInt) || ratingInt < 1 || ratingInt > 10) {
    return res.status(400).json({ error: 'Rating must be an integer between 1 and 10' });
  }

  if (body !== undefined && body !== null && typeof body === 'string' && body.length > 5000) {
    return res.status(400).json({ error: 'Body must be 5000 characters or fewer' });
  }

  try {
    const restaurantCheck = await pool.query(
      'SELECT id FROM restaurants WHERE id = $1',
      [restaurant_id]
    );

    if (restaurantCheck.rows.length === 0) {
      return res.status(400).json({ error: 'Restaurant not found' });
    }

    const result = await pool.query(
      `INSERT INTO reviews (user_id, restaurant_id, rating, body)
       VALUES ($1, $2, $3, $4)
       RETURNING id, user_id, restaurant_id, rating, body, created_at, updated_at`,
      [req.user.id, restaurant_id, ratingInt, body || null]
    );

    return res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'You have already reviewed this restaurant' });
    }
    console.error('createReview error:', err);
    return res.status(500).json({ error: 'Failed to create review' });
  }
}

export async function updateReview(req, res) {
  const { id } = req.params;

  if (!UUID_REGEX.test(id)) {
    return res.status(400).json({ error: 'Invalid review ID' });
  }

  const { rating, body } = req.body;

  if (rating === undefined && body === undefined) {
    return res.status(400).json({ error: 'At least one of rating or body is required' });
  }

  if (rating !== undefined && rating !== null) {
    const ratingInt = parseInt(rating, 10);
    if (!Number.isInteger(ratingInt) || ratingInt < 1 || ratingInt > 10) {
      return res.status(400).json({ error: 'Rating must be an integer between 1 and 10' });
    }
  }

  if (body !== undefined && body !== null && typeof body === 'string' && body.length > 5000) {
    return res.status(400).json({ error: 'Body must be 5000 characters or fewer' });
  }

  try {
    const existing = await pool.query(
      'SELECT id, user_id FROM reviews WHERE id = $1',
      [id]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Review not found' });
    }

    if (existing.rows[0].user_id !== req.user.id) {
      return res.status(403).json({ error: 'You do not have permission to edit this review' });
    }

    const fields = [];
    const params = [];

    if (rating !== undefined && rating !== null) {
      params.push(parseInt(rating, 10));
      fields.push(`rating = $${params.length}`);
    }

    if (body !== undefined) {
      params.push(body || null);
      fields.push(`body = $${params.length}`);
    }

    params.push(id);

    const result = await pool.query(
      `UPDATE reviews
       SET ${fields.join(', ')}, updated_at = NOW()
       WHERE id = $${params.length}
       RETURNING id, user_id, restaurant_id, rating, body, created_at, updated_at`,
      params
    );

    return res.json(result.rows[0]);
  } catch (err) {
    console.error('updateReview error:', err);
    return res.status(500).json({ error: 'Failed to update review' });
  }
}

export async function deleteReview(req, res) {
  const { id } = req.params;

  if (!UUID_REGEX.test(id)) {
    return res.status(400).json({ error: 'Invalid review ID' });
  }

  try {
    const existing = await pool.query(
      'SELECT id, user_id FROM reviews WHERE id = $1',
      [id]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Review not found' });
    }

    if (existing.rows[0].user_id !== req.user.id) {
      return res.status(403).json({ error: 'You do not have permission to delete this review' });
    }

    await pool.query('DELETE FROM reviews WHERE id = $1', [id]);

    return res.status(204).send();
  } catch (err) {
    console.error('deleteReview error:', err);
    return res.status(500).json({ error: 'Failed to delete review' });
  }
}