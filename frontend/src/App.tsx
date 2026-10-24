import React, { useCallback, useEffect, useRef, useState } from 'react';
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
import OnboardingScreen from './screens/OnboardingScreen';
import { supabase } from './lib/supabase';
import { getProfile, saveOnboardingProfile } from './services/api';
import { LogOut, RefreshCw } from 'lucide-react';

function ProfileUnavailable({ message, onRetry, onSignOut }: { message: string; onRetry: () => void; onSignOut: () => void }) {
  return (
    <section className="mx-auto max-w-xl px-6 py-16 md:px-10">
      <div className="rounded-3xl border border-amber-200 bg-amber-50 p-7">
        <h1 className="font-serif text-3xl text-[#173A2C]">Your health profile could not be loaded.</h1>
        <p className="mt-3 text-sm leading-6 text-amber-900">{message}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center gap-2 rounded-xl bg-[#087F5B] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#066F50]"
          >
            <RefreshCw size={16} />Try again
          </button>
          <button
            type="button"
            onClick={onSignOut}
            className="inline-flex items-center gap-2 rounded-xl border border-[#DCE5DF] bg-white px-4 py-2.5 text-sm font-medium text-[#526057] hover:text-[#17211B]"
          >
            <LogOut size={16} />Sign out
          </button>
        </div>
      </div>
    </section>
  );
}

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState('dashboard');
  const [selectedFinding, setSelectedFinding] = useState<any>(null);
  const [patients, setPatients] = useState<any[]>([]);
  const [extractedMeds, setExtractedMeds] = useState<any[]>([]);
  const [analysis, setAnalysis] = useState<any>(null);
  const [scanSession, setScanSession] = useState(0);
  const [authUser, setAuthUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [loadingPatients, setLoadingPatients] = useState(false);
  const [patientError, setPatientError] = useState('');

  // Track the user id for whom the profile was loaded to prevent reloading on tab focus
  const loadedUserIdRef = useRef<string | null>(null);

  const activePatient = patients[0] || null;

  const clearAppState = useCallback(() => {
    setPatients([]);
    setPatientError('');
    setSelectedFinding(null);
    setAnalysis(null);
    setExtractedMeds([]);
    setCurrentView('dashboard');
    loadedUserIdRef.current = null;
  }, []);

  const loadUserContext = useCallback(async (user: any, isBackground = false) => {
    setAuthUser(user);
    if (!isBackground) {
      setLoadingPatients(true);
    }
    setPatientError('');

    try {
      const profile = await getProfile();
      setPatients(profile ? [profile] : []);
      loadedUserIdRef.current = user.id;
    } catch (error: any) {
      console.error('MediGuard profile bootstrap failed:', error);
      if (!isBackground) {
        setPatients([]);
        setPatientError(error?.message || 'Could not load your health profile.');
      }
    } finally {
      if (!isBackground) {
        setLoadingPatients(false);
      }
    }
  }, []);

  useEffect(() => {
    if (!supabase) {
      setAuthLoading(false);
      return undefined;
    }

    let mounted = true;
    let authResolved = false;

    const authTimeout = window.setTimeout(() => {
      if (mounted && !authResolved) {
        authResolved = true;
        console.error('MediGuard auth initialization timed out. Check Supabase configuration/network.');
        setPatientError('Authentication is taking too long. Check your connection, then try refreshing.');
        setAuthLoading(false);
      }
    }, 10000);

    supabase.auth.getSession()
      .then(({ data, error }) => {
        if (!mounted) return;
        authResolved = true;
        if (error) {
          console.error('Initial Supabase session lookup failed:', error);
          setPatientError(`Authentication session error: ${error.message}`);
          setAuthLoading(false);
          return;
        }
        if (data.session?.user) {
          setAuthLoading(false);
          void loadUserContext(data.session.user);
        } else {
          setAuthUser(null);
          setAuthLoading(false);
        }
      })
      .catch((error) => {
        if (!mounted) return;
        authResolved = true;
        console.error('Initial Supabase session lookup rejected:', error);
        setPatientError(error?.message || 'Could not check your sign-in session.');
        setAuthLoading(false);
      })
      .finally(() => {
        window.clearTimeout(authTimeout);
        if (mounted) setAuthLoading(false);
      });

    const { data: subscription } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      authResolved = true;
      window.clearTimeout(authTimeout);

      if (event === 'SIGNED_OUT') {
        setAuthUser(null);
        clearAppState();
        setAuthLoading(false);
        return;
      }

      if (event === 'TOKEN_REFRESHED') {
        if (session?.user) {
          setAuthUser(session.user);
        }
        setAuthLoading(false);
        return;
      }

      if (session?.user) {
        setAuthUser(session.user);
        setAuthLoading(false);

        // TAB REFOCUS / SIGNED_IN FIX:
        // Supabase triggers SIGNED_IN on tab refocus. If the user id matches what's
        // already loaded, ignore the event so we do NOT set loadingPatients=true
        // and unmount the active screen (which would wipe out user input).
        if (session.user.id !== loadedUserIdRef.current) {
          void loadUserContext(session.user);
        }
      }
    });

    const handleSessionExpired = () => {
      setAuthUser(null);
      clearAppState();
    };
    window.addEventListener('mediguard:session-expired', handleSessionExpired);

    return () => {
      mounted = false;
      window.clearTimeout(authTimeout);
      subscription.subscription.unsubscribe();
      window.removeEventListener('mediguard:session-expired', handleSessionExpired);
    };
  }, [clearAppState, loadUserContext]);

  const handleSignedOut = () => {
    setAuthUser(null);
    clearAppState();
  };

  const handleOnboardingComplete = async (payload: any) => {
    const profile = await saveOnboardingProfile(payload);
    setPatients([profile]);
    if (authUser?.id) {
      loadedUserIdRef.current = authUser.id;
    }
    setPatientError('');
    setCurrentView('dashboard');
  };

  const retryProfile = () => {
    if (authUser) void loadUserContext(authUser);
  };

  const setView = (view: string) => {
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
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F7FAF8] text-sm text-[#66736B]">
        Loading your private account…
      </div>
    );
  }

  if (!supabase || !authUser) return <LoginScreen />;

  const renderContent = () => {
    if (loadingPatients) {
      return <div className="p-8 text-sm text-[#66736B]">Loading your health context…</div>;
    }
    if (!activePatient) {
      if (patientError) {
        return <ProfileUnavailable message={patientError} onRetry={retryProfile} onSignOut={handleSignedOut} />;
      }
      return <OnboardingScreen onComplete={handleOnboardingComplete} />;
    }
    if (!activePatient.onboarding_completed && !activePatient.onboardingCompleted) {
      return <OnboardingScreen onComplete={handleOnboardingComplete} />;
    }

    switch (currentView) {
      case 'dashboard':
        return (
          <DashboardScreen
            patient={activePatient}
            setView={setView}
            onProfileUpdated={(updatedProfile: any) => setPatients([updatedProfile])}
          />
        );
      case 'input-rx':
        return <InputRxScreen key={scanSession} setView={setCurrentView} setExtractedMeds={setExtractedMeds} />;
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
        return <HistoryScreen patientId={activePatient.id} setView={setView} />;
      case 'talk-ai':
        return <TalkToAIScreen patient={activePatient} setView={setView} />;
      default:
        return (
          <DashboardScreen
            patient={activePatient}
            setView={setView}
            onProfileUpdated={(updatedProfile: any) => setPatients([updatedProfile])}
          />
        );
    }
  };

  return (
    <div className="min-h-[100dvh] bg-[#F7FAF8] font-sans text-[#17211B] flex flex-col md:flex-row overflow-hidden">
      <Sidebar currentView={currentView} setView={setView} />
      <div className="flex-1 flex flex-col h-[100dvh] overflow-hidden relative">
        <Topbar user={authUser} onSignedOut={handleSignedOut} />
        <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
          {patientError && activePatient && currentView === 'dashboard' && (
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
