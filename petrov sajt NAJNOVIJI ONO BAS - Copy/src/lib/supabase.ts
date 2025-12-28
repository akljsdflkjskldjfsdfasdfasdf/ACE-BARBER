import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Appointment {
  id: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  appointment_date: string;
  appointment_time: string;
  status: string;
  created_at: string;
  updated_at: string;
}
