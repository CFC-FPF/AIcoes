"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
// Carrega o .env
const envPath = path_1.default.resolve(__dirname, '..', '..', '.env');
const result = dotenv_1.default.config({ path: envPath });
if (result.error) {
    console.error('❌ Failed to load .env file');
    console.error('🔍 Looking for .env at:', envPath);
    console.error('Error:', result.error.message);
    process.exit(1);
}
// Verifica se as variáveis de ambiente necessárias existem
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
    console.error('❌ Missing required environment variables:');
    if (!process.env.SUPABASE_URL)
        console.error('  - SUPABASE_URL');
    if (!process.env.SUPABASE_SERVICE_KEY)
        console.error('  - SUPABASE_SERVICE_KEY');
    console.error('\n💡 Make sure your .env file contains these variables');
    process.exit(1);
}
console.log('✅ Environment variables loaded successfully');
