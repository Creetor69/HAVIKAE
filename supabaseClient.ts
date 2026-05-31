import { createClient, SupabaseClient } from '@supabase/supabase-js';
// FIX: Import the consolidated 'Database' type from `types.ts` to break the circular
// dependency that was causing widespread 'never' type inference errors.
import type { Database } from './types';

const supabaseUrl = 'https://someuoatqyrqbkbiqggi.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNvbWV1b2F0cXlycWJrYmlxZ2dpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE0NzY1NTAsImV4cCI6MjA3NzA1MjU1MH0.QXoe4TmT6sIgFRV55aatcErGqC6LNGdt4LSwR063v_A';


let supabase: SupabaseClient<Database> | null = null;
let supabaseInitializationError: string | null = null;

if (!supabaseUrl || !supabaseAnonKey) {
    supabaseInitializationError = 'Configuration Error: Supabase URL or Key is not provided. The application cannot connect to the backend.';
    console.error(supabaseInitializationError);
} else {
    try {
      supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
          auth: {
              persistSession: true,
              autoRefreshToken: true,
              detectSessionInUrl: true,
          },
      });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'An unknown error occurred during Supabase initialization.';
        supabaseInitializationError = `Failed to initialize Supabase client: ${message}`;
        console.error(supabaseInitializationError, error);
    }
}

export { supabase, supabaseInitializationError };