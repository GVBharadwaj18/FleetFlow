import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, CircleMarker } from 'react-leaflet';
import L from 'leaflet';
import { io } from 'socket.io-client';
import { 
  Navigation, Radio, Zap, Gauge, AlertTriangle, ShieldCheck, 
  RefreshCw, MapPin, Activity, CheckCircle2, Truck, Wrench
} from 'lucide-react';
import AppShell from '../components/AppShell';
import { toast } from 'sonner';

// Custom Map Marker Icons using Leaflet DivIcons with pulse effects
const createCustomIcon = (status, dtc) => {
  const color = dtc ? '#ef4444' : status === 'maintenance' ? '#f59e0b' : '#10b981';
  return L.divIcon({
    className: 'custom-vehicle-marker',
    html: `
      <div style="
        background-color: ${color};
        width: 22px;
        height: 22px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 0 12px ${color};
        position: relative;
      ">
        <div style="
          position: absolute;
          inset: -4px;
          border-radius: 50%;
          border: 2px solid ${color};
          animation: ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite;
          opacity: 0.75;
        "></div>
      </div>
    `,
    iconSize: [22, 22],
    iconAnchor: [11, 11]
  });
};

const INITIAL_VEHICLES = [
  { id: 'V-101', name: 'Tata Prima 5530.S Heavy Truck', lat: 12.9716, lng: 77.5946, speed: 62, fuel: 84, battery: 98, status: 'active', dtc: null },
  { id: 'V-102', name: 'Tata Nexon EV Fleet Edition', lat: 12.9352, lng: 77.6245, speed: 45, fuel: 100, battery: 72, status: 'active', dtc: null },
  { id: 'V-103', name: 'Mahindra Bolero Maxi Truck HD', lat: 12.9784, lng: 77.6408, speed: 0, fuel: 45, battery: 88, status: 'maintenance', dtc: 'P0300 - Engine Misfire' },
  { id: 'V-104', name: 'Ashok Leyland AVTR 2820 Rigid', lat: 12.9698, lng: 77.7499, speed: 58, fuel: 68, battery: 91, status: 'active', dtc: null },
  { id: 'V-105', name: 'Hyundai Tucson Hybrid', lat: 12.8452, lng: 77.6602, speed: 38, fuel: 52, battery: 64, status: 'active', dtc: 'P0171 - System Too Lean' },
  { id: 'V-106', name: 'Eicher Pro 3019 Commercial Van', lat: 13.0358, lng: 77.5970, speed: 50, fuel: 90, battery: 95, status: 'active', dtc: null }
];

export default function LiveMap() {
  const [vehicles, setVehicles] = useState(INITIAL_VEHICLES);
  const [selectedVehicle, setSelectedVehicle] = useState(INITIAL_VEHICLES[0]);
  const [isConnected, setIsConnected] = useState(false);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    // Socket connection to backend WebSocket server
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
    const socket = io(backendUrl, { transports: ['websocket', 'polling'] });

    socket.on('connect', () => {
      setIsConnected(true);
      toast.success('Real-time WebSocket Telemetry Connected', {
        description: 'Receiving live vehicle GPS telemetry feed'
      });
    });

    socket.on('telemetry:update', (data) => {
      if (data && data.vehicles) {
        setVehicles(data.vehicles);
        setSelectedVehicle(prev => {
          const updated = data.vehicles.find(v => v.id === prev?.id);
          return updated || prev;
        });
      }
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    // Fallback simulation timer if backend socket isn't connected
    const fallbackTimer = setInterval(() => {
      if (!socket.connected) {
        setVehicles(prevVehicles =>
          prevVehicles.map(v => {
            if (v.status === 'maintenance') return v;
            const deltaLat = (Math.random() - 0.48) * 0.0012;
            const deltaLng = (Math.random() - 0.48) * 0.0012;
            const speedDelta = Math.floor((Math.random() - 0.5) * 5);
            return {
              ...v,
              lat: v.lat + deltaLat,
              lng: v.lng + deltaLng,
              speed: Math.max(15, Math.min(85, v.speed + speedDelta)),
              fuel: Math.max(5, Number((v.fuel - 0.04).toFixed(1))),
              battery: Math.max(10, Number((v.battery - 0.02).toFixed(1)))
            };
          })
        );
      }
    }, 2500);

    return () => {
      socket.disconnect();
      clearInterval(fallbackTimer);
    };
  }, []);

  const filteredVehicles = vehicles.filter(v => {
    if (filter === 'active') return v.status === 'active' && !v.dtc;
    if (filter === 'maintenance') return v.status === 'maintenance' || !!v.dtc;
    return true;
  });

  return (
    <AppShell>
      <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
        
        {/* Header Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/80 dark:bg-slate-900/80 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 backdrop-blur-xl shadow-soft">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-cyan-500/10 text-cyan-500 rounded-xl">
                <Navigation className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  Live GPS Fleet Map
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    isConnected ? 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/30' : 'bg-amber-500/15 text-amber-500 border border-amber-500/30'
                  }`}>
                    <Radio className="w-3 h-3 animate-pulse" />
                    {isConnected ? 'Live Telemetry' : 'Simulating GPS'}
                  </span>
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Real-time location, speed, fuel, and engine diagnostics streaming via WebSockets
                </p>
              </div>
            </div>
          </div>

          {/* Quick Filter Buttons */}
          <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800/60 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700/60">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                filter === 'all' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              All ({vehicles.length})
            </button>
            <button
              onClick={() => setFilter('active')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                filter === 'active' ? 'bg-emerald-500 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Active ({vehicles.filter(v => v.status === 'active' && !v.dtc).length})
            </button>
            <button
              onClick={() => setFilter('maintenance')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                filter === 'maintenance' ? 'bg-amber-500 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Alerts / DTC ({vehicles.filter(v => v.status === 'maintenance' || !!v.dtc).length})
            </button>
          </div>
        </div>

        {/* Grid Layout: Map (Left) + Telemetry Details Panel (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Map Container */}
          <div className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-2 shadow-2xl relative overflow-hidden h-[600px] flex flex-col">
            <div className="absolute top-4 left-4 z-[1000] bg-white/90 dark:bg-slate-900/90 backdrop-blur border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2 shadow-lg">
              <MapPin className="w-3.5 h-3.5 text-cyan-500" />
              <span>Bengaluru Metropolitan Fleet Hub</span>
            </div>

            <MapContainer
              center={[12.9716, 77.5946]}
              zoom={12}
              scrollWheelZoom={true}
              style={{ width: '100%', height: '100%', borderRadius: '1rem' }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {filteredVehicles.map((vehicle) => (
                <Marker
                  key={vehicle.id}
                  position={[vehicle.lat, vehicle.lng]}
                  icon={createCustomIcon(vehicle.status, vehicle.dtc)}
                  eventHandlers={{
                    click: () => setSelectedVehicle(vehicle)
                  }}
                >
                  <Popup>
                    <div className="p-1 text-slate-900 font-sans">
                      <div className="font-bold text-sm text-cyan-600">{vehicle.name} ({vehicle.id})</div>
                      <div className="text-xs text-slate-600 mt-1">Speed: <span className="font-semibold">{vehicle.speed} km/h</span></div>
                      <div className="text-xs text-slate-600">Fuel: <span className="font-semibold">{vehicle.fuel}%</span> | EV Battery: <span className="font-semibold">{vehicle.battery}%</span></div>
                      {vehicle.dtc && (
                        <div className="mt-1 text-xs font-bold text-rose-600 flex items-center gap-1">
                          ⚠️ {vehicle.dtc}
                        </div>
                      )}
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>

          {/* Telemetry Detail Sidebar */}
          <div className="lg:col-span-4 space-y-4">
            
            {/* Selected Vehicle Telemetry Card */}
            {selectedVehicle ? (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xl relative overflow-hidden space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                  <div>
                    <span className="text-xs font-mono font-bold text-cyan-500 uppercase tracking-widest">{selectedVehicle.id}</span>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">{selectedVehicle.name}</h3>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${
                    selectedVehicle.dtc 
                      ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                      : selectedVehicle.status === 'maintenance'
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                      : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                  }`}>
                    {selectedVehicle.dtc ? <AlertTriangle className="w-3 h-3" /> : <ShieldCheck className="w-3 h-3" />}
                    {selectedVehicle.dtc ? 'DTC Alert' : selectedVehicle.status.toUpperCase()}
                  </span>
                </div>

                {/* Telemetry Gauges */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-3 flex flex-col justify-between">
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Gauge className="w-3.5 h-3.5 text-cyan-400" /> Current Speed
                    </span>
                    <div className="text-2xl font-extrabold text-white mt-1">
                      {selectedVehicle.speed} <span className="text-xs font-normal text-slate-400">km/h</span>
                    </div>
                  </div>

                  <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-3 flex flex-col justify-between">
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Zap className="w-3.5 h-3.5 text-amber-400" /> Battery / Fuel
                    </span>
                    <div className="text-2xl font-extrabold text-white mt-1">
                      {selectedVehicle.fuel}% <span className="text-xs font-normal text-slate-400">/ {selectedVehicle.battery}%</span>
                    </div>
                  </div>
                </div>

                {/* DTC Trouble Diagnostic Box */}
                {selectedVehicle.dtc ? (
                  <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-3.5 text-xs text-rose-300 space-y-1">
                    <div className="font-bold flex items-center gap-1.5 text-rose-400">
                      <AlertTriangle className="w-4 h-4" /> Active OBD-II Diagnostic Fault Code
                    </div>
                    <p className="font-mono text-slate-200">{selectedVehicle.dtc}</p>
                    <button 
                      onClick={() => toast.info(`Dispatched emergency service unit to ${selectedVehicle.name}`)}
                      className="mt-2 w-full py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-semibold rounded-lg transition-all"
                    >
                      Dispatch Emergency Roadside Assistance
                    </button>
                  </div>
                ) : (
                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 text-xs text-emerald-300 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span>All OBD-II powertrain and telemetry systems operating within nominal safety parameters.</span>
                  </div>
                )}

                {/* Coordinates & Timestamp */}
                <div className="text-[11px] font-mono text-slate-500 space-y-0.5 pt-2 border-t border-slate-800">
                  <div>LAT: {selectedVehicle.lat.toFixed(5)} | LNG: {selectedVehicle.lng.toFixed(5)}</div>
                  <div>TELEMETRY REFRESH: {new Date().toLocaleTimeString()}</div>
                </div>
              </div>
            ) : null}

            {/* Vehicle Telemetry List */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xl space-y-3 max-h-[300px] overflow-y-auto">
              <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center justify-between">
                <span>Fleet Telemetry Roster</span>
                <span className="text-brand-500 font-mono text-[10px]">{vehicles.length} Units</span>
              </h4>

              <div className="space-y-2">
                {vehicles.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => setSelectedVehicle(v)}
                    className={`w-full text-left p-2.5 rounded-xl border transition-all flex items-center justify-between ${
                      selectedVehicle?.id === v.id
                        ? 'bg-brand-50 dark:bg-brand-500/10 border-brand-300 dark:border-brand-500/40 text-brand-700 dark:text-brand-300 font-semibold'
                        : 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800/80 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Truck className={`w-4 h-4 ${v.dtc ? 'text-rose-400' : 'text-cyan-400'}`} />
                      <div>
                        <div className="text-xs font-bold text-white">{v.name}</div>
                        <div className="text-[11px] font-mono text-slate-400">{v.id} • {v.speed} km/h</div>
                      </div>
                    </div>
                    <span className={`w-2.5 h-2.5 rounded-full ${
                      v.dtc ? 'bg-rose-500 animate-ping' : v.status === 'maintenance' ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}></span>
                  </button>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </AppShell>
  );
}
