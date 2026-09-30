// @ts-nocheck
import React from 'react';
import { Activity, AlertTriangle, Pill, ExternalLink } from 'lucide-react';
import { Badge, Button, Card } from '../components/ui';

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

export default DashboardScreen;
