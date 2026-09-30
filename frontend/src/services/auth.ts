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
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}
