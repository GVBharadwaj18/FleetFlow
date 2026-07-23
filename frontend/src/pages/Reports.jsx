import React, { useEffect, useState } from "react";
import axios from "../utils/axiosInstance";
import { motion } from "framer-motion";
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import { TrendingUp, Wrench, Calendar as CalendarIcon, DollarSign, Activity, BarChart2 } from "lucide-react";

const CHART_COLORS = ['#2563eb', '#f97316', '#10b981', '#f59e0b', '#f43f5e'];

function MetricCard({ title, value, icon: Icon, color, unit = '' }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-panel p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div>
        <p className="text-2xl font-display font-black text-surface-900 dark:text-white">{unit}{value ?? '—'}</p>
        <p className="text-xs font-semibold text-surface-500 uppercase tracking-wider mt-0.5">{title}</p>
      </div>
    </motion.div>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl px-4 py-3 shadow-lg text-xs">
        <p className="text-surface-700 dark:text-surface-300 font-medium mb-1">{label}</p>
        {payload.map((p, i) => (
          <p key={i} className="font-bold" style={{ color: p.color }}>{p.name}: {p.value?.toLocaleString()}</p>
        ))}
      </div>
    );
  }
  return null;
};

export default function Reports() {
  const [revenueData, setRevenueData] = useState([]);
  const [partsData, setPartsData] = useState([]);
  const [maintenanceCount, setMaintenanceCount] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const fetchReports = async () => {
    setLoading(true);
    try {
      const [revRes, partsRes, maintRes] = await Promise.all([
        axios.get("/api/reports/revenue"),
        axios.get("/api/reports/parts"),
        axios.get(`/api/reports/maintenance?startDate=${startDate}&endDate=${endDate}`),
      ]);
      setRevenueData(revRes.data);
      setPartsData(partsRes.data);
      setMaintenanceCount(maintRes.data.count);
      setTotalRevenue(revRes.data.reduce((acc, d) => acc + (d.revenue || 0), 0));
    } catch (err) {
      console.error("Failed to load reports", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReports(); }, [startDate, endDate]);

  return (
    <div className="p-6 pb-12">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="glass-panel p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-success-500 to-accent-600 flex items-center justify-center shadow-glow-accent">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-display font-bold text-surface-900 dark:text-white">Analytics & Reports</h1>
                <p className="text-surface-500 text-sm mt-0.5">Business intelligence & operational overview</p>
              </div>
            </div>

            {/* Date Range */}
            <div className="flex items-center gap-3">
              <div className="flex flex-col gap-1">
                <label className="input-label text-[10px]">From</label>
                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="input-modern py-2 text-sm" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="input-label text-[10px]">To</label>
                <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="input-modern py-2 text-sm" />
              </div>
            </div>
          </div>
        </motion.div>

        {/* KPI Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <MetricCard title="Total Revenue"          value={loading ? '...' : `${totalRevenue.toLocaleString()}`} icon={DollarSign}   color="bg-success-100 text-success-600 dark:bg-success-500/15 dark:text-success-400" unit="$" />
          <MetricCard title="Maintenances in Range"   value={loading ? '...' : maintenanceCount}  icon={CalendarIcon} color="bg-brand-100 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400" />
          <MetricCard title="Parts Tracked"           value={loading ? '...' : partsData.length}  icon={Wrench}       color="bg-warning-100 text-warning-600 dark:bg-warning-500/15 dark:text-warning-400" />
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Revenue Area Chart */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="lg:col-span-2 glass-panel p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-success-500" />
                <h2 className="font-display font-semibold text-surface-900 dark:text-white">Monthly Revenue</h2>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-brand-500" />
                <span className="text-xs text-surface-500">Revenue</span>
              </div>
            </div>
            <div className="h-72">
              {loading ? (
                <div className="skeleton h-full rounded-xl" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="revGrad2" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(100,100,150,0.15)" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9090b8', fontSize: 11 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9090b8', fontSize: 11 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="revenue" name="Revenue ($)" stroke="#06b6d4" strokeWidth={2.5} fillOpacity={1} fill="url(#revGrad2)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </motion.div>

          {/* Most Used Parts Bar Chart */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-panel p-6">
            <div className="flex items-center gap-2 mb-6">
              <BarChart2 className="w-5 h-5 text-warning-500" />
              <h2 className="font-display font-semibold text-surface-900 dark:text-white text-sm">Most Used Parts</h2>
            </div>
            <div className="h-72">
              {loading ? (
                <div className="skeleton h-full rounded-xl" />
              ) : partsData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-surface-400 text-sm">
                  <div className="text-center">
                    <Wrench className="w-8 h-8 mx-auto mb-2 opacity-20" />
                    <p>No parts data yet</p>
                  </div>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart layout="vertical" data={partsData.slice(0, 7)} margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(100,100,150,0.15)" />
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#9090b8', fontSize: 11 }} width={90} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="count" name="Usage Count" radius={[0, 6, 6, 0]} barSize={18}>
                      {partsData.slice(0, 7).map((_, idx) => (
                        <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </motion.div>
        </div>

        {/* Revenue Table */}
        {!loading && revenueData.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-panel p-6">
            <div className="flex items-center gap-2 mb-5">
              <Activity className="w-5 h-5 text-brand-500" />
              <h2 className="font-display font-semibold text-surface-900 dark:text-white">Revenue Breakdown</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-surface-200 dark:border-surface-800">
                    {['Period', 'Revenue', 'Share'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-surface-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {revenueData.map((row, idx) => (
                    <tr key={idx} className="border-b border-surface-100 dark:border-surface-800/50 hover-surface transition-colors">
                      <td className="px-4 py-3 font-medium text-surface-800 dark:text-surface-200">{row.name}</td>
                      <td className="px-4 py-3 font-semibold text-success-600 dark:text-success-400">${(row.revenue || 0).toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-surface-100 dark:bg-surface-800 rounded-full overflow-hidden">
                            <div className="h-full bg-brand-500 rounded-full" style={{ width: `${totalRevenue ? (row.revenue / totalRevenue * 100).toFixed(0) : 0}%` }} />
                          </div>
                          <span className="text-xs text-surface-500 w-10">{totalRevenue ? (row.revenue / totalRevenue * 100).toFixed(1) : 0}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
