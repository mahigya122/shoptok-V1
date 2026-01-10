// lib/supabaseClient.ts
import { createClient } from "@supabase/supabase-js";

// You should set these in your .env or directly here
const SUPABASE_URL = "https://ofgnokinhgktcbqyeowt.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9mZ25va2luaGdrdGNicXllb3d0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU5ODUwMzAsImV4cCI6MjA4MTU2MTAzMH0.Z5D9ZbEOmZfKGlVFUuKTXvoDv3Wcfs_9tmb52LXF_f8";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
