import React, { useState } from 'react';
import AppShell from '../components/AppShell';
import { 
  Code2, Server, Play, CheckCircle2, Shield, Cpu, 
  Terminal, ArrowRight, Layers, FileJson, Copy
} from 'lucide-react';
import { toast } from 'sonner';

const API_ENDPOINTS = [
  {
    category: 'Authentication & RBAC',
    method: 'POST',
    path: '/api/auth/login',
    description: 'Authenticate user credentials and return JWT bearer token with assigned system role.',
    headers: { 'Content-Type': 'application/json' },
    requestBody: JSON.stringify({ email: 'admin@fleetflow.com', password: 'admin123' }, null, 2),
    sampleResponse: JSON.stringify({
      token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      user: { id: 'usr_9910', username: 'admin', email: 'admin@fleetflow.com', role: 'admin' }
    }, null, 2)
  },
  {
    category: 'Fleet Management',
    method: 'GET',
    path: '/api/vehicles',
    description: 'Retrieve paginated list of fleet vehicles with owner details and maintenance history.',
    headers: { 'Authorization': 'Bearer <token>' },
    requestBody: null,
    sampleResponse: JSON.stringify([
      { _id: 'veh_01', plateNumber: 'CA-9821-TX', brand: 'Volvo', model: 'FH16 Heavy Hauler', year: 2023, category: 'Heavy Duty' },
      { _id: 'veh_02', plateNumber: 'EV-7720-SF', brand: 'Tesla', model: 'Model 3 Long Range', year: 2024, category: 'EV' }
    ], null, 2)
  },
  {
    category: 'Roadside Assistance & Dispatch',
    method: 'POST',
    path: '/api/roadside/request',
    description: 'Submit urgent roadside emergency dispatch request with GPS coordinates and driver notes.',
    headers: { 'Authorization': 'Bearer <token>', 'Content-Type': 'application/json' },
    requestBody: JSON.stringify({
      vehicleId: 'veh_01',
      location: { latitude: 37.7749, longitude: -122.4194, address: 'Market St, San Francisco, CA' },
      issueType: 'Tire Blowout',
      notes: 'Vehicle stranded on highway exit lane.'
    }, null, 2),
    sampleResponse: JSON.stringify({
      status: 'success',
      requestId: 'req_88192',
      assignedMechanic: 'John Mechanic',
      estimatedArrival: '15 mins'
    }, null, 2)
  },
  {
    category: 'AI Microservice — Predictive Maintenance',
    method: 'POST',
    path: 'http://localhost:8000/predict/maintenance',
    description: 'FastAPI ML endpoint analyzing sensor telemetry to compute failure risk % and RUL (Remaining Useful Life).',
    headers: { 'Content-Type': 'application/json' },
    requestBody: JSON.stringify({
      mileage: 85000,
      days_since_last_service: 180,
      engine_temp_c: 98,
      oil_pressure_psi: 24,
      vibration_hz: 4.8
    }, null, 2),
    sampleResponse: JSON.stringify({
      vehicle_id: 'V-101',
      failure_probability: 0.82,
      risk_level: 'High Risk',
      estimated_rul_days: 14,
      health_index: 48.5,
      recommended_actions: [
        'Inspect primary engine oil pressure sensor',
        'Schedule immediate fluid flush and filter replacement'
      ]
    }, null, 2)
  },
  {
    category: 'AI Microservice — RAG Vector Database',
    method: 'POST',
    path: 'http://localhost:8000/rag/query',
    description: 'ChromaDB vector embedding search retrieving semantic answers with diagnostic manual citations.',
    headers: { 'Content-Type': 'application/json' },
    requestBody: JSON.stringify({
      question: 'What is the diagnostic procedure for code P0300 engine misfire on heavy semi-trucks?'
    }, null, 2),
    sampleResponse: JSON.stringify({
      answer: 'Code P0300 indicates random or multiple cylinder engine misfires. Diagnostic steps: 1) Verify fuel rail pressure. 2) Test spark plug resistance and coil pack continuity. 3) Inspect mass air flow (MAF) sensor calibration.',
      sources: ['Volvo_FH16_Diagnostic_Manual_v4.pdf (Page 142)', 'SAE_J1939_Trouble_Codes.pdf'],
      chunks_retrieved: 3
    }, null, 2)
  }
];

export default function ApiDocs() {
  const [selectedEndpoint, setSelectedEndpoint] = useState(API_ENDPOINTS[0]);
  const [responseOutput, setResponseOutput] = useState(null);
  const [loading, setLoading] = useState(false);

  const executeRequest = () => {
    setLoading(true);
    setResponseOutput(null);
    setTimeout(() => {
      setResponseOutput(selectedEndpoint.sampleResponse);
      setLoading(false);
      toast.success('API Test Request Executed Successfully (200 OK)');
    }, 600);
  };

  const copyPayload = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied payload to clipboard');
  };

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <Code2 className="w-6 h-6 text-cyan-400" /> Interactive REST & AI API Documentation
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Explore and test FleetFlow OpenAPI endpoints, JWT authorization schemas, and Python FastAPI AI ML microservices.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 rounded-xl text-xs font-mono font-semibold flex items-center gap-1.5">
              <Server className="w-3.5 h-3.5" /> Express Node.js :5000 | FastAPI Python :8000
            </span>
          </div>
        </div>

        {/* Main Split Interface */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Endpoint Selector List */}
          <div className="lg:col-span-5 space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" /> Available API Specifications
            </h3>

            <div className="space-y-2">
              {API_ENDPOINTS.map((ep, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setSelectedEndpoint(ep);
                    setResponseOutput(null);
                  }}
                  className={`w-full text-left p-3.5 rounded-2xl border transition-all space-y-2 ${
                    selectedEndpoint.path === ep.path
                      ? 'bg-slate-900 border-cyan-500/50 ring-1 ring-cyan-500/30 shadow-lg'
                      : 'bg-slate-900/60 border-slate-800/80 hover:bg-slate-900 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold ${
                      ep.method === 'GET' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                    }`}>
                      {ep.method}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-400">{ep.category}</span>
                  </div>

                  <div className="font-mono text-xs font-bold text-white tracking-tight truncate">
                    {ep.path}
                  </div>
                  <p className="text-xs text-slate-400 line-clamp-2">{ep.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Tester & Request/Response Inspector */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-4">
              
              {/* Selected Endpoint Banner */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                <div>
                  <span className="text-xs font-semibold text-cyan-400">{selectedEndpoint.category}</span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="px-2 py-0.5 bg-cyan-500/20 text-cyan-400 rounded text-xs font-mono font-bold">
                      {selectedEndpoint.method}
                    </span>
                    <span className="font-mono text-sm font-bold text-white">{selectedEndpoint.path}</span>
                  </div>
                </div>

                <button
                  onClick={executeRequest}
                  disabled={loading}
                  className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95 disabled:opacity-50"
                >
                  <Play className="w-4 h-4 fill-slate-950" />
                  {loading ? 'Executing...' : 'Test Endpoint'}
                </button>
              </div>

              <p className="text-xs text-slate-300">{selectedEndpoint.description}</p>

              {/* Request Payload Editor / View */}
              {selectedEndpoint.requestBody && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                    <span className="flex items-center gap-1"><FileJson className="w-3.5 h-3.5 text-cyan-400" /> Request Payload (JSON)</span>
                    <button 
                      onClick={() => copyPayload(selectedEndpoint.requestBody)}
                      className="hover:text-cyan-400 flex items-center gap-1 text-[11px]"
                    >
                      <Copy className="w-3 h-3" /> Copy
                    </button>
                  </div>
                  <pre className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-mono text-cyan-300 overflow-x-auto">
                    {selectedEndpoint.requestBody}
                  </pre>
                </div>
              )}

              {/* Response Output Inspector */}
              <div className="space-y-1.5 pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                  <span className="flex items-center gap-1"><Terminal className="w-3.5 h-3.5 text-emerald-400" /> Response Output</span>
                  <span className="text-emerald-400 font-bold">200 OK</span>
                </div>

                <pre className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-xs font-mono text-emerald-400 overflow-x-auto min-h-[160px] max-h-[300px]">
                  {loading ? (
                    <span className="text-slate-500 animate-pulse">Executing HTTP request...</span>
                  ) : responseOutput ? (
                    responseOutput
                  ) : (
                    <span className="text-slate-500">Click 'Test Endpoint' above to execute request.</span>
                  )}
                </pre>
              </div>

            </div>
          </div>

        </div>
      </div>
    </AppShell>
  );
}
