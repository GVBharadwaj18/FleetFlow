import React, { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain, Car, AlertTriangle, CheckCircle, Clock, ChevronDown, ChevronUp,
  RefreshCw, Zap, Activity, TrendingUp, ShieldAlert, Shield, ShieldCheck,
} from "lucide-react";
import axios from "../utils/axiosInstance";

// ─── Risk colour maps ──────────────────────────────────────────────────────────
const RISK_META = {
  critical: {
    label: "Critical",
    bg: "bg-danger-500/15 dark:bg-danger-500/20",
    border: "border-danger-400/40",
    text: "text-danger-400",
    badge: "badge-danger",
    icon: ShieldAlert,
    glow: "shadow-[0_0_24px_rgba(244,63,94,0.35)]",
    bar: "bg-gradient-to-r from-danger-500 to-danger-400",
    score: (d) => Math.max(0, 100 - d * 14),
  },
  high: {
    label: "High Risk",
    bg: "bg-warning-500/10 dark:bg-warning-500/15",
    border: "border-warning-400/40",
    text: "text-warning-400",
    badge: "badge-warning",
    icon: ShieldAlert,
    glow: "shadow-[0_0_20px_rgba(245,158,11,0.25)]",
    bar: "bg-gradient-to-r from-warning-500 to-warning-400",
    score: (d) => Math.min(40, d),
  },
  medium: {
    label: "Medium Risk",
    bg: "bg-brand-500/10",
    border: "border-brand-400/30",
    text: "text-brand-400",
    badge: "badge-brand",
    icon: Shield,
    glow: "",
    bar: "bg-gradient-to-r from-brand-500 to-accent-500",
    score: (d) => Math.min(65, 40 + d / 2),
  },
  low: {
    label: "Low Risk",
    bg: "bg-success-500/8",
    border: "border-success-400/20",
    text: "text-success-400",
    badge: "badge-success",
    icon: Shield,
    glow: "",
    bar: "bg-gradient-to-r from-success-500 to-success-400",
    score: (d) => Math.min(85, 60 + d / 3),
  },
  healthy: {
    label: "Healthy",
    bg: "bg-success-500/10",
    border: "border-success-400/30",
    text: "text-success-400",
    badge: "badge-success",
    icon: ShieldCheck,
    glow: "",
    bar: "bg-gradient-to-r from-success-400 to-accent-400",
    score: () => 90,
  },
};

function getRisk(r) {
  return RISK_META[r] || RISK_META.healthy;
}

// ─── Subcomponents ─────────────────────────────────────────────────────────────

function HealthRing({ score }) {
  const r = 36, circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const color = score >= 80 ? "#10b981" : score >= 50 ? "#f59e0b" : "#f43f5e";
  return (
    <div className="relative w-20 h-20 flex items-center justify-center">
      <svg width="80" height="80" className="-rotate-90">
        <circle cx="40" cy="40" r={r} strokeWidth="6" fill="none" stroke="rgba(255,255,255,0.08)" />
        <circle
          cx="40" cy="40" r={r} strokeWidth="6" fill="none"
          stroke={color} strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(0.16,1,0.3,1)" }}
        />
      </svg>
      <span className="absolute text-lg font-display font-black text-white">{score}</span>
    </div>
  );
}

function PredictionBar({ days, riskLevel }) {
  const meta = getRisk(riskLevel);
  const pct = Math.min(100, Math.max(2, (days / 365) * 100));
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-1.5 bg-surface-800 rounded-full overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${meta.bar}`}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>
      <span className={`text-xs font-bold tabular-nums w-16 text-right ${meta.text}`}>
        {days}d
      </span>
    </div>
  );
}

function VehicleCard({ vehicle, onExpand, expanded }) {
  const [predData, setPredData] = useState(null);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState(null);

  const fetchPrediction = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await axios.post(`/api/ai/predict-maintenance/${vehicle._id}`);
      setPredData(data);
    } catch {
      setError("Failed to fetch prediction");
    } finally {
      setLoading(false);
    }
  }, [vehicle._id]);

  useEffect(() => {
    if (expanded && !predData) fetchPrediction();
  }, [expanded]);

  const risk = predData ? getRisk(predData.overallRisk) : null;
  const RiskIcon = risk?.icon || Shield;

  return (
    <motion.div
      layout
      className={`glass-panel overflow-hidden transition-all duration-300 ${risk ? `${risk.border} border` : "border border-surface-800/60"} ${risk?.glow || ""}`}
    >
      {/* Card Header */}
      <button
        className="w-full flex items-center gap-4 p-5 text-left hover:bg-white/5 transition-colors"
        onClick={onExpand}
      >
        <div className="w-10 h-10 rounded-xl bg-brand-500/15 flex items-center justify-center flex-shrink-0">
          <Car className="w-5 h-5 text-brand-400" />
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-display font-semibold text-white text-sm truncate">
            {vehicle.brand} {vehicle.model}
            <span className="ml-2 text-surface-500 font-normal text-xs">({vehicle.year})</span>
          </p>
          <p className="text-xs text-surface-500 mt-0.5">{vehicle.plateNumber}</p>
        </div>

        {predData && (
          <div className="flex items-center gap-3">
            <HealthRing score={predData.healthScore} />
            <span className={`badge ${risk?.badge}`}>
              <RiskIcon className="w-3 h-3" />
              {risk?.label}
            </span>
          </div>
        )}

        {!predData && !loading && (
          <span className="badge badge-neutral">Not analysed</span>
        )}
        {loading && (
          <div className="w-5 h-5 border-2 border-brand-500/40 border-t-brand-500 rounded-full animate-spin" />
        )}

        <div className="ml-2 text-surface-500">
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {/* Expanded Prediction Panel */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="border-t border-surface-800/60 px-5 py-4">
              {loading && (
                <div className="flex items-center gap-3 py-6 justify-center text-surface-400">
                  <Brain className="w-5 h-5 animate-pulse text-brand-400" />
                  <span className="text-sm">Analysing maintenance history…</span>
                </div>
              )}

              {error && (
                <div className="flex items-center gap-2 py-4 text-danger-400 text-sm">
                  <AlertTriangle className="w-4 h-4" />
                  {error}
                  <button onClick={fetchPrediction} className="ml-auto btn-ghost text-xs py-1">Retry</button>
                </div>
              )}

              {predData && !loading && (
                <>
                  {predData.predictions?.length === 0 ? (
                    <div className="text-surface-500 text-sm py-4 text-center">
                      <CheckCircle className="w-6 h-6 mx-auto mb-2 text-success-400" />
                      No upcoming maintenance predicted — vehicle appears healthy.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {predData.predictions.map((pred, i) => {
                        const pm = getRisk(pred.riskLevel);
                        return (
                          <motion.div
                            key={pred.partType}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.06 }}
                            className={`p-3 rounded-xl ${pm.bg} border ${pm.border}`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <Zap className={`w-3.5 h-3.5 ${pm.text}`} />
                                <span className="text-sm font-semibold text-white">{pred.partType}</span>
                              </div>
                              <span className={`badge ${pm.badge} text-xs`}>
                                {pred.daysUntilFailure === 0 ? "Overdue!" : `${pred.daysUntilFailure}d`}
                              </span>
                            </div>
                            <PredictionBar days={pred.daysUntilFailure} riskLevel={pred.riskLevel} />
                            <div className="flex items-center justify-between mt-2 text-xs text-surface-500">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                Due: {pred.expectedFailureDate}
                              </span>
                              <span>±{pred.confidenceDays}d confidence</span>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  )}

                  {!predData.available && (
                    <div className="mt-3 p-3 rounded-xl bg-surface-800/60 text-surface-400 text-xs flex items-center gap-2">
                      <AlertTriangle className="w-3.5 h-3.5 text-warning-400 flex-shrink-0" />
                      {predData.message}
                    </div>
                  )}

                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-surface-800/60">
                    <span className="text-xs text-surface-500 flex items-center gap-1.5">
                      <Activity className="w-3 h-3" />
                      Generated {new Date(predData.generatedAt).toLocaleTimeString()}
                    </span>
                    <button
                      onClick={() => { setPredData(null); fetchPrediction(); }}
                      className="btn-ghost text-xs py-1 px-2 gap-1"
                    >
                      <RefreshCw className="w-3 h-3" /> Refresh
                    </button>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function PredictiveMaintenance() {
  const [vehicles,    setVehicles]    = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [expandedId,  setExpandedId]  = useState(null);
  const [aiHealth,    setAiHealth]    = useState(null);
  const [filter,      setFilter]      = useState("all");

  useEffect(() => {
    Promise.all([
      axios.get("/api/vehicles"),
      axios.get("/api/ai/health"),
    ]).then(([vRes, hRes]) => {
      setVehicles(vRes.data || []);
      setAiHealth(hRes.data);
    }).catch(() => setVehicles([])).finally(() => setLoading(false));
  }, []);

  const toggle = (id) => setExpandedId(prev => prev === id ? null : id);

  const filteredVehicles = vehicles.filter(v => {
    if (filter === "all") return true;
    return true; // future: filter by risk level from cached predictions
  });

  return (
    <div className="min-h-screen pb-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">

        {/* ── Hero ── */}
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="relative glass-panel p-6 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-brand-600/15 via-transparent to-accent-500/10 pointer-events-none" />
          <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-brand-500/8 blur-3xl pointer-events-none" />
          <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Brain className="w-5 h-5 text-brand-400 animate-pulse" />
                <span className="text-xs font-semibold text-brand-400 uppercase tracking-wider">AI-Powered</span>
              </div>
              <h1 className="text-2xl font-display font-black text-white tracking-tight">
                Predictive Maintenance
              </h1>
              <p className="text-surface-400 text-sm mt-1">
                Time-series forecasting against historical service data to surface failure risks before they happen.
              </p>
            </div>

            {/* AI Service Status */}
            <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-semibold ${aiHealth?.available ? "bg-success-500/10 border-success-400/30 text-success-400" : "bg-danger-500/10 border-danger-400/30 text-danger-400"}`}>
              <span className={`w-2 h-2 rounded-full ${aiHealth?.available ? "bg-success-400 animate-ping-slow" : "bg-danger-400"}`} />
              AI Engine {aiHealth?.available ? "Online" : "Offline"}
              {aiHealth?.chunksIndexed > 0 && (
                <span className="text-xs text-surface-500 ml-1">• {aiHealth.chunksIndexed} manual chunks indexed</span>
              )}
            </div>
          </div>
        </motion.div>

        {/* ── Stats Row ── */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Fleet Vehicles", value: vehicles.length, icon: Car,         color: "text-brand-400 bg-brand-500/15" },
            { label: "AI Analyses",    value: 0,               icon: Brain,        color: "text-accent-400 bg-accent-500/15" },
            { label: "High Risk Items",value: 0,               icon: AlertTriangle,color: "text-danger-400 bg-danger-500/15" },
          ].map(({ label, value, icon: Icon, color }) => (
            <motion.div key={label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass-panel p-4 text-center">
              <div className={`w-9 h-9 rounded-xl ${color} flex items-center justify-center mx-auto mb-2`}>
                <Icon className="w-4 h-4" />
              </div>
              <p className="text-2xl font-display font-black text-white">{value}</p>
              <p className="text-xs text-surface-500 mt-0.5 uppercase tracking-wide font-semibold">{label}</p>
            </motion.div>
          ))}
        </div>

        {/* ── Vehicle List ── */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-semibold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-brand-400" />
              Fleet Analysis
              <span className="badge badge-neutral">{filteredVehicles.length}</span>
            </h2>
          </div>

          {loading && (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-20 rounded-2xl" />)}
            </div>
          )}

          {!loading && filteredVehicles.length === 0 && (
            <div className="glass-panel p-12 text-center text-surface-400">
              <Car className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No vehicles in the fleet yet.</p>
            </div>
          )}

          <AnimatePresence>
            {filteredVehicles.map(v => (
              <VehicleCard
                key={v._id}
                vehicle={v}
                expanded={expandedId === v._id}
                onExpand={() => toggle(v._id)}
              />
            ))}
          </AnimatePresence>
        </div>

      </div>
    </div>
  );
}
