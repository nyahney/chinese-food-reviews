import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import pool from './db/index.js';
import authRoutes from './routes/auth.js';

const app = express();
const PORT = process.env.PORT || 3000;

const corsOptions = {
  origin: 'http://localhost:5173',
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/api/db-test', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({
      status: 'ok',
      database_time: result.rows[0].now,
    });
  } catch (err) {
    console.error('Database query failed:', err);
    res.status(500).json({
      status: 'error',
      message: 'Database connection failed',
    });
  }
});

app.use('/api/auth', authRoutes);

app.listen(PORT, () => {
  console.log(`🥟 Backend server running on http://localhost:${PORT}`);
});