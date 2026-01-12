// lib/supabaseClient.ts
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import Constants from "expo-constants";

// ✅ Get extras from Expo config (for Expo Go / standalone builds)
const extras = Constants.expoConfig?.extra ?? {};

// ✅ Supabase URL & anon key
const supabaseUrl: string =
  extras.SUPABASE_URL ?? "https://ofgnokinhgktcbqyeowt.supabase.co";

const supabaseAnonKey: string =
  extras.SUPABASE_ANON_KEY ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9mZ25va2luaGdrdGNicXllb3d0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU5ODUwMzAsImV4cCI6MjA4MTU2MTAzMH0.Z5D9ZbEOmZfKGlVFUuKTXvoDv3Wcfs_9tmb52LXF_f8";

// ✅ Create a strongly typed Supabase client
export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey);

