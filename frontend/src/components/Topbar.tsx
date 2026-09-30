import React from 'react';
import { LockKeyhole } from 'lucide-react';

const Topbar = () => (
  <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-[#DCE5DF]/80 bg-[#F7FAF8]/90 px-6 backdrop-blur-md md:h-20 md:px-10">
    <p className="text-sm font-medium text-[#17211B]">My health profile</p>
    <span className="inline-flex items-center gap-2 rounded-full border border-[#DCE5DF] bg-white/80 px-3 py-1.5 text-xs text-[#66736B]"><LockKeyhole size={13} className="text-[#087F5B]" />Private context</span>
  </header>
);

export default Topbar;
