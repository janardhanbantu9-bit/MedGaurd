// @ts-nocheck
import React from 'react';
import { House, ScanLine, History, CircleHelp, MessageCircle } from 'lucide-react';
import { Logo } from './ui';

const Sidebar = ({ currentView, setView }) => {
  const navItems = [
    { id: 'dashboard', label: 'Home', icon: House },
    { id: 'input-rx', label: 'Scan Prescription', icon: ScanLine },
    { id: 'history', label: 'My Safety Checks', icon: History },
    { id: 'how-it-works', label: 'How It Works', icon: CircleHelp },
    { id: 'talk-ai', label: 'Talk to AI', icon: MessageCircle },
  ];

  return (
    <aside className="fixed bottom-0 left-0 z-30 flex h-[68px] w-full shrink-0 border-t border-[#DCE5DF] bg-white md:sticky md:top-0 md:h-screen md:w-64 md:flex-col md:border-r md:border-t-0 md:bg-[#FCFDFC]">
      <div className="hidden h-20 items-center border-b border-[#DCE5DF] px-6 md:flex">
        <Logo />
      </div>

      <div className="flex flex-1 items-center justify-around px-1 md:block md:overflow-y-auto md:px-4 md:py-7">
        <p className="mb-3 hidden px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#87958C] md:block">
          Your space
        </p>

        <nav className="flex w-full items-center justify-around gap-1 md:block md:space-y-1" aria-label="Main navigation">
          {navItems.map(({ id, label, icon: Icon }) => {
            const active = currentView === id || (id === 'input-rx' && ['extract-rx', 'analysis'].includes(currentView));

            return (
              <button
                key={id}
                onClick={() => setView(id)}
                className={`flex min-w-0 flex-col items-center gap-1 rounded-xl px-2 py-2 text-center text-[10px] transition-colors md:w-full md:flex-row md:gap-3 md:px-3 md:py-3 md:text-left md:text-sm ${
                  active
                    ? 'bg-[#E8F5EF] font-semibold text-[#064E3B]'
                    : 'text-[#66736B] hover:bg-[#F2F6F3] hover:text-[#17211B]'
                }`}
              >
                <Icon size={18} className={active ? 'text-[#087F5B]' : ''} />
                <span className="truncate">{label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </aside>
  );
};

export default Sidebar;
