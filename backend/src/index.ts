import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import apiRoutes from './routes/api';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const allowedOrigins = [
  'https://techpath-ai.imshuheb.in',
  'http://localhost:5173',
  'http://localhost:3000',
];

const app = express();

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, etc.)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, true); // Still allow other origins for now
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));
app.use(express.json());

const port = process.env.PORT || 3001;

app.use('/api', apiRoutes);

app.listen(port, () => {
  console.log(`Backend running on port ${port}`);
});

export default app;
