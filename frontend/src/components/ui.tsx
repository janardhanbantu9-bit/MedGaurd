// @ts-nocheck
import React from 'react';
import { ShieldCheck } from 'lucide-react';

const Logo = ({ collapsed }) => (
  <div className="flex items-center gap-3">
    <div className="relative w-8 h-8 rounded bg-[#087F5B] flex items-center justify-center text-white shrink-0 shadow-sm">
      <ShieldCheck size={20} strokeWidth={2.5} />
    </div>
    {!collapsed && (
      <span className="font-semibold text-xl tracking-tight text-[#17211B]">
        MEDIGUARD
      </span>
    )}
  </div>
);

const Badge = ({ children, variant = 'gray', className = '' }) => {
  const variants = {
    gray: 'bg-gray-100 text-gray-700 border-gray-200',
    green: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    red: 'bg-red-50 text-red-700 border-red-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
};

const Card = ({ children, className = '', noPadding = false, onClick }) => (
  <div 
    onClick={onClick}
    className={`bg-white rounded-xl border border-[#DCE5DF] shadow-[0_2px_10px_-4px_rgba(0,0,0,0.02)] transition-shadow ${onClick ? 'cursor-pointer hover:shadow-md' : ''} ${noPadding ? '' : 'p-6'} ${className}`}
  >
    {children}
  </div>
);

const Button = ({ children, variant = 'primary', className = '', icon: Icon, onClick, disabled, size = 'default' }) => {
  const baseStyle = "inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";

  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    default: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base shadow-sm"
  };

  const variants = {
    primary: "bg-[#087F5B] hover:bg-[#064E3B] text-white focus:ring-[#087F5B]",
    secondary: "bg-[#E8F5EF] hover:bg-[#D1EBE0] text-[#087F5B] focus:ring-[#087F5B]",
    outline: "bg-white border border-[#DCE5DF] hover:bg-gray-50 text-[#17211B] focus:ring-gray-200",
    ghost: "bg-transparent hover:bg-gray-100 text-[#66736B] focus:ring-gray-200",
    danger: "bg-red-50 hover:bg-red-100 text-red-700 focus:ring-red-500"
  };

  return (
    <button 
      className={`${baseStyle} ${sizes[size]} ${variants[variant]} ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      {Icon && <Icon size={size === 'sm' ? 14 : 18} />}
      {children}
    </button>
  );
};



export { Logo, Badge, Card, Button };
