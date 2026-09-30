// @ts-nocheck
import React from 'react';
import {
  LayoutDashboard, Users, History, Database, Settings, FileSearch, UserCircle,
} from 'lucide-react';
import { Logo } from './ui';

const Sidebar = ({ currentView, setView }) => {
  const navItems = [
    { id: 'dashboard', label: 'Patient Overview', icon: LayoutDashboard },
    { id: 'input-rx', label: 'Analyze Prescription', icon: FileSearch },
    { id: 'history', label: 'Safety History', icon: History },
    { id: 'patients', label: 'Patient Directory', icon: Users },
  ];

  const secondaryNav = [
    { id: 'sources', label: 'Data Sources', icon: Database },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="w-64 bg-white border-r border-[#DCE5DF] flex flex-col h-screen sticky top-0 shrink-0 hidden md:flex z-30">
      <div className="p-6 h-20 flex items-center border-b border-[#DCE5DF]">
        <Logo />
      </div>

      <div className="flex-1 py-6 px-4 flex flex-col gap-1 overflow-y-auto">
        <div className="text-xs font-semibold text-[#66736B] uppercase tracking-wider mb-2 px-2">Clinical</div>
        {navItems.map(item => {
          const active = currentView === item.id || 
            (item.id === 'input-rx' && ['extract-rx', 'analysis'].includes(currentView));
          return (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors w-full text-left
                ${active ? 'bg-[#E8F5EF] text-[#064E3B]' : 'text-[#66736B] hover:bg-gray-50 hover:text-[#17211B]'}`}
            >
              <item.icon size={18} className={active ? 'text-[#087F5B]' : 'text-[#66736B]'} />
              {item.label}
            </button>
          );
        })}

        <div className="mt-8 mb-2 px-2 border-t border-[#DCE5DF] pt-6">
          <div className="text-xs font-semibold text-[#66736B] uppercase tracking-wider mb-2">System</div>
        </div>
        {secondaryNav.map(item => (
           <button
             key={item.id}
             onClick={() => setView(item.id)}
             className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors w-full text-left
               ${currentView === item.id ? 'bg-[#E8F5EF] text-[#064E3B]' : 'text-[#66736B] hover:bg-gray-50 hover:text-[#17211B]'}`}
           >
             <item.icon size={18} className={currentView === item.id ? 'text-[#087F5B]' : 'text-[#66736B]'} />
             {item.label}
           </button>
         ))}
      </div>

      <div className="p-4 border-t border-[#DCE5DF]">
        <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 shrink-0">
            <UserCircle size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-[#17211B] truncate">Dr. Sarah Jenkins</p>
            <p className="text-xs text-[#66736B] truncate">Internal Medicine</p>
          </div>
        </div>
      </div>
    </div>
  );
};


export default Sidebar;
