"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.supabase = void 0;
exports.testConnection = testConnection;
const supabase_js_1 = require("@supabase/supabase-js");
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
    throw new Error('Missing Supabase environment variables');
}
exports.supabase = (0, supabase_js_1.createClient)(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});
async function testConnection() {
    try {
        const { data, error } = await exports.supabase
            .from('stocks')
            .select('count');
        if (error)
            throw error;
        console.log('✅ Supabase connected successfully');
        return true;
    }
    catch (error) {
        console.error('❌ Supabase connection failed:', error);
        return false;
    }
}
;
