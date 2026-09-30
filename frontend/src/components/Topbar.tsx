import React from 'react';
import { LockKeyhole } from 'lucide-react';
import { signOut } from '../services/auth';

function displayName(user: any) {
  const name = String(user?.user_metadata?.full_name ?? '').trim();
  if (name) return name;
  const email = String(user?.email ?? '').trim();
  if (email) return email.split('@')[0];
  return 'Your account';
}

function initials(name: string) {
  const parts = name.split(/\s+/).filter(Boolean);
  return (parts.slice(0, 2).map((part) => part[0]).join('') || 'U').toUpperCase();
}

const Topbar = ({ user, onSignedOut }: { user?: any; onSignedOut?: () => void }) => {
  const name = displayName(user);

  const handleSignOut = async () => {
    try {
      await signOut();
      onSignedOut?.();
    } catch (error) {
      console.error('MediGuard sign-out error:', error);
    }
  };

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-[#DCE5DF]/80 bg-[#F7FAF8]/90 px-6 backdrop-blur-md md:h-20 md:px-10">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#E8F5EF] text-xs font-semibold text-[#087F5B]">
          {initials(name)}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-[#17211B]">{name}</p>
          <p className="text-xs text-[#78867D]">My health profile</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span className="inline-flex shrink-0 items-center gap-2 rounded-full border border-[#DCE5DF] bg-white/80 px-3 py-1.5 text-xs text-[#66736B]">
          <LockKeyhole size={13} className="text-[#087F5B]" />
          Private context
        </span>
        <button
          type="button"
          onClick={handleSignOut}
          className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-[#66736B] transition hover:bg-white hover:text-[#17211B]"
        >
          Sign out
        </button>
      </div>
    </header>
  );
};

export default Topbar;
