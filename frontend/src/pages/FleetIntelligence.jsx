import React, { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Map, Car, AlertTriangle, CheckCircle, Layers, Activity,
  ShieldAlert, ShieldCheck, Shield, Filter, RefreshCw, Info,
} from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import axios from "../utils/axiosInstance";

// Fix default Leaflet icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:       "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:     "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// ─── Custom coloured markers ──────────────────────────────────────────────────
function makeIcon(color, pulse = false) {
  return L.divIcon({
    className: "",
    html: `<div style="
      width:22px; height:22px; border-radius:50%;
      background:${color}; border:3px solid white;
      box-shadow:0 0 ${pulse ? "14px 4px" : "6px 2px"} ${color};
      ${pulse ? "animation:ping 2s cubic-bezier(0,0,0.2,1) infinite" : ""}
    "></div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
    popupAnchor: [0, -14],
  });
}

const STATUS_ICONS = {
  Pending:           makeIcon("#f59e0b", true),
  "Mechanic Assigned": makeIcon("#8b5cf6"),
  "On The Way":      makeIcon("#06b6d4", true),
  Completed:         makeIcon("#10b981"),
  Cancelled:         makeIcon("#f43f5e"),
};

const HEALTH_ICONS = {
  critical: makeIcon("#f43f5e", true),
  high:     makeIcon("#f59e0b", true),
  medium:   makeIcon("#8b5cf6"),
  low:      makeIcon("#06b6d4"),
  healthy:  makeIcon("#10b981"),
};

function getHealthIcon(risk) {
  return HEALTH_ICONS[risk] || HEALTH_ICONS.healthy;
}

// ─── Sidebar vehicle card ─────────────────────────────────────────────────────
function VehicleItem({ vehicle, prediction, onClick, active }) {
  const risk = prediction?.overallRisk || "healthy";
  const health = prediction?.healthScore ?? "—";
  const COLORS = {
    critical: "text-danger-400",
    high:     "text-warning-400",
    medium:   "text-brand-400",
    low:      "text-success-400",
    healthy:  "text-success-400",
  };
  return (
    <motion.button
      layout
      onClick={onClick}
      className={`w-full text-left p-3 rounded-xl transition-all duration-200 border ${
        active
          ? "bg-brand-500/20 border-brand-400/40 text-brand-700 dark:text-brand-300 font-semibold"
          : "bg-white/80 dark:bg-surface-900/50 border-surface-200 dark:border-surface-800/60 hover:bg-surface-100 dark:hover:bg-surface-800/60 text-surface-800 dark:text-surface-200"
      }`}
    >
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-brand-500/15 flex items-center justify-center flex-shrink-0">
          <Car className="w-4 h-4 text-brand-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white truncate">
            {vehicle.brand} {vehicle.model}
          </p>
          <p className="text-xs text-surface-500 truncate">{vehicle.plateNumber}</p>
        </div>
        <div className="text-right">
          <p className={`text-lg font-display font-black tabular-nums ${COLORS[risk]}`}>{health}</p>
          <p className="text-xs text-surface-500 capitalize">{risk}</p>
        </div>
      </div>
    </motion.button>
  );
}

// ─── Fleet summary header ─────────────────────────────────────────────────────
function FleetStats({ requests, vehicles }) {
  const active = requests.filter(r => r.status === "Mechanic Assigned" || r.status === "On The Way").length;
  const pending = requests.filter(r => r.status === "Pending").length;
  return (
    <div className="grid grid-cols-3 gap-3">
      {[
        { label: "Total Vehicles", value: vehicles.length,         icon: Car,            color: "text-brand-400  bg-brand-500/15"  },
        { label: "Active SOS",     value: active,                  icon: AlertTriangle,   color: "text-danger-400 bg-danger-500/15" },
        { label: "Pending",        value: pending,                 icon: Activity,        color: "text-warning-400 bg-warning-500/15"},
      ].map(({ label, value, icon: Icon, color }) => (
        <div key={label} className="glass-panel p-3 text-center">
          <div className={`w-8 h-8 rounded-lg ${color} flex items-center justify-center mx-auto mb-1.5`}>
            <Icon className="w-4 h-4" />
          </div>
          <p className="text-xl font-display font-black text-white">{value}</p>
          <p className="text-xs text-surface-500 font-semibold uppercase tracking-wide">{label}</p>
        </div>
      ))}
    </div>
  );
}

// ─── Fit map bounds to markers ────────────────────────────────────────────────
function MapBoundsController({ points }) {
  const map = useMap();
  useEffect(() => {
    if (points.length > 0) {
      const bounds = L.latLngBounds(points.map(p => [p.lat, p.lng]));
      map.fitBounds(bounds, { padding: [60, 60], maxZoom: 14 });
    }
  }, [points]);
  return null;
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function FleetIntelligence() {
  const [vehicles,    setVehicles]    = useState([]);
  const [requests,    setRequests]    = useState([]);
  const [predictions, setPredictions] = useState({});
  const [loading,     setLoading]     = useState(true);
  const [activeId,    setActiveId]    = useState(null);
  const [filter,      setFilter]      = useState("all"); // all | sos | healthy
  const [mapReady,    setMapReady]    = useState(false);
  const mapRef = useRef(null);

  useEffect(() => {
    Promise.all([
      axios.get("/api/vehicles"),
      axios.get("/api/roadside"),
      axios.get("/api/ai/fleet-health"),
    ])
      .then(([vRes, rRes, healthRes]) => {
        setVehicles(vRes.data || []);
        setRequests(rRes.data || []);
        // Map existing cached predictions by vehicleId
        const predMap = {};
        (healthRes.data?.predictions || []).forEach(p => { predMap[p.vehicleId] = p; });
        setPredictions(predMap);
        setMapReady(true);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const activeRequests = requests.filter(
    r => r.status !== "Completed" && r.status !== "Cancelled" && r.latitude && r.longitude
  );

  // Assign approximate geo coords to vehicles from SOS requests for demo
  const vehiclePoints = vehicles
    .filter(v => activeRequests.some(r => r.vehicleId === v._id || r.vehicle?._id === v._id))
    .map(v => {
      const sos = activeRequests.find(r => r.vehicleId === v._id || r.vehicle?._id === v._id);
      return { ...v, lat: sos?.latitude, lng: sos?.longitude };
    })
    .filter(v => v.lat && v.lng);

  const mapPoints = activeRequests.map(r => ({ lat: r.latitude, lng: r.longitude }));

  const activeVehicle = vehicles.find(v => v._id === activeId);

  return (
    <div className="min-h-screen pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-5">

        {/* ── Hero ── */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="glass-panel p-5 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-accent-500/10 via-transparent to-brand-600/10 pointer-events-none" />
          <div className="relative flex items-center justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Map className="w-4 h-4 text-accent-400" />
                <span className="text-xs font-bold text-accent-400 uppercase tracking-wider">Live Intelligence</span>
              </div>
              <h1 className="text-2xl font-display font-black text-white">Fleet Intelligence Map</h1>
              <p className="text-surface-400 text-sm mt-0.5">Real-time vehicle locations, SOS requests, and AI health scores.</p>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-success-500/10 border border-success-400/30">
              <span className="w-2 h-2 rounded-full bg-success-400 animate-ping-slow" />
              <span className="text-success-400 text-sm font-bold">Live</span>
            </div>
          </div>
        </motion.div>

        {/* ── Stats ── */}
        <FleetStats requests={requests} vehicles={vehicles} />

        {/* ── Main layout: Map + Sidebar ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5" style={{ minHeight: 520 }}>

          {/* Sidebar */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="lg:col-span-1 glass-panel flex flex-col gap-3 p-4 overflow-y-auto" style={{ maxHeight: 600 }}>
            <div className="flex items-center justify-between pb-1">
              <h2 className="font-display font-semibold text-white text-sm flex items-center gap-2">
                <Layers className="w-4 h-4 text-brand-400" /> Fleet Roster
              </h2>
              <span className="badge badge-neutral">{vehicles.length}</span>
            </div>

            {/* Filter tabs */}
            <div className="flex gap-1.5">
              {["all", "sos", "healthy"].map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg capitalize transition-colors ${
                    filter === f ? "bg-brand-500 text-white" : "bg-surface-800 text-surface-400 hover:text-white"
                  }`}
                >
                  {f === "all" ? "All" : f === "sos" ? "🆘 SOS" : "✅ Healthy"}
                </button>
              ))}
            </div>

            {loading && <div className="space-y-2">{[...Array(5)].map((_, i) => <div key={i} className="skeleton h-14 rounded-xl" />)}</div>}

            {!loading && vehicles.map(v => (
              <VehicleItem
                key={v._id}
                vehicle={v}
                prediction={predictions[v._id]}
                active={activeId === v._id}
                onClick={() => setActiveId(prev => prev === v._id ? null : v._id)}
              />
            ))}
          </motion.div>

          {/* Map */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="lg:col-span-2 glass-panel overflow-hidden" style={{ minHeight: 500 }}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-surface-800/60">
              <div className="flex items-center gap-3">
                <h2 className="font-display font-semibold text-white text-sm">Live Map</h2>
                <div className="flex items-center gap-2 text-xs text-surface-500">
                  {[
                    { color: "#f43f5e", label: "Critical" },
                    { color: "#f59e0b", label: "SOS" },
                    { color: "#10b981", label: "Healthy" },
                  ].map(l => (
                    <span key={l.label} className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-full inline-block border border-white/20" style={{ background: l.color }} />
                      {l.label}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {mapReady && (
              <MapContainer
                center={[12.9716, 77.5946]}
                zoom={11}
                style={{ height: "calc(100% - 53px)", width: "100%" }}
                ref={mapRef}
              >
                <TileLayer
                  url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                  attribution='© <a href="https://carto.com/">CARTO</a>'
                />
                {mapPoints.length > 0 && <MapBoundsController points={mapPoints} />}

                {activeRequests.map(req => (
                  <Marker
                    key={req._id}
                    position={[req.latitude, req.longitude]}
                    icon={STATUS_ICONS[req.status] || STATUS_ICONS.Pending}
                  >
                    <Popup>
                      <div className="p-2 min-w-[180px]">
                        <h3 className="font-bold text-surface-800 text-sm">{req.issueDescription}</h3>
                        <p className="text-xs text-surface-500 mt-1">{req.customer?.username}</p>
                        <span className="inline-block mt-2 px-2 py-1 text-xs font-bold rounded-lg"
                          style={{ background: req.status === "Pending" ? "#fef3c7" : "#d1fae5", color: "#064e3b" }}
                        >
                          {req.status}
                        </span>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            )}
          </motion.div>
        </div>

        {/* ── Legend ── */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-panel p-4 flex flex-wrap gap-4 items-center">
          <Info className="w-4 h-4 text-surface-500 flex-shrink-0" />
          <span className="text-xs text-surface-500">
            Markers show live SOS requests from the fleet. AI health scores (0–100) are shown in the sidebar once predictions are generated from the Predictive Maintenance page.
          </span>
        </motion.div>

      </div>
    </div>
  );
}
