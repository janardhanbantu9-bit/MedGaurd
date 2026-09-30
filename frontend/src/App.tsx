// @ts-nocheck
import React, { useEffect, useState } from 'react';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import DashboardScreen from './screens/DashboardScreen';
import InputRxScreen from './screens/InputRxScreen';
import ExtractedRxScreen from './screens/ExtractedRxScreen';
import AnalysisScreen from './screens/AnalysisScreen';
import FindingDetailPanel from './screens/FindingDetailPanel';
import PlaceholderScreen from './screens/PlaceholderScreen';
import { mockPatients } from './data/mockData';
import { getPatients } from './services/api';

const App = () => {
  const [currentView, setCurrentView] = useState('dashboard');
  const [selectedFinding, setSelectedFinding] = useState(null);
  const [patients, setPatients] = useState([]);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [loadingPatients, setLoadingPatients] = useState(true);
  const [patientError, setPatientError] = useState('');

  const activePatient = patients[0] || mockPatients[0];

  useEffect(() => {
    let mounted = true;
    getPatients()
      .then((items) => {
        if (mounted && items.length) setPatients(items);
      })
      .catch((error) => {
        if (mounted) setPatientError(error?.message || 'Could not load patient data');
      })
      .finally(() => {
        if (mounted) setLoadingPatients(false);
      });

    return () => { mounted = false; };
  }, []);

  const renderContent = () => {
    if (loadingPatients && currentView === 'dashboard') {
      return <div className="p-8 text-sm text-[#66736B]">Loading patient context…</div>;
    }

    switch (currentView) {
      case 'dashboard':
        return <DashboardScreen patient={activePatient} setView={setCurrentView} />;
      case 'input-rx':
        return (
          <InputRxScreen
            patient={activePatient}
            setView={setCurrentView}
            onAnalysisComplete={setAnalysisResult}
          />
        );
      case 'extract-rx':
        return <ExtractedRxScreen analysisResult={analysisResult} setView={setCurrentView} />;
      case 'analysis':
        return <AnalysisScreen analysisResult={analysisResult} setSelectedFinding={setSelectedFinding} />;
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
        <main className="flex-1 overflow-y-auto">
          {patientError && currentView === 'dashboard' && (
            <div className="m-8 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">{patientError}</div>
          )}
          {renderContent()}
        </main>
      </div>
      {selectedFinding && (
        <FindingDetailPanel finding={selectedFinding} onClose={() => setSelectedFinding(null)} />
      )}
    </div>
  );
};

export default App;
