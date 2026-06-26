import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../utils/axiosInstance";
import { useAuth } from "../context/useAuth";
import { motion, AnimatePresence, useInView, useMotionValue, useSpring } from "framer-motion";
import {
  Car, Wrench, FileText, Calendar, AlertTriangle, TrendingUp,
  MapPin, ArrowRight, Activity, Zap, CheckCircle, Clock, ChevronRight,
  MoreHorizontal, Layers, Shield, XCircle, Brain, ShieldAlert, ShieldCheck
} from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix leaflet default icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const revenueData = [
  { name: 'Jan', revenue: 4200, jobs: 28 },
  { name: 'Feb', revenue: 3800, jobs: 22 },
  { name: 'Mar', revenue: 5600, jobs: 35 },
  { name: 'Apr', revenue: 4900, jobs: 30 },
  { name: 'May', revenue: 7200, jobs: 48 },
  { name: 'Jun', revenue: 8100, jobs: 56 },
];

const STATUS_COLORS = {
  Pending:          { dot: 'bg-warning-500', badge: 'badge-warning' },
  Confirmed:        { dot: 'bg-brand-500',   badge: 'badge-brand'   },
  Completed:        { dot: 'bg-success-500', badge: 'badge-success' },
  Cancelled:        { dot: 'bg-danger-500',  badge: 'badge-danger'  },
  'Mechanic Assigned': { dot: 'bg-accent-500', badge: 'badge-accent' },
  'On The Way':     { dot: 'bg-accent-500',  badge: 'badge-accent'  },
};

/* Animated count-up hook */
function useCountUp(target, duration = 1200) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [inView, target, duration]);

  return [count, ref];
}

function KPICard({ title, value, icon: Icon, color, trend, unit = '' }) {
  const [count, ref] = useCountUp(value);
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-panel p-5 flex flex-col gap-4 hover:shadow-medium hover:-translate-y-1 transition-all duration-300 cursor-default group"
    >
      <div className="flex items-center justify-between">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${color} flex-shrink-0`}>
          <Icon className="w-5 h-5" />
        </div>
        {trend !== undefined && (
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${trend >= 0 ? 'text-success-600 bg-success-100 dark:text-success-400 dark:bg-success-500/15' : 'text-danger-600 bg-danger-100 dark:text-danger-400 dark:bg-danger-500/15'}`}>
            {trend >= 0 ? '+' : ''}{trend}%
          </span>
        )}
      </div>
      <div>
        <p className="text-3xl font-display font-black text-surface-900 dark:text-white tabular-nums">
          {unit}{count}
        </p>
        <p className="text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider mt-1">{title}</p>
      </div>
    </motion.div>
  );
}

function AppointmentCard({ appt, isAdmin, onStatusUpdate }) {
  const statusStyle = STATUS_COLORS[appt.status] || { dot: 'bg-surface-400', badge: 'badge-neutral' };
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-5 flex flex-col gap-3"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-brand-50 dark:bg-brand-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
            <Calendar className="w-4 h-4 text-brand-600 dark:text-brand-400" />
          </div>
          <div>
            <h3 className="font-semibold text-surface-900 dark:text-surface-100 text-sm">{appt.serviceType}</h3>
            <p className="text-xs text-surface-500 mt-0.5">{appt.vehicleMake} {appt.vehicleModel} {appt.vehicleYear && `(${appt.vehicleYear})`}</p>
          </div>
        </div>
        <span className={statusStyle.badge}>
          <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot}`} />
          {appt.status}
        </span>
      </div>

      <div className="flex items-center gap-4 text-xs text-surface-500 bg-surface-50 dark:bg-surface-800/50 px-3 py-2 rounded-lg">
        <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" />{new Date(appt.appointmentDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
        <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" />{appt.timeSlot}</span>
      </div>

      {isAdmin && (
        <div className="flex items-center gap-2 pt-1">
          {appt.status === 'Pending' && (
            <>
              <button onClick={() => onStatusUpdate(appt._id, 'Confirmed')} className="flex-1 px-3 py-1.5 bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400 text-xs font-semibold rounded-lg hover:bg-brand-100 dark:hover:bg-brand-500/20 transition-colors flex items-center justify-center gap-1">
                <CheckCircle className="w-3.5 h-3.5" /> Approve
              </button>
              <button onClick={() => onStatusUpdate(appt._id, 'Cancelled')} className="flex-1 px-3 py-1.5 bg-danger-50 text-danger-600 dark:bg-danger-500/10 dark:text-danger-400 text-xs font-semibold rounded-lg hover:bg-danger-100 dark:hover:bg-danger-500/20 transition-colors flex items-center justify-center gap-1">
                <XCircle className="w-3.5 h-3.5" /> Decline
              </button>
            </>
          )}
          {appt.status === 'Confirmed' && (
            <button onClick={() => onStatusUpdate(appt._id, 'Completed')} className="flex-1 px-3 py-1.5 bg-success-50 text-success-700 dark:bg-success-500/10 dark:text-success-400 text-xs font-semibold rounded-lg hover:bg-success-100 transition-colors flex items-center justify-center gap-1">
              <CheckCircle className="w-3.5 h-3.5" /> Mark Completed
            </button>
          )}
        </div>
      )}
    </motion.div>
  );
}

// ── AI Insight Panel (admin) ──────────────────────────────────────────────────
const RISK_COLORS = {
  critical: { text: 'text-danger-400',  bg: 'bg-danger-500/15',  badge: 'badge-danger'  },
  high:     { text: 'text-warning-400', bg: 'bg-warning-500/15', badge: 'badge-warning' },
  medium:   { text: 'text-brand-400',   bg: 'bg-brand-500/15',  badge: 'badge-brand'   },
  low:      { text: 'text-success-400', bg: 'bg-success-500/10',badge: 'badge-success' },
  healthy:  { text: 'text-success-400', bg: 'bg-success-500/10',badge: 'badge-success' },
};

function AIInsightCard({ vehicleId, vehicleName, plate }) {
  const navigate = useNavigate();
  const [pred, setPred] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    axios.post(`/api/ai/predict-maintenance/${vehicleId}`)
      .then(r => setPred(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [vehicleId]);

  const riskMeta = pred ? (RISK_COLORS[pred.overallRisk] || RISK_COLORS.healthy) : null;
  const topPred  = pred?.predictions?.[0];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className={`glass-card p-4 flex flex-col gap-2 min-w-[220px] cursor-pointer`}
      onClick={() => navigate('/predictive-maintenance')}
    >
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-brand-500/15 flex items-center justify-center flex-shrink-0">
          <Car className="w-4 h-4 text-brand-400" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-surface-900 dark:text-white truncate">{vehicleName}</p>
          <p className="text-xs text-surface-500">{plate}</p>
        </div>
      </div>

      {loading && <div className="skeleton h-8 rounded-lg" />}

      {!loading && pred && (
        <>
          <div className="flex items-center justify-between">
            <span className={`badge ${riskMeta?.badge}`}>{pred.overallRisk}</span>
            <span className={`text-2xl font-display font-black tabular-nums ${riskMeta?.text}`}>{pred.healthScore}</span>
          </div>
          {topPred && (
            <p className="text-xs text-surface-500 flex items-center gap-1">
              <Zap className={`w-3 h-3 ${riskMeta?.text}`} />
              {topPred.partType}: {topPred.daysUntilFailure}d
            </p>
          )}
        </>
      )}

      {!loading && (!pred || !pred.available) && (
        <p className="text-xs text-surface-400">No data yet</p>
      )}
    </motion.div>
  );
}

function AIInsightPanel({ vehicles }) {
  const navigate = useNavigate();
  if (!vehicles?.length) return null;
  const sample = vehicles.slice(0, 5);
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-panel p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-brand-400 animate-pulse" />
          <h2 className="font-display font-semibold text-surface-900 dark:text-white">AI Fleet Insights</h2>
          <span className="badge badge-brand text-xs">Predictive</span>
        </div>
        <button onClick={() => navigate('/predictive-maintenance')} className="btn-ghost text-xs py-1.5 px-3 gap-1">
          Full Analysis <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2 -mb-2">
        {sample.map(v => (
          <AIInsightCard
            key={v._id}
            vehicleId={v._id}
            vehicleName={`${v.brand} ${v.model}`}
            plate={v.plateNumber}
          />
        ))}
      </div>
    </motion.div>
  );
}

const DashboardSkeleton = () => (
  <div className="p-6 space-y-6 max-w-7xl mx-auto">
    <div className="skeleton h-24 w-full rounded-2xl" />
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-28 rounded-2xl" />)}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="skeleton h-72 rounded-2xl lg:col-span-2" />
      <div className="skeleton h-72 rounded-2xl" />
    </div>
  </div>
);

export default function Dashboard() {
  const { auth } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ vehicles: 0, maintenances: 0, invoices: 0 });
  const [loading, setLoading] = useState(true);
  const [vehiclesList, setVehiclesList] = useState([]);
  const [recentMaint, setRecentMaint] = useState([]);
  const [lowStockParts, setLowStockParts] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [roadsideRequests, setRoadsideRequests] = useState([]);
  const [roadside, setRoadside] = useState({ pending: 0, active: 0 });
  const [now, setNow] = useState(new Date());

  const isAdmin = auth?.user?.role === 'admin' || auth?.user?.role === 'mechanic';

  useEffect(() => {
    const tick = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(tick);
  }, []);

  const handleStatusUpdate = async (id, newStatus) => {
    try {
      await axios.put(`/api/appointments/${id}/status`, { status: newStatus });
      setAppointments(prev => prev.map(a => a._id === id ? { ...a, status: newStatus } : a));
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    const fetchGlobal = async () => {
      try {
        const [vRes, mRes, bRes, partRes, apptRes, roadsideRes] = await Promise.all([
          axios.get("/api/vehicles"),
          axios.get("/api/maintenance"),
          axios.get("/api/bills"),
          isAdmin ? axios.get("/api/parts/low-stock?threshold=5") : Promise.resolve({ data: [] }),
          axios.get("/api/appointments"),
          axios.get("/api/roadside"),
        ]);
        setStats({ vehicles: vRes.data?.length || 0, maintenances: mRes.data?.length || 0, invoices: bRes.data?.length || 0 });
        setVehiclesList(vRes.data || []);
        if (isAdmin) setLowStockParts(partRes.data || []);
        setAppointments(apptRes.data || []);
        const rsData = roadsideRes.data || [];
        setRoadsideRequests(rsData);
        setRoadside({ pending: rsData.filter(r => r.status === 'Pending').length, active: rsData.filter(r => r.status === 'Mechanic Assigned' || r.status === 'On The Way').length });
      } catch (err) { console.error(err); } finally { setLoading(false); }
    };
    const fetchUser = async () => {
      try {
        const [apptRes, roadsideRes] = await Promise.all([axios.get("/api/appointments"), axios.get("/api/roadside")]);
        setAppointments(apptRes.data || []);
        const rsData = roadsideRes.data || [];
        setRoadside({ active: rsData.filter(r => r.status !== 'Completed' && r.status !== 'Cancelled').length });
      } catch (err) { console.error(err); } finally { setLoading(false); }
    };
    isAdmin ? fetchGlobal() : fetchUser();
  }, [isAdmin]);

  if (loading) return <DashboardSkeleton />;

  const greeting = now.getHours() < 12 ? 'Good morning' : now.getHours() < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="pb-12 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">

        {/* ── Hero Header ──────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative glass-panel p-6 overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-brand-600/10 via-transparent to-accent-500/10 pointer-events-none" />
          <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none" />

          <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <p className="text-sm font-medium text-brand-500 dark:text-brand-400 mb-1 flex items-center gap-2">
                <Activity className="w-4 h-4" />
                {greeting}
              </p>
              <h1 className="text-3xl font-display font-black text-surface-900 dark:text-white tracking-tight">
                {auth?.user?.username}
                <span className="text-surface-400 dark:text-surface-500 font-light"> / </span>
                <span className="text-gradient-brand">Dashboard</span>
              </h1>
              <p className="text-surface-500 dark:text-surface-400 text-sm mt-1">
                {now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button onClick={() => navigate("/vehicles")} className="btn-secondary">
                <Car className="w-4 h-4" /> My Vehicles
              </button>
              <button onClick={() => navigate("/booking")} className="btn-primary">
                <Calendar className="w-4 h-4" /> Book Service
              </button>
              {isAdmin ? (
                <button onClick={() => navigate("/dispatch")} className="btn-accent">
                  <MapPin className="w-4 h-4" /> Live Dispatch
                </button>
              ) : (
                <button onClick={() => navigate("/request-assistance")} className="btn-danger">
                  <AlertTriangle className="w-4 h-4" /> Emergency SOS
                </button>
              )}
            </div>
          </div>
        </motion.div>

        {/* ── Admin View ───────────────────────────────────── */}
        {isAdmin && (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <KPICard title="Total Vehicles"     value={stats.vehicles}    icon={Car}           color="bg-brand-100 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400"   trend={12} />
              <KPICard title="Maintenance Logs"   value={stats.maintenances} icon={Wrench}        color="bg-warning-100 text-warning-600 dark:bg-warning-500/15 dark:text-warning-400" trend={8} />
              <KPICard title="Total Invoices"     value={stats.invoices}    icon={FileText}      color="bg-success-100 text-success-600 dark:bg-success-500/15 dark:text-success-400" trend={-3} />
              <KPICard title="Active SOS Requests" value={roadside.active || 0} icon={AlertTriangle} color="bg-danger-100 text-danger-600 dark:bg-danger-500/15 dark:text-danger-400" />
            </div>

            {/* ── AI Insight Panel ── */}
            <AIInsightPanel vehicles={vehiclesList} />

            {/* Map + Chart Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Live Map */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="lg:col-span-2 glass-panel overflow-hidden"
                style={{ height: 400 }}
              >
                <div className="flex items-center justify-between px-5 py-4 border-b border-surface-200/60 dark:border-surface-800/60">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-brand-500" />
                    <h2 className="font-display font-semibold text-surface-900 dark:text-white">Live Fleet Map</h2>
                    <span className="flex items-center gap-1 px-2 py-0.5 bg-success-100 dark:bg-success-500/15 text-success-600 dark:text-success-400 text-xs font-bold rounded-full">
                      <span className="w-1.5 h-1.5 bg-success-500 rounded-full animate-ping-slow" />
                      Live
                    </span>
                  </div>
                  <button onClick={() => navigate('/dispatch')} className="btn-ghost text-xs py-1.5 px-3 gap-1">
                    Full Screen <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
                <MapContainer center={[40.7128, -74.006]} zoom={11} style={{ height: 'calc(100% - 57px)', width: '100%' }}>
                  <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" attribution='© <a href="https://carto.com/">Carto</a>' />
                  {roadsideRequests.filter(r => r.latitude && r.longitude && r.status !== 'Completed' && r.status !== 'Cancelled').map(req => (
                    <Marker key={req._id} position={[req.latitude, req.longitude]}>
                      <Popup>
                        <div className="p-2 min-w-[160px]">
                          <h3 className="font-bold text-surface-800 text-sm">{req.issueDescription}</h3>
                          <p className="text-xs text-surface-500 mt-1">{req.customer?.username}</p>
                          <span className="inline-block mt-2 px-2 py-1 bg-warning-100 text-warning-700 text-xs font-bold rounded-lg">{req.status}</span>
                        </div>
                      </Popup>
                    </Marker>
                  ))}
                </MapContainer>
              </motion.div>

              {/* Revenue Chart */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="glass-panel p-5 flex flex-col"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-success-500" />
                    <h2 className="font-display font-semibold text-surface-900 dark:text-white text-sm">Revenue</h2>
                  </div>
                  <span className="badge badge-success">+21% MoM</span>
                </div>
                <div className="flex-1" style={{ minHeight: 0 }}>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={revenueData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                      <defs>
                        <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6438ff" stopOpacity={0.35} />
                          <stop offset="95%" stopColor="#6438ff" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(100,100,150,0.15)" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9090b8', fontSize: 11 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9090b8', fontSize: 11 }} />
                      <Tooltip
                        contentStyle={{ background: '#0e0e24', border: '1px solid #303060', borderRadius: 12, color: '#f0f0f8', fontSize: 12 }}
                        formatter={(v) => [`$${v.toLocaleString()}`, 'Revenue']}
                      />
                      <Area type="monotone" dataKey="revenue" stroke="#6438ff" strokeWidth={2.5} fillOpacity={1} fill="url(#revGrad)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>
            </div>

            {/* Low Stock Alert */}
            {lowStockParts.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-panel p-5">
                <div className="flex items-center gap-2 mb-4">
                  <AlertTriangle className="w-5 h-5 text-warning-500" />
                  <h2 className="font-display font-semibold text-surface-900 dark:text-white">Low Stock Alerts</h2>
                  <span className="badge badge-warning">{lowStockParts.length} items</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {lowStockParts.map(part => (
                    <div key={part._id} className="flex items-center justify-between px-4 py-3 bg-warning-50 dark:bg-warning-500/10 rounded-xl border border-warning-200 dark:border-warning-500/20">
                      <div className="flex items-center gap-2">
                        <Layers className="w-4 h-4 text-warning-500" />
                        <span className="font-medium text-surface-800 dark:text-surface-200 text-sm">{part.name}</span>
                      </div>
                      <span className="badge badge-warning">{part.quantity} left</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </>
        )}

        {/* ── User / Non-Admin Quick Stats ─────────────────── */}
        {!isAdmin && (
          <div className="grid grid-cols-2 gap-4">
            <KPICard title="My Appointments" value={appointments.length} icon={Calendar} color="bg-brand-100 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400" />
            <KPICard title="Active SOS Requests" value={roadside.active || 0} icon={AlertTriangle} color="bg-danger-100 text-danger-600 dark:bg-danger-500/15 dark:text-danger-400" />
          </div>
        )}

        {/* ── Appointments Section ──────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="glass-panel p-5">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-brand-500" />
              <h2 className="font-display font-semibold text-surface-900 dark:text-white">
                {isAdmin ? 'System Appointments' : 'My Appointments'}
              </h2>
              {appointments.length > 0 && (
                <span className="badge badge-brand">{appointments.length}</span>
              )}
            </div>
            <button onClick={() => navigate('/booking')} className="btn-ghost text-xs py-1.5 px-3 gap-1">
              Book New <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {appointments.length === 0 ? (
            <div className="text-center py-12 text-surface-400">
              <Calendar className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm font-medium">No appointments scheduled</p>
              <button onClick={() => navigate('/booking')} className="btn-primary mt-4 text-sm">
                Book Your First Service
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {appointments.slice(0, 6).map(appt => (
                <AppointmentCard
                  key={appt._id}
                  appt={appt}
                  isAdmin={isAdmin}
                  onStatusUpdate={handleStatusUpdate}
                />
              ))}
            </div>
          )}
        </motion.div>

      </div>
    </div>
  );
}
