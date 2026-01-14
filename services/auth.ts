import { supabase } from "./api";

export async function signInWithOtp(email: string) {
  const { error } = await supabase.auth.signInWithOtp({
    email,
  });
  if (error) throw error;
}

// Email OTP (6-digit code) flow. This avoids deep-linking issues during development.
// Note: whether Supabase sends a magic-link or an OTP depends on your Email Template
// ({{ .ConfirmationURL }} sends a link, {{ .Token }} sends a code).
export async function requestEmailOtp(email: string) {
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      // Set to false if you do NOT want auto-signup.
      shouldCreateUser: true,
    },
  });
  if (error) throw error;
}

export async function verifyEmailOtp(email: string, code: string) {
  const token = code.replace(/\s+/g, "").trim();
  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: "email",
  });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export function onAuthStateChange(cb: (userId: string | null) => void) {
  return supabase.auth.onAuthStateChange((_event, session) => {
    cb(session?.user?.id ?? null);
  });
}

export async function getCurrentUserId() {
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}
