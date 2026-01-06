import { supabase } from "./api";

export async function signInWithOtp(email: string) {
  const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: "shoptok://" } });
  if (error) throw error;
}

export async function signOut() {
  await supabase.auth.signOut();
}

export function onAuthStateChange(cb: (userId: string | null) => void) {
  supabase.auth.onAuthStateChange((_event, session) => {
    cb(session?.user?.id ?? null);
  });
}

export async function getCurrentUserId() {
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}
