import { createClient } from '@supabase/supabase-js';
import { Config } from '../constants/config';

export const supabase = createClient(
    Config.supabase.url,
    Config.supabase.anonKey,
    {
        auth: {
            autoRefreshToken: true,
            persistSession: true,
        },
    }
);
