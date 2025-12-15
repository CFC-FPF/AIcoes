import dotenv from 'dotenv';
import path from 'path';

// Carrega o .env
const envPath = path.resolve(__dirname, '..', '..', '.env');
const result = dotenv.config({ path: envPath });

if (result.error) {
  console.error('❌ Failed to load .env file');
  console.error('🔍 Looking for .env at:', envPath);
  console.error('Error:', result.error.message);
  process.exit(1);
}

// Verifica se as variáveis de ambiente necessárias existem
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing required environment variables:');
  if (!process.env.SUPABASE_URL) console.error('  - SUPABASE_URL');
  if (!process.env.SUPABASE_SERVICE_KEY) console.error('  - SUPABASE_SERVICE_KEY');
  console.error('\n💡 Make sure your .env file contains these variables');
  process.exit(1);
}

console.log('✅ Environment variables loaded successfully');
