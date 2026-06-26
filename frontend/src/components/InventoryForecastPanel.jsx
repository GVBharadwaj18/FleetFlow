import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp, TrendingDown, Minus, ChevronDown, ChevronUp,
  ShoppingCart, Calendar, AlertTriangle, Brain, BarChart2,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import axios from "../utils/axiosInstance";

const TREND_META = {
  increasing: { icon: TrendingUp,   color: "text-danger-400",  badge: "badge-danger",   label: "Demand Rising ↑" },
  decreasing: { icon: TrendingDown, color: "text-success-400", badge: "badge-success",  label: "Demand Falling ↓" },
  stable:     { icon: Minus,        color: "text-brand-400",   badge: "badge-brand",    label: "Stable Demand"  },
};

function ConfidenceBar({ score }) {
  const pct = Math.round(score * 100);
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-surface-800 rounded-full overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${pct >= 70 ? "bg-success-500" : pct >= 40 ? "bg-warning-500" : "bg-danger-500"}`}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>
      <span className="text-xs text-surface-400 tabular-nums w-8">{pct}%</span>
    </div>
  );
}

export default function InventoryForecastPanel({ part }) {
  const [open,     setOpen]     = useState(false);
  const [forecast, setForecast] = useState(null);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState(null);

  const fetchForecast = async () => {
    if (forecast) { setOpen(o => !o); return; }
    setLoading(true);
    setError(null);
    setOpen(true);
    try {
      const { data } = await axios.post("/api/ai/inventory-forecast", { partId: part._id });
      setForecast(data);
    } catch {
      setError("AI service unavailable");
    } finally {
      setLoading(false);
    }
  };

  const trend = forecast ? (TREND_META[forecast.trend] || TREND_META.stable) : null;
  const TrendIcon = trend?.icon || Minus;

  // Build chart data: first 14 days of forecast
  const chartData = (forecast?.forecastPoints || []).slice(0, 14).map(p => ({
    date: p.date.slice(5),  // MM-DD
    qty:  parseFloat(p.predicted_qty.toFixed(2)),
  }));

  return (
    <div className="mt-2">
      <button
        onClick={fetchForecast}
        className="flex items-center gap-2 text-xs font-semibold text-brand-400 hover:text-brand-300 transition-colors"
      >
        <Brain className="w-3.5 h-3.5" />
        AI Demand Forecast
        {open ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="mt-3 p-4 rounded-xl bg-surface-900/80 border border-brand-500/20 space-y-4">
              {loading && (
                <div className="flex items-center gap-2 text-surface-400 text-sm py-2">
                  <Brain className="w-4 h-4 animate-pulse text-brand-400" />
                  Analysing demand patterns…
                </div>
              )}

              {error && (
                <div className="flex items-center gap-2 text-danger-400 text-sm">
                  <AlertTriangle className="w-4 h-4" /> {error}
                </div>
              )}

              {forecast && !loading && (
                <>
                  {/* Summary row */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="text-center p-2 rounded-lg bg-surface-800/60">
                      <p className="text-xs text-surface-500 mb-1">30-day demand</p>
                      <p className="text-xl font-display font-black text-white">{forecast.forecastedDemand30d}</p>
                      <p className="text-xs text-surface-500">units</p>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-surface-800/60">
                      <p className="text-xs text-surface-500 mb-1">Suggested order</p>
                      <p className="text-xl font-display font-black text-accent-400">{forecast.suggestedOrderQty}</p>
                      <p className="text-xs text-surface-500">units</p>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-surface-800/60">
                      <p className="text-xs text-surface-500 mb-1">Confidence</p>
                      <p className="text-xl font-display font-black text-success-400">{Math.round(forecast.confidenceScore * 100)}%</p>
                    </div>
                  </div>

                  {/* Trend + order date */}
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className={`badge ${trend?.badge} flex items-center gap-1.5`}>
                      <TrendIcon className="w-3 h-3" />
                      {trend?.label}
                    </span>
                    <span className="flex items-center gap-1.5 text-xs text-surface-400">
                      <Calendar className="w-3.5 h-3.5 text-brand-400" />
                      Order by: <span className="text-white font-semibold">{forecast.suggestedOrderDate}</span>
                    </span>
                    <span className="flex items-center gap-1.5 text-xs text-surface-400">
                      <ShoppingCart className="w-3.5 h-3.5 text-success-400" />
                      Current stock: <span className="text-white font-semibold">{part.quantity}</span>
                    </span>
                  </div>

                  <div>
                    <p className="text-xs text-surface-500 mb-1 flex items-center gap-1">
                      <BarChart2 className="w-3 h-3" /> Forecast confidence
                    </p>
                    <ConfidenceBar score={forecast.confidenceScore} />
                  </div>

                  {/* Mini forecast chart */}
                  {chartData.length > 0 && (
                    <div>
                      <p className="text-xs text-surface-500 mb-2 flex items-center gap-1">
                        <BarChart2 className="w-3 h-3" /> Daily demand (next 14 days)
                      </p>
                      <ResponsiveContainer width="100%" height={90}>
                        <BarChart data={chartData} margin={{ top: 0, right: 0, left: -30, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="2 2" vertical={false} stroke="rgba(255,255,255,0.05)" />
                          <XAxis dataKey="date" tick={{ fill: "#6060a0", fontSize: 9 }} axisLine={false} tickLine={false} interval={2} />
                          <YAxis tick={{ fill: "#6060a0", fontSize: 9 }} axisLine={false} tickLine={false} />
                          <Tooltip
                            contentStyle={{ background: "#0e0e24", border: "1px solid #303060", borderRadius: 10, fontSize: 11 }}
                            formatter={(v) => [v, "Predicted"]}
                          />
                          <Bar dataKey="qty" fill="url(#forecastGrad)" radius={[3, 3, 0, 0]} />
                          <defs>
                            <linearGradient id="forecastGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%"   stopColor="#6438ff" stopOpacity={0.9} />
                              <stop offset="100%" stopColor="#06d3d4" stopOpacity={0.5} />
                            </linearGradient>
                          </defs>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
