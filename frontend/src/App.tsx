// @ts-nocheck
import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import DashboardScreen from './screens/DashboardScreen';
import InputRxScreen from './screens/InputRxScreen';
import ExtractedRxScreen from './screens/ExtractedRxScreen';
import AnalysisScreen from './screens/AnalysisScreen';
import FindingDetailPanel from './screens/FindingDetailPanel';
import PlaceholderScreen from './screens/PlaceholderScreen';
import { mockPatients } from './data/mockData';

const App = () => {
  const [currentView, setCurrentView] = useState('dashboard');
  const [selectedFinding, setSelectedFinding] = useState(null);
  const activePatient = mockPatients[0];

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return <DashboardScreen patient={activePatient} setView={setCurrentView} />;
      case 'input-rx':
        return <InputRxScreen setView={setCurrentView} />;
      case 'extract-rx':
        return <ExtractedRxScreen setView={setCurrentView} />;
      case 'analysis':
        return <AnalysisScreen setSelectedFinding={setSelectedFinding} />;
      case 'sources':
        return <PlaceholderScreen title="Data Sources" setView={setCurrentView} />;
      case 'settings':
        return <PlaceholderScreen title="Settings" setView={setCurrentView} />;
      case 'history':
        return <PlaceholderScreen title="Safety History" setView={setCurrentView} />;
      case 'patients':
        return <PlaceholderScreen title="Patient Directory" setView={setCurrentView} />;
      default:
        return <DashboardScreen patient={activePatient} setView={setCurrentView} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#F7FAF8] font-sans text-[#17211B] flex flex-col md:flex-row overflow-hidden">
      <Sidebar currentView={currentView} setView={setCurrentView} />
      <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
        <Topbar patient={activePatient} />
        <main className="flex-1 overflow-y-auto">{renderContent()}</main>
      </div>
      {selectedFinding && (
        <FindingDetailPanel
          finding={selectedFinding}
          onClose={() => setSelectedFinding(null)}
        />
      )}
    </div>
  );
};

export default App;
