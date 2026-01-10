// types/user.ts

export interface UserProfile {
  id: string;
  username?: string | null;   // Supabase can return null for optional fields
  avatar_url?: string | null;
  full_name?: string | null;
  email?: string | null;      // optional email
  created_at?: string;        // timestamps from Supabase
  updated_at?: string;
}
