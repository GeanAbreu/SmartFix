import { createClient } from '@supabase/supabase-js';

// As credenciais do seu projeto SmartFix que você me passou anteriormente
const SUPABASE_URL = 'https://jrgelocbixpgttrxzawv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpyZ2Vsb2NiaXhwZ3R0cnh6YXd2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY1NTA1MjIsImV4cCI6MjEwMjEyNjUyMn0.ZYAs3UZNOCH65rW83J-npxbcEbqnrr0KYj3fPCRQYKU';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);