// PRIMEIRO: carrega dotenv ANTES de qualquer outro import
import dotenv from 'dotenv';
import path from 'path';
const envPath = path.resolve(process.cwd(), 'packages', 'backend', '.env');
const result = dotenv.config({ path: envPath });

// AGORA sim, os outros imports
import express from 'express';
import cors from 'cors';
import { testConnection } from './lib/supabase';
import stocksRouter from './routes/stocks';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV 
  });
});

app.use('/api/stocks', stocksRouter);

testConnection();

app.listen(PORT, () => {
  console.log(`🚀 Backend running on http://localhost:${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV}`);
});