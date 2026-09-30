// @ts-nocheck
import React, { useEffect, useState } from 'react';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import DashboardScreen from './screens/DashboardScreen';
import InputRxScreen from './screens/InputRxScreen';
import ExtractedRxScreen from './screens/ExtractedRxScreen';
import AnalysisScreen from './screens/AnalysisScreen';
import FindingDetailPanel from './screens/FindingDetailPanel';
import HistoryScreen from './screens/HistoryScreen';
import TalkToAIScreen from './screens/TalkToAIScreen';
import { mockPatients } from './data/mockData';
import { getPatients } from './services/api';
import { BookOpenCheck, BrainCircuit, Database, ShieldCheck } from 'lucide-react';

function HowItWorksScreen() {
  const sources = [
    {
      title: 'RxNorm',
      detail: 'Matches medication names to standardized drug concepts and active ingredients.',
      icon: BookOpenCheck,
    },
    {
      title: 'RxClass',
      detail: 'Adds recognized therapeutic class information to support class-level comparisons.',
      icon: Database,
    },
    {
      title: 'openFDA',
      detail: 'Looks up official drug labeling, including warnings, interactions and dosage sections.',
      icon: ShieldCheck,
    },
    {
      title: 'Deterministic safety checks',
      detail: 'Applies transparent checks to allergies, medication overlaps, conditions and available dose limits.',
      icon: ShieldCheck,
    },
    {
      title: 'AI explanation',
      detail: 'Turns source-backed findings into plain language. It does not make the final safety decision.',
      icon: BrainCircuit,
    },
  ];

  return (
    <section className="mx-auto max-w-5xl px-6 py-10 md:px-10 md:py-14">
      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-[#087F5B]">Behind the check</p>
      <h1 className="font-serif text-4xl tracking-tight text-[#17211B] md:text-5xl">How it works</h1>
      <p className="mt-3 max-w-2xl leading-7 text-[#66736B]">
        MediGuard brings together established drug references and consistent checks to help you review a prescription with more context.
      </p>

      <div className="mt-9 divide-y divide-[#E5ECE7] rounded-3xl border border-[#DCE5DF] bg-white px-6 md:px-8">
        {sources.map(({ title, detail, icon: Icon }, index) => (
          <article key={title} className="flex gap-4 py-6">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#E8F5EF] text-[#087F5B]">
              <Icon size={19} />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#94A198]">Step {index + 1}</p>
              <h2 className="mt-1 font-serif text-xl text-[#173A2C]">{title}</h2>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-[#66736B]">{detail}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

const App = () => {
  const [currentView, setCurrentView] = useState('dashboard');
  const [selectedFinding, setSelectedFinding] = useState(null);
  const [patients, setPatients] = useState([]);
  const [extractedMeds, setExtractedMeds] = useState([]);
  const [analysis, setAnalysis] = useState(null);
  const [scanSession, setScanSession] = useState(0);
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
        if (mounted) setPatientError(error?.message || 'Could not load your health context');
      })
      .finally(() => {
        if (mounted) setLoadingPatients(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const setView = (view) => {
    if (view === 'input-rx') {
      setScanSession((session) => session + 1);
      setAnalysis(null);
      setExtractedMeds([]);
      setSelectedFinding(null);
      setPatientError('');
    }
    setCurrentView(view);
  };

  const renderContent = () => {
    if (loadingPatients && currentView === 'dashboard') {
      return <div className="p-8 text-sm text-[#66736B]">Loading your health context…</div>;
    }

    switch (currentView) {
      case 'dashboard':
        return <DashboardScreen patient={activePatient} setView={setView} />;
      case 'input-rx':
        return (
          <InputRxScreen
            key={scanSession}
            setView={setCurrentView}
            setExtractedMeds={setExtractedMeds}
          />
        );
      case 'extract-rx':
        return (
          <ExtractedRxScreen
            setView={setCurrentView}
            patient={activePatient}
            meds={extractedMeds}
            setMeds={setExtractedMeds}
            setAnalysis={setAnalysis}
          />
        );
      case 'analysis':
        return <AnalysisScreen analysis={analysis} setSelectedFinding={setSelectedFinding} setView={setView} />;
      case 'history':
        return <HistoryScreen patientId={activePatient?.id} setView={setView} />;
      case 'how-it-works':
        return <HowItWorksScreen />;
      case 'talk-ai':
        return <TalkToAIScreen patient={activePatient} setView={setView} />;
      default:
        return <DashboardScreen patient={activePatient} setView={setView} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#F7FAF8] font-sans text-[#17211B] flex flex-col md:flex-row overflow-hidden">
      <Sidebar currentView={currentView} setView={setView} />

      <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
        <Topbar patient={activePatient} />

        <main className="flex-1 overflow-y-auto">
          {patientError && currentView === 'dashboard' && (
            <div className="m-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 md:m-8">
              Some profile details could not be loaded: {patientError}
            </div>
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
