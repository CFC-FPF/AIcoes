// PRIMEIRO: carrega dotenv ANTES de qualquer outro import
import dotenv from 'dotenv';
import path from 'path';
import sentiment from "./routes/sentiment";



const envPath = path.resolve(__dirname, '..', '.env');
const result = dotenv.config({ path: envPath });

if (result.error) {
  console.error('❌ Failed to load .env:', result.error);
} else {
  console.log('✅ .env loaded successfully');
}

console.log('🔑 SUPABASE_URL:', process.env.SUPABASE_URL ? 'EXISTS ✓' : 'MISSING ✗');
console.log('🔑 SUPABASE_SERVICE_KEY:', process.env.SUPABASE_SERVICE_KEY ? 'EXISTS ✓' : 'MISSING ✗');

// AGORA sim, os outros imports
import express from 'express';
import cors from 'cors';

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

// Inicializa tudo DEPOIS
async function startServer() {
  const { default: stocksRouter } = await import('./routes/stocks.js');
  const { testConnection } = await import('./lib/supabase.js');
  
  app.use('/api/stocks', stocksRouter);
  
  
  await testConnection();
  
  app.listen(PORT, () => {
    console.log(`🚀 Backend running on http://localhost:${PORT}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV}`);
  });
}

startServer().catch(console.error);