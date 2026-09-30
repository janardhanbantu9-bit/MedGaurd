// @ts-nocheck
import React from 'react';
import { Info } from 'lucide-react';
import { Button } from '../components/ui';

const PlaceholderScreen = ({ title, setView }) => (
  <div className="p-8 max-w-4xl mx-auto flex flex-col items-center justify-center h-[60vh] text-center">
    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 mb-4">
      <Info size={32} />
    </div>
    <h2 className="text-xl font-semibold text-[#17211B] mb-2">{title}</h2>
    <p className="text-[#66736B]">This section is scaffolded and ready to be connected to backend data.</p>
    <Button variant="outline" className="mt-6" onClick={() => setView('dashboard')}>Return to Dashboard</Button>
  </div>
);

export default PlaceholderScreen;
