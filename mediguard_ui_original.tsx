import React, { useState, useEffect, useRef } from 'react';
import { 
  ShieldCheck, 
  Search, 
  Bell, 
  UserCircle, 
  LayoutDashboard, 
  Users, 
  Pill, 
  Activity, 
  History, 
  BookOpen, 
  Settings,
  UploadCloud,
  FileText,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  X,
  Info,
  Loader2,
  Plus,
  Trash2,
  Edit2,
  FileSearch,
  ArrowRight,
  Database,
  ExternalLink,
  Menu
} from 'lucide-react';

// Brand Colors mapped from requirements
const colors = {
  bg: '#F7FAF8',
  surface: '#FFFFFF',
  primary: '#087F5B',
  darkGreen: '#064E3B',
  softGreen: '#E8F5EF',
  textMain: '#17211B',
  textMuted: '#66736B',
  border: '#DCE5DF',
};

const mockPatients = [
  {
    id: 'p1',
    name: 'Eleanor Vance',
    mrn: 'MRN-847291',
    age: 68,
    sex: 'Female',
    weight: '64 kg',
    height: '165 cm',
    allergies: [
      { name: 'Penicillin', severity: 'Severe', reaction: 'Anaphylaxis' },
      { name: 'Sulfa Drugs', severity: 'Moderate', reaction: 'Rash' }
    ],
    diagnoses: [
      { name: 'Type 2 Diabetes Mellitus', status: 'Active', date: '2015-04-12' },
      { name: 'Atrial Fibrillation', status: 'Active', date: '2018-09-03' },
      { name: 'Hypertension', status: 'Active', date: '2010-11-20' },
      { name: 'Osteoarthritis', status: 'Active', date: '2020-01-15' }
    ],
    currentMeds: [
      { id: 'm1', name: 'Metformin', dose: '500 mg', freq: 'BID', route: 'Oral', status: 'Active', start: '2015-05-01' },
      { id: 'm2', name: 'Warfarin', dose: '5 mg', freq: 'Daily', route: 'Oral', status: 'Active', start: '2018-09-10' },
      { id: 'm3', name: 'Lisinopril', dose: '10 mg', freq: 'Daily', route: 'Oral', status: 'Active', start: '2010-11-25' },
      { id: 'm4', name: 'Atorvastatin', dose: '20 mg', freq: 'Daily at bedtime', route: 'Oral', status: 'Active', start: '2019-02-14' }
    ]
  }
];

const demoExtractedMeds = [
  { id: 'em1', name: 'Ibuprofen', dose: '600 mg', freq: 'TID', route: 'Oral', intendedDuration: '7 days' },
  { id: 'em2', name: 'Glimepiride', dose: '2 mg', freq: 'Daily', route: 'Oral', intendedDuration: '30 days' },
  { id: 'em3', name: 'Vitamin D3', dose: '2000 IU', freq: 'Daily', route: 'Oral', intendedDuration: 'Ongoing' }
];

const demoFindings = [
  {
    id: 'f1',
    category: 'Drug–Drug Interaction',
    severity: 'high', // high, review, safe
    status: 'High Risk',
    icon: AlertTriangle,
    affectedMeds: ['Ibuprofen (New)', 'Warfarin (Current)'],
    title: 'Increased Risk of Bleeding',
    summary: 'Concurrent use of NSAIDs (Ibuprofen) and anticoagulants (Warfarin) significantly increases the risk of gastrointestinal bleeding and may alter the anticoagulant effect.',
    mechanism: 'NSAIDs inhibit platelet aggregation and can cause gastric mucosal damage. They may also displace warfarin from protein binding sites, transiently increasing INR.',
    evidenceSource: 'Clinical Pharmacology Interaction Database; AHA Guidelines.',
    clinicalConsiderations: 'Evaluate if the NSAID is strictly necessary. If pain relief is needed, consider alternatives with lower bleeding risk (e.g., Acetaminophen, depending on hepatic function). If NSAID must be used, close monitoring of INR and signs of bleeding is required.',
    action: 'Clinician review highly recommended prior to dispensing.'
  },
  {
    id: 'f2',
    category: 'Duplicate Therapy',
    severity: 'review',
    status: 'Needs Review',
    icon: AlertCircle,
    affectedMeds: ['Glimepiride (New)', 'Metformin (Current)'],
    title: 'Overlapping Antidiabetic Therapy',
    summary: 'Patient is already on Metformin. Addition of a sulfonylurea (Glimepiride) represents therapy intensification.',
    mechanism: 'Both agents lower blood glucose through different mechanisms (insulin sensitization vs. insulin secretagogue).',
    evidenceSource: 'ADA Standards of Medical Care in Diabetes.',
    clinicalConsiderations: 'This is a common and often intentional combination for uncontrolled T2DM. However, ensure this is intentional intensification and monitor for hypoglycemia, particularly during the initiation phase of Glimepiride.',
    action: 'Verify intent of therapy intensification.'
  },
  {
    id: 'f3',
    category: 'Drug-Disease Conflict',
    severity: 'review',
    status: 'Needs Review',
    icon: AlertCircle,
    affectedMeds: ['Ibuprofen (New)'],
    patientContext: ['Hypertension (Active Diagnosis)'],
    title: 'Potential Blood Pressure Elevation',
    summary: 'NSAIDs like Ibuprofen can reduce the antihypertensive effect of ACE inhibitors (like Lisinopril) and may cause fluid retention, exacerbating hypertension.',
    mechanism: 'Inhibition of renal prostaglandin synthesis, leading to sodium and water retention.',
    evidenceSource: 'Joint National Committee (JNC) Guidelines.',
    clinicalConsiderations: 'Short-term use (7 days) is generally lower risk but still warrants monitoring. Advise patient to monitor blood pressure at home if possible.',
    action: 'Monitor blood pressure during course of therapy.'
  },
  {
    id: 'f4',
    category: 'General Safety',
    severity: 'safe',
    status: 'Passed',
    icon: CheckCircle2,
    affectedMeds: ['Vitamin D3 (New)'],
    title: 'No Significant Interactions Detected',
    summary: 'Vitamin D3 at 2000 IU daily does not have known severe interactions with the patient\'s current medication profile or diagnoses.',
    mechanism: 'N/A',
    evidenceSource: 'Standard Reference Database v4.2',
    clinicalConsiderations: 'Routine monitoring as appropriate for patient\'s age and condition.',
    action: 'Proceed normally.'
  }
];

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

const DashboardScreen = ({ patient, setView }) => {
  return (
    <div className="p-8 max-w-6xl mx-auto animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-[#17211B] mb-2 tracking-tight">Patient Overview</h1>
          <p className="text-[#66736B]">Reviewing clinical context for <span className="font-medium text-[#17211B]">{patient.name}</span></p>
        </div>
        <Button 
          icon={Activity} 
          onClick={() => setView('input-rx')}
          size="lg"
        >
          Analyze New Prescription
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Context Profile */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="border-t-4 border-t-[#087F5B]">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-[#17211B]">{patient.name}</h2>
                <span className="text-sm font-mono text-[#66736B] bg-gray-100 px-2 py-0.5 rounded mt-1 inline-block">
                  {patient.mrn}
                </span>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4 py-4 border-y border-[#DCE5DF] mb-4">
              <div>
                <span className="block text-xs text-[#66736B] mb-1 uppercase tracking-wider">Age</span>
                <span className="text-sm font-medium text-[#17211B]">{patient.age}</span>
              </div>
              <div>
                <span className="block text-xs text-[#66736B] mb-1 uppercase tracking-wider">Sex</span>
                <span className="text-sm font-medium text-[#17211B]">{patient.sex}</span>
              </div>
              <div>
                <span className="block text-xs text-[#66736B] mb-1 uppercase tracking-wider">Weight</span>
                <span className="text-sm font-medium text-[#17211B]">{patient.weight}</span>
              </div>
            </div>

            <div className="space-y-5">
              <div>
                <h4 className="text-xs font-semibold text-[#66736B] mb-2 flex items-center gap-1.5 uppercase tracking-wider">
                  <AlertTriangle size={14} className="text-red-500" /> Allergies
                </h4>
                {patient.allergies.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {patient.allergies.map((alg, idx) => (
                      <Badge key={idx} variant={alg.severity === 'Severe' ? 'red' : 'amber'}>
                        {alg.name} ({alg.severity})
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-[#17211B]">No Known Allergies</p>
                )}
              </div>

              <div>
                <h4 className="text-xs font-semibold text-[#66736B] mb-2 flex items-center gap-1.5 uppercase tracking-wider">
                  <Activity size={14} /> Active Diagnoses
                </h4>
                <ul className="space-y-1.5">
                  {patient.diagnoses.map((diag, idx) => (
                    <li key={idx} className="text-sm text-[#17211B] flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#087F5B] mt-1.5 shrink-0" />
                      {diag.name}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column: Medications */}
        <div className="lg:col-span-2">
          <Card noPadding className="h-full flex flex-col">
            <div className="p-6 border-b border-[#DCE5DF] flex justify-between items-center bg-gray-50/50 rounded-t-xl">
              <div className="flex items-center gap-2">
                <Pill className="text-[#66736B]" size={20} />
                <h3 className="text-base font-semibold text-[#17211B]">
                  Current Medications
                </h3>
              </div>
              <Badge variant="gray">{patient.currentMeds.length} Active</Badge>
            </div>
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left text-sm">
                <thead className="text-[#66736B] border-b border-[#DCE5DF] bg-white">
                  <tr>
                    <th className="px-6 py-3 font-medium">Medication</th>
                    <th className="px-6 py-3 font-medium">Dose</th>
                    <th className="px-6 py-3 font-medium">Frequency</th>
                    <th className="px-6 py-3 font-medium text-right">Started</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DCE5DF]">
                  {patient.currentMeds.map(med => (
                    <tr key={med.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium text-[#17211B]">{med.name}</div>
                        <div className="text-xs text-[#66736B]">{med.route}</div>
                      </td>
                      <td className="px-6 py-4 text-[#17211B]">{med.dose}</td>
                      <td className="px-6 py-4 text-[#17211B]">{med.freq}</td>
                      <td className="px-6 py-4 text-right text-[#66736B]">{new Date(med.start).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-4 border-t border-[#DCE5DF] bg-gray-50 rounded-b-xl text-center">
              <Button variant="ghost" size="sm" icon={ExternalLink}>View Complete Medication History</Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

const InputRxScreen = ({ setView }) => {
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressStep, setProgressStep] = useState(0);

  const steps = [
    'Initializing Mediguard engine...',
    'Extracting medication entities...',
    'Normalizing drug nomenclature...',
    'Cross-referencing clinical context...',
    'Preparing safety review...'
  ];

  const handleAnalyze = () => {
    setIsProcessing(true);
    let step = 0;
    
    const interval = setInterval(() => {
      step++;
      setProgressStep(step);
      if (step >= steps.length) {
        clearInterval(interval);
        setView('extract-rx');
      }
    }, 600); // Simulate processing time
  };

  return (
    <div className="p-8 max-w-4xl mx-auto animate-in fade-in duration-300">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-[#17211B] mb-2 tracking-tight">Input New Prescription</h1>
        <p className="text-[#66736B]">Provide prescription details to check against the patient's existing clinical profile.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
        {/* Overlay during processing */}
        {isProcessing && (
          <div className="absolute inset-0 z-10 bg-white/60 backdrop-blur-sm flex flex-col items-center justify-center rounded-xl border border-gray-100">
             <div className="w-16 h-16 bg-white rounded-full shadow-lg flex items-center justify-center mb-6">
                <Loader2 size={32} className="animate-spin text-[#087F5B]" />
             </div>
             <p className="text-[#087F5B] font-medium text-lg mb-2">Processing Prescription</p>
             <p className="text-[#66736B] text-sm font-mono h-6 transition-all">{steps[progressStep] || steps[steps.length-1]}</p>
          </div>
        )}

        <Card className="flex flex-col border-dashed border-2 bg-gray-50/50 items-center justify-center text-center p-12 hover:bg-gray-50 hover:border-[#087F5B]/30 transition-all cursor-pointer group">
          <div className="w-16 h-16 bg-[#E8F5EF] rounded-full flex items-center justify-center text-[#087F5B] mb-4 group-hover:scale-110 transition-transform">
            <UploadCloud size={32} />
          </div>
          <h3 className="font-semibold text-[#17211B] mb-1">Upload Document</h3>
          <p className="text-sm text-[#66736B] mb-6">Drag & drop image, PDF, or E-Rx file</p>
          <Button variant="secondary">Browse Files</Button>
        </Card>

        <Card className="flex flex-col p-6 shadow-sm">
          <h3 className="font-semibold text-[#17211B] mb-4 flex items-center gap-2">
            <FileText size={18} className="text-[#087F5B]" /> Paste Text Instructions
          </h3>
          <textarea 
            className="w-full flex-grow p-4 border border-[#DCE5DF] rounded-lg resize-none focus:ring-2 focus:ring-[#087F5B]/30 focus:border-[#087F5B] outline-none text-sm font-mono bg-gray-50/30"
            placeholder="E.g., Ibuprofen 600mg TID for 7 days&#10;Glimepiride 2mg PO daily&#10;Vitamin D3 2000 IU daily..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
          />
        </Card>
      </div>

      <div className="mt-8 flex justify-end">
        <Button 
          size="lg" 
          icon={ArrowRight}
          className="shadow-sm min-w-[200px]"
          onClick={handleAnalyze}
          disabled={inputText.trim().length === 0 || isProcessing}
        >
          Extract Medications
        </Button>
      </div>
    </div>
  );
};

const ExtractedRxScreen = ({ setView }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleRunSafetyCheck = () => {
    setIsAnalyzing(true);
    setTimeout(() => {
      setView('analysis');
    }, 1200);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto animate-in slide-in-from-right-4 duration-300">
       <div className="mb-8">
        <h1 className="text-2xl font-semibold text-[#17211B] mb-2 tracking-tight">Prescription Review</h1>
        <p className="text-[#66736B]">Verify the extracted medications before running the full safety analysis.</p>
      </div>

      <Card noPadding className="mb-8 border-t-4 border-t-[#087F5B]">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b border-[#DCE5DF] text-[#66736B]">
              <tr>
                <th className="px-6 py-4 font-medium">Medication</th>
                <th className="px-6 py-4 font-medium">Dose</th>
                <th className="px-6 py-4 font-medium">Frequency</th>
                <th className="px-6 py-4 font-medium">Duration</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DCE5DF]">
              {demoExtractedMeds.map(med => (
                <tr key={med.id} className="hover:bg-gray-50/80 transition-colors">
                  <td className="px-6 py-4">
                    <span className="font-medium text-[#17211B]">{med.name}</span>
                    <span className="block text-xs text-[#66736B] mt-0.5">{med.route}</span>
                  </td>
                  <td className="px-6 py-4">{med.dose}</td>
                  <td className="px-6 py-4">{med.freq}</td>
                  <td className="px-6 py-4 text-[#66736B]">{med.intendedDuration}</td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-[#66736B] hover:text-[#087F5B] p-1.5 rounded hover:bg-[#E8F5EF] transition-colors inline-flex"><Edit2 size={16}/></button>
                    <button className="text-[#66736B] hover:text-red-600 p-1.5 ml-1 rounded hover:bg-red-50 transition-colors inline-flex"><Trash2 size={16}/></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-4 border-t border-[#DCE5DF] bg-white flex justify-center rounded-b-xl">
          <Button variant="ghost" size="sm" icon={Plus}>Add Medication Manually</Button>
        </div>
      </Card>

      <div className="flex justify-between items-center bg-white shadow-sm p-6 rounded-xl border border-[#DCE5DF]">
        <div className="flex items-start gap-4 max-w-2xl">
          <div className="w-10 h-10 rounded-full bg-[#E8F5EF] flex items-center justify-center shrink-0">
             <ShieldCheck className="text-[#087F5B]" size={20} />
          </div>
          <div>
            <h3 className="font-semibold text-[#17211B] mb-1">Ready for Safety Analysis</h3>
            <p className="text-sm text-[#66736B] leading-relaxed">
              Mediguard will compare these <span className="font-semibold text-[#17211B]">{demoExtractedMeds.length} new medications</span> against the patient's existing active medications, known allergies, and active diagnoses.
            </p>
          </div>
        </div>
        <div className="shrink-0 ml-6">
          <Button 
            size="lg"
            onClick={handleRunSafetyCheck} 
            disabled={isAnalyzing}
            className="min-w-[200px]"
          >
            {isAnalyzing ? (
              <><Loader2 size={18} className="animate-spin mr-2" /> Analyzing...</>
            ) : (
              'Run Safety Analysis'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

const AnalysisScreen = ({ setSelectedFinding }) => {
  const highRiskCount = demoFindings.filter(f => f.severity === 'high').length;
  const reviewCount = demoFindings.filter(f => f.severity === 'review').length;
  const safeCount = demoFindings.filter(f => f.severity === 'safe').length;

  return (
    <div className="p-8 max-w-5xl mx-auto animate-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-[#17211B] mb-3 tracking-tight">Medication Safety Analysis</h1>
        
        {/* Summary Metrics */}
        <div className="flex gap-4 mt-6">
          <div className="bg-white border border-[#DCE5DF] rounded-lg p-4 flex-1 flex items-center gap-4 shadow-sm">
            <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center">
              <Database className="text-gray-400" size={20}/>
            </div>
            <div>
              <div className="text-2xl font-semibold text-[#17211B]">6</div>
              <div className="text-xs text-[#66736B] uppercase tracking-wider font-medium">Checks Performed</div>
            </div>
          </div>
          
          <div className="bg-white border border-red-200 rounded-lg p-4 flex-1 flex items-center gap-4 shadow-sm relative overflow-hidden">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500"></div>
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
              <AlertTriangle className="text-red-500" size={20}/>
            </div>
            <div>
              <div className="text-2xl font-semibold text-[#17211B]">{highRiskCount}</div>
              <div className="text-xs text-red-700 uppercase tracking-wider font-medium">High Risk Findings</div>
            </div>
          </div>

          <div className="bg-white border border-amber-200 rounded-lg p-4 flex-1 flex items-center gap-4 shadow-sm relative overflow-hidden">
             <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-400"></div>
            <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center">
              <AlertCircle className="text-amber-500" size={20}/>
            </div>
            <div>
              <div className="text-2xl font-semibold text-[#17211B]">{reviewCount}</div>
              <div className="text-xs text-amber-700 uppercase tracking-wider font-medium">Require Review</div>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-sm font-semibold text-[#66736B] uppercase tracking-wider mb-4 border-b border-[#DCE5DF] pb-2">
          Detailed Findings
        </h2>
        
        {demoFindings.map(finding => {
          const isHigh = finding.severity === 'high';
          const isReview = finding.severity === 'review';
          const isSafe = finding.severity === 'safe';
          
          let borderClass = 'border-[#DCE5DF] hover:border-gray-300';
          let iconBg = 'bg-gray-100';
          let iconColor = 'text-gray-500';
          
          if (isHigh) {
            borderClass = 'border-red-200 hover:border-red-300';
            iconBg = 'bg-red-50';
            iconColor = 'text-red-600';
          } else if (isReview) {
            borderClass = 'border-amber-200 hover:border-amber-300';
            iconBg = 'bg-amber-50';
            iconColor = 'text-amber-600';
          } else if (isSafe) {
            borderClass = 'border-emerald-200 hover:border-emerald-300';
            iconBg = 'bg-emerald-50';
            iconColor = 'text-emerald-600';
          }

          return (
            <Card 
              key={finding.id} 
              onClick={() => setSelectedFinding(finding)}
              className={`transition-all duration-200 ${borderClass}`}
            >
              <div className="flex items-start gap-4">
                <div className={`mt-1 p-2.5 rounded-full ${iconBg} ${iconColor} shrink-0`}>
                  <finding.icon size={20} strokeWidth={2.5} />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-xs font-semibold uppercase tracking-wider text-[#66736B]">{finding.category}</span>
                    <span className="text-gray-300">•</span>
                    <Badge variant={isHigh ? 'red' : isReview ? 'amber' : 'green'}>{finding.status}</Badge>
                  </div>
                  
                  <h3 className="text-lg font-semibold text-[#17211B] mb-2">{finding.title}</h3>
                  <p className="text-sm text-[#66736B] line-clamp-2 leading-relaxed mb-4 max-w-3xl">
                    {finding.summary}
                  </p>
                  
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                       <span className="text-xs text-[#66736B]">Involves:</span>
                       <div className="flex gap-1.5">
                         {finding.affectedMeds.map((med, idx) => (
                           <span key={idx} className="text-xs font-medium bg-gray-100 text-gray-700 px-2 py-0.5 rounded border border-gray-200">
                             {med}
                           </span>
                         ))}
                       </div>
                    </div>
                  </div>
                </div>

                <div className="shrink-0 flex items-center justify-center h-full pt-4">
                   <Button variant="ghost" size="sm" icon={ChevronRight} className="text-[#087F5B]">View Details</Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

const FindingDetailPanel = ({ finding, onClose }) => {
  if (!finding) return null;

  const isHigh = finding.severity === 'high';
  const isReview = finding.severity === 'review';
  const isSafe = finding.severity === 'safe';

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity animate-in fade-in"
        onClick={onClose}
      />
      <div className="fixed inset-y-0 right-0 w-full max-w-2xl bg-white shadow-2xl z-50 flex flex-col animate-in slide-in-from-right-8 duration-300 border-l border-[#DCE5DF]">
        
        {/* Header */}
        <div className={`px-8 py-6 border-b flex items-start justify-between
          ${isHigh ? 'bg-red-50/50 border-red-100' : isReview ? 'bg-amber-50/50 border-amber-100' : 'bg-emerald-50/50 border-emerald-100'}
        `}>
          <div className="flex items-start gap-4">
             <div className={`mt-1 p-2.5 rounded-full bg-white shadow-sm shrink-0
               ${isHigh ? 'text-red-600' : isReview ? 'text-amber-600' : 'text-emerald-600'}
             `}>
                <finding.icon size={24} strokeWidth={2.5} />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-[#66736B]">{finding.category}</span>
                  <Badge variant={isHigh ? 'red' : isReview ? 'amber' : 'green'}>{finding.status}</Badge>
                </div>
                <h2 className="text-2xl font-semibold text-[#17211B] leading-tight">{finding.title}</h2>
              </div>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-700 hover:bg-white rounded-full transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8">
           
           <div className="mb-8">
             <h3 className="text-sm font-semibold text-[#17211B] uppercase tracking-wider mb-3">Detected Entities</h3>
             <div className="flex flex-wrap gap-2">
               {finding.affectedMeds.map((med, idx) => (
                 <div key={idx} className="flex items-center gap-2 bg-gray-50 border border-[#DCE5DF] px-3 py-1.5 rounded-lg text-sm font-medium text-[#17211B]">
                   <Pill size={14} className="text-[#66736B]"/> {med}
                 </div>
               ))}
               {finding.patientContext && finding.patientContext.map((ctx, idx) => (
                 <div key={idx} className="flex items-center gap-2 bg-gray-50 border border-[#DCE5DF] px-3 py-1.5 rounded-lg text-sm font-medium text-[#17211B]">
                   <Activity size={14} className="text-[#66736B]"/> {ctx}
                 </div>
               ))}
             </div>
           </div>

           <div className="space-y-8">
             <section>
               <h3 className="text-sm font-semibold text-[#17211B] uppercase tracking-wider mb-2">Summary</h3>
               <p className="text-[#17211B] leading-relaxed">{finding.summary}</p>
             </section>

             {finding.mechanism && finding.mechanism !== 'N/A' && (
               <section>
                 <h3 className="text-sm font-semibold text-[#17211B] uppercase tracking-wider mb-2">Mechanism of Action / Conflict</h3>
                 <p className="text-[#66736B] leading-relaxed">{finding.mechanism}</p>
               </section>
             )}

             <section className="bg-blue-50/50 border border-blue-100 rounded-xl p-5">
               <h3 className="text-sm font-semibold text-blue-900 uppercase tracking-wider mb-2 flex items-center gap-2">
                  <Info size={16} /> Clinical Considerations
               </h3>
               <p className="text-blue-800 text-sm leading-relaxed">{finding.clinicalConsiderations}</p>
             </section>

             <section>
               <h3 className="text-sm font-semibold text-[#17211B] uppercase tracking-wider mb-2">Recommended Action</h3>
               <div className={`p-4 rounded-lg font-medium border
                 ${isHigh ? 'bg-red-50 text-red-800 border-red-200' : 
                   isReview ? 'bg-amber-50 text-amber-800 border-amber-200' : 
                   'bg-emerald-50 text-emerald-800 border-emerald-200'}
               `}>
                 {finding.action}
               </div>
             </section>
           </div>
           
           <div className="mt-12 pt-6 border-t border-[#DCE5DF]">
              <h3 className="text-xs font-semibold text-[#66736B] uppercase tracking-wider mb-2">Evidence & Source</h3>
              <p className="text-sm text-[#66736B] flex items-center gap-2">
                <BookOpen size={14} />
                {finding.evidenceSource}
              </p>
           </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-[#DCE5DF] bg-gray-50 flex justify-between items-center shrink-0">
           <p className="text-xs text-[#66736B] max-w-sm">
             Clinical decision support. Final decisions remain with a qualified healthcare professional.
           </p>
           <Button variant="outline" onClick={onClose}>Close Detail</Button>
        </div>
      </div>
    </>
  );
};

const App = () => {
  const [currentView, setCurrentView] = useState('dashboard');
  const [selectedFinding, setSelectedFinding] = useState(null);
  const activePatient = mockPatients[0];

  // Simple router simulation
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
      case 'settings':
      case 'history':
      case 'patients':
         return (
           <div className="p-8 max-w-4xl mx-auto flex flex-col items-center justify-center h-[60vh] text-center">
             <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 mb-4">
                <Info size={32} />
             </div>
             <h2 className="text-xl font-semibold text-[#17211B] mb-2">{currentView.charAt(0).toUpperCase() + currentView.slice(1)} Screen</h2>
             <p className="text-[#66736B]">This section is not implemented in the current prototype flow.</p>
             <Button variant="outline" className="mt-6" onClick={() => setCurrentView('dashboard')}>Return to Dashboard</Button>
           </div>
         )
      default:
        return <DashboardScreen patient={activePatient} setView={setCurrentView} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#F7FAF8] font-sans text-[#17211B] flex flex-col md:flex-row overflow-hidden">
      
      {/* Sidebar Navigation */}
      <Sidebar currentView={currentView} setView={setCurrentView} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
        <Topbar patient={activePatient} />
        
        <main className="flex-1 overflow-y-auto">
          {renderContent()}
        </main>
      </div>

      {/* Modals / Slide-overs */}
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