import bcrypt from 'bcrypt';
import pool from '../db/index.js';
import { createToken, COOKIE_NAME, cookieOptions } from '../auth/tokens.js';

const BCRYPT_ROUNDS = 12;
const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 128;

const EMAIL_REGEX = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,30}$/;

export async function signup(req, res) {
  const { email, username, password } = req.body;

  if (!email || !username || !password) {
    return res.status(400).json({ error: 'Email, username, and password are required' });
  }

  if (!EMAIL_REGEX.test(email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }

  if (!USERNAME_REGEX.test(username)) {
    return res.status(400).json({ error: 'Username must be 3-30 characters, letters, numbers, or underscores only' });
  }

  if (password.length < MIN_PASSWORD_LENGTH || password.length > MAX_PASSWORD_LENGTH) {
    return res.status(400).json({ error: `Password must be between ${MIN_PASSWORD_LENGTH} and ${MAX_PASSWORD_LENGTH} characters` });
  }

  try {
    const existing = await pool.query(
      'SELECT id FROM users WHERE email = $1 OR username = $2',
      [email.toLowerCase(), username]
    );

    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Email or username is already taken' });
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

    const result = await pool.query(
      `INSERT INTO users (email, username, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, email, username, created_at`,
      [email.toLowerCase(), username, passwordHash]
    );

    const user = result.rows[0];

    const token = createToken({ userId: user.id, username: user.username });
    res.cookie(COOKIE_NAME, token, cookieOptions);

    return res.status(201).json({
      id: user.id,
      email: user.email,
      username: user.username,
      created_at: user.created_at,
    });
  } catch (err) {
    console.error('Signup error:', err);
    return res.status(500).json({ error: 'Failed to create account' });
  }
}

export async function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const result = await pool.query(
      'SELECT id, email, username, password_hash FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    const user = result.rows[0];

    if (!user) {
      await bcrypt.compare(password, '$2b$12$invalidhashinvalidhashinvalidhashinvalidhashinvalidhashin');
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const passwordMatches = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatches) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = createToken({ userId: user.id, username: user.username });
    res.cookie(COOKIE_NAME, token, cookieOptions);

    return res.json({
      id: user.id,
      email: user.email,
      username: user.username,
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Login failed' });
  }
}

export function logout(req, res) {
  res.clearCookie(COOKIE_NAME, cookieOptions);
  return res.json({ message: 'Logged out' });
}

export async function getMe(req, res) {
  try {
    const result = await pool.query(
      'SELECT id, email, username, created_at FROM users WHERE id = $1',
      [req.user.id]
    );

    const user = result.rows[0];

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json(user);
  } catch (err) {
    console.error('getMe error:', err);
    return res.status(500).json({ error: 'Failed to fetch user' });
  }
}