// @ts-nocheck
import React from 'react';
import { Search, Bell, Menu } from 'lucide-react';
import { Button } from './ui';

const Topbar = ({ patient }) => (
  <header className="bg-white/80 backdrop-blur-md border-b border-[#DCE5DF] h-20 px-8 flex items-center justify-between sticky top-0 z-20">
    <div className="flex items-center gap-4 flex-1">
      <div className="md:hidden">
         <Button variant="ghost" icon={Menu} className="px-2" />
      </div>
      <div className="relative w-full max-w-md hidden sm:block">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input 
          type="text" 
          placeholder="Search patients (MRN, Name)..." 
          className="w-full bg-gray-50 border border-[#DCE5DF] rounded-full py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#087F5B]/20 focus:border-[#087F5B] transition-all"
        />
      </div>
    </div>
    <div className="flex items-center gap-4">
      {patient && (
        <div className="hidden lg:flex items-center gap-3 mr-4 py-1.5 px-3 bg-[#F7FAF8] border border-[#DCE5DF] rounded-full">
          <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
          <span className="text-xs font-medium text-[#66736B]">Context:</span>
          <span className="text-sm font-semibold text-[#17211B]">{patient.name}</span>
        </div>
      )}
      <button className="relative p-2 text-gray-500 hover:text-gray-700 transition-colors rounded-full hover:bg-gray-100">
        <Bell size={20} />
        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
      </button>
    </div>
  </header>
);


export default Topbar;
