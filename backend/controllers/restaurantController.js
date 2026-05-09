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

export async function listRestaurants(req, res) {
  const { limit, offset } = parsePagination(req.query);
  const { search, city } = req.query;

  const conditions = [];
  const params = [];

  if (search) {
    params.push(`%${search}%`);
    conditions.push(`r.name ILIKE $${params.length}`);
  }

  if (city) {
    params.push(`%${city}%`);
    conditions.push(`r.city ILIKE $${params.length}`);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  try {
    const countResult = await pool.query(
      `SELECT COUNT(*) FROM restaurants r ${where}`,
      params
    );

    const total = parseInt(countResult.rows[0].count, 10);

    params.push(limit);
    params.push(offset);

    const result = await pool.query(
      `SELECT r.id, r.name, r.address, r.city, r.created_by, r.created_at, r.updated_at
       FROM restaurants r
       ${where}
       ORDER BY r.name ASC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    return res.json({ restaurants: result.rows, total });
  } catch (err) {
    console.error('listRestaurants error:', err);
    return res.status(500).json({ error: 'Failed to fetch restaurants' });
  }
}

export async function getRestaurant(req, res) {
  const { id } = req.params;

  if (!UUID_REGEX.test(id)) {
    return res.status(400).json({ error: 'Invalid restaurant ID' });
  }

  try {
    const result = await pool.query(
      `SELECT id, name, address, city, created_by, created_at, updated_at
       FROM restaurants
       WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }

    return res.json(result.rows[0]);
  } catch (err) {
    console.error('getRestaurant error:', err);
    return res.status(500).json({ error: 'Failed to fetch restaurant' });
  }
}

export async function createRestaurant(req, res) {
  const { name, address, city } = req.body;

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return res.status(400).json({ error: 'Name is required' });
  }

  if (name.trim().length > 200) {
    return res.status(400).json({ error: 'Name must be 200 characters or fewer' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO restaurants (name, address, city, created_by)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, address, city, created_by, created_at, updated_at`,
      [name.trim(), address || null, city || null, req.user.id]
    );

    return res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('createRestaurant error:', err);
    return res.status(500).json({ error: 'Failed to create restaurant' });
  }
}

export async function listReviewsForRestaurant(req, res) {
  const { id } = req.params;

  if (!UUID_REGEX.test(id)) {
    return res.status(400).json({ error: 'Invalid restaurant ID' });
  }

  const { limit, offset } = parsePagination(req.query);

  try {
    const restaurantCheck = await pool.query(
      'SELECT id FROM restaurants WHERE id = $1',
      [id]
    );

    if (restaurantCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }

    const countResult = await pool.query(
      'SELECT COUNT(*) FROM reviews WHERE restaurant_id = $1',
      [id]
    );

    const total = parseInt(countResult.rows[0].count, 10);

    const result = await pool.query(
      `SELECT rv.id, rv.user_id, rv.restaurant_id, rv.rating, rv.body,
              rv.created_at, rv.updated_at,
              u.username AS author_username
       FROM reviews rv
       JOIN users u ON u.id = rv.user_id
       WHERE rv.restaurant_id = $1
       ORDER BY rv.created_at DESC
       LIMIT $2 OFFSET $3`,
      [id, limit, offset]
    );

    return res.json({ reviews: result.rows, total });
  } catch (err) {
    console.error('listReviewsForRestaurant error:', err);
    return res.status(500).json({ error: 'Failed to fetch reviews' });
  }
}