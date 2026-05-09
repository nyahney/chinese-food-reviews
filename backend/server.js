import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 3000;

// CORS configuration - explicit allowlist
const corsOptions = {
  origin: 'http://localhost:5173',
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`🥟 Backend server running on http://localhost:${PORT}`);
});