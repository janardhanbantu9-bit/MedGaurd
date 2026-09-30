// @ts-nocheck
import React, { useCallback, useEffect, useState } from 'react';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import DashboardScreen from './screens/DashboardScreen';
import InputRxScreen from './screens/InputRxScreen';
import ExtractedRxScreen from './screens/ExtractedRxScreen';
import AnalysisScreen from './screens/AnalysisScreen';
import FindingDetailPanel from './screens/FindingDetailPanel';
import HistoryScreen from './screens/HistoryScreen';
import TalkToAIScreen from './screens/TalkToAIScreen';
import LoginScreen from './screens/LoginScreen';
import { supabase } from './lib/supabase';
import { ensureProfile, getPatients } from './services/api';
import { BookOpenCheck, BrainCircuit, Database, LogOut, RefreshCw, ShieldCheck } from 'lucide-react';

function HowItWorksScreen() {
  const sources = [
    { title: 'RxNorm', detail: 'Matches medication names to standardized drug concepts and active ingredients.', icon: BookOpenCheck },
    { title: 'RxClass', detail: 'Adds recognized therapeutic class information to support class-level comparisons.', icon: Database },
    { title: 'openFDA', detail: 'Looks up official drug labeling, including warnings, interactions and dosage sections.', icon: ShieldCheck },
    { title: 'Deterministic safety checks', detail: 'Applies transparent checks to allergies, medication overlaps, conditions and available dose limits.', icon: ShieldCheck },
    { title: 'AI explanation', detail: 'Turns source-backed findings into plain language. It does not make the final safety decision.', icon: BrainCircuit },
  ];

  return (
    <section className="mx-auto max-w-5xl px-6 py-10 md:px-10 md:py-14">
      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-[#087F5B]">Behind the check</p>
      <h1 className="font-serif text-4xl tracking-tight text-[#17211B] md:text-5xl">How it works</h1>
      <p className="mt-3 max-w-2xl leading-7 text-[#66736B]">MediGuard brings together established drug references and consistent checks to help you review a prescription with more context.</p>
      <div className="mt-9 divide-y divide-[#E5ECE7] rounded-3xl border border-[#DCE5DF] bg-white px-6 md:px-8">
        {sources.map(({ title, detail, icon: Icon }, index) => (
          <article key={title} className="flex gap-4 py-6">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#E8F5EF] text-[#087F5B]"><Icon size={19} /></span>
            <div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#94A198]">Step {index + 1}</p><h2 className="mt-1 font-serif text-xl text-[#173A2C]">{title}</h2><p className="mt-1 max-w-2xl text-sm leading-6 text-[#66736B]">{detail}</p></div>
          </article>
        ))}
      </div>
    </section>
  );
}

function ProfileUnavailable({ message, onRetry, onSignOut }) {
  return (
    <section className="mx-auto max-w-xl px-6 py-16 md:px-10">
      <div className="rounded-3xl border border-amber-200 bg-amber-50 p-7">
        <h1 className="font-serif text-3xl text-[#173A2C]">Your health profile could not be loaded.</h1>
        <p className="mt-3 text-sm leading-6 text-amber-900">{message}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <button type="button" onClick={onRetry} className="inline-flex items-center gap-2 rounded-xl bg-[#087F5B] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#066F50]"><RefreshCw size={16} />Try again</button>
          <button type="button" onClick={onSignOut} className="inline-flex items-center gap-2 rounded-xl border border-[#DCE5DF] bg-white px-4 py-2.5 text-sm font-medium text-[#526057] hover:text-[#17211B]"><LogOut size={16} />Sign out</button>
        </div>
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
  const [authUser, setAuthUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [loadingPatients, setLoadingPatients] = useState(false);
  const [patientError, setPatientError] = useState('');

  const activePatient = patients[0] || null;

  const clearAppState = useCallback(() => {
    setPatients([]);
    setPatientError('');
    setSelectedFinding(null);
    setAnalysis(null);
    setExtractedMeds([]);
    setCurrentView('dashboard');
  }, []);

  const loadUserContext = useCallback(async (user) => {
    setAuthUser(user);
    setLoadingPatients(true);
    setPatientError('');

    try {
      const name = String(user?.user_metadata?.full_name ?? '').trim();
      await ensureProfile(name);
      const items = await getPatients();
      setPatients(items);
      if (!items.length) throw new Error('Your account is signed in, but no health profile was returned.');
    } catch (error) {
      console.error('MediGuard profile bootstrap failed:', error);
      setPatients([]);
      setPatientError(error?.message || 'Could not load your health profile.');
    } finally {
      setLoadingPatients(false);
    }
  }, []);

  useEffect(() => {
    if (!supabase) {
      setAuthLoading(false);
      return undefined;
    }

    let mounted = true;

    supabase.auth.getSession().then(({ data, error }) => {
      if (!mounted) return;
      if (error) {
        console.error('Initial Supabase session lookup failed:', error);
        setPatientError(`Authentication session error: ${error.message}`);
        setAuthLoading(false);
        return;
      }
      if (data.session?.user) {
        void loadUserContext(data.session.user);
      } else {
        setAuthUser(null);
        setAuthLoading(false);
      }
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      if (event === 'SIGNED_OUT') {
        setAuthUser(null);
        clearAppState();
        setAuthLoading(false);
        return;
      }
      if (session?.user) {
        setAuthLoading(false);
        void loadUserContext(session.user);
      }
    });

    return () => {
      mounted = false;
      subscription.subscription.unsubscribe();
    };
  }, [clearAppState, loadUserContext]);

  const handleSignedOut = () => {
    setAuthUser(null);
    clearAppState();
  };

  const retryProfile = () => {
    if (authUser) void loadUserContext(authUser);
  };

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

  if (authLoading) {
    return <div className="flex min-h-screen items-center justify-center bg-[#F7FAF8] text-sm text-[#66736B]">Loading your private account…</div>;
  }

  if (!supabase) return <LoginScreen />;
  if (!authUser) return <LoginScreen />;

  const renderContent = () => {
    if (loadingPatients) return <div className="p-8 text-sm text-[#66736B]">Loading your health context…</div>;
    if (!activePatient) return <ProfileUnavailable message={patientError || 'Your health profile is not available yet.'} onRetry={retryProfile} onSignOut={handleSignedOut} />;

    switch (currentView) {
      case 'dashboard': return <DashboardScreen patient={activePatient} setView={setView} />;
      case 'input-rx': return <InputRxScreen key={scanSession} setView={setCurrentView} setExtractedMeds={setExtractedMeds} />;
      case 'extract-rx': return <ExtractedRxScreen setView={setCurrentView} patient={activePatient} meds={extractedMeds} setMeds={setExtractedMeds} setAnalysis={setAnalysis} />;
      case 'analysis': return <AnalysisScreen analysis={analysis} setSelectedFinding={setSelectedFinding} setView={setView} />;
      case 'history': return <HistoryScreen patientId={activePatient.id} setView={setView} />;
      case 'how-it-works': return <HowItWorksScreen />;
      case 'talk-ai': return <TalkToAIScreen patient={activePatient} setView={setView} />;
      default: return <DashboardScreen patient={activePatient} setView={setView} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#F7FAF8] font-sans text-[#17211B] flex flex-col md:flex-row overflow-hidden">
      <Sidebar currentView={currentView} setView={setView} />
      <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
        <Topbar user={authUser} onSignedOut={handleSignedOut} />
        <main className="flex-1 overflow-y-auto">
          {patientError && activePatient && currentView === 'dashboard' && (
            <div className="m-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 md:m-8">Some profile details could not be loaded: {patientError}</div>
          )}
          {renderContent()}
        </main>
      </div>
      {selectedFinding && <FindingDetailPanel finding={selectedFinding} onClose={() => setSelectedFinding(null)} />}
    </div>
  );
};

export default App;
