import { supabase } from '../lib/supabase';

export async function signIn(email: string, password: string) {
  if (!supabase) throw new Error('Supabase Auth is not configured');

  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });

  if (error) throw error;
  return data;
}

export async function signUp(email: string, password: string, fullName: string) {
  if (!supabase) throw new Error('Supabase Auth is not configured');

  const { data, error } = await supabase.auth.signUp({
    email: email.trim(),
    password,
    options: {
      data: { full_name: fullName.trim() },
    },
  });

  if (error) throw error;
  return data;
}

export async function signOut() {
  if (!supabase) return;
  try {
    await supabase.auth.signOut();
  } catch (error) {
    console.warn('Supabase sign-out encountered an error (e.g. offline), clearing local session:', error);
  } finally {
    try {
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('sb-') || key.includes('supabase'))) {
          localStorage.removeItem(key);
        }
      }
      sessionStorage.clear();
    } catch {
      // Ignore storage access errors
    }
  }
}
