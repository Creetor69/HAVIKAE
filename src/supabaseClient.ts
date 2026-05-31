
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://someuoatqyrqbkbiqggi.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNvbWV1b2F0cXlycWJrYmlxZ2dpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE0NzY1NTAsImV4cCI6MjA3NzA1MjU1MH0.QXoe4TmT6sIgFRV55aatcErGqC6LNGdt4LSwR063v_A';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
        headers: {
            'apikey': supabaseAnonKey,
        }
    },
    auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
    },
});

export const supabaseInitializationError = null;
