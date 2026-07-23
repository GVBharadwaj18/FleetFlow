import React, { useState, useEffect } from 'react';
import axiosInstance from '../../utils/axiosInstance';
import { motion } from 'framer-motion';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { AlertTriangle, Wrench, CheckCircle, MapPin, Activity, Zap } from 'lucide-react';
import toast from 'react-hot-toast';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

export default function AssistanceDashboard() {
    const [requests, setRequests] = useState([]);
    const [mechanics, setMechanics] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        try {
            const [reqRes, mechRes] = await Promise.all([
                axiosInstance.get('/api/roadside'),
                axiosInstance.get('/api/auth/users').catch(() => ({ data: [] })),
            ]);
            setRequests(reqRes.data);
            const allUsers = mechRes.data?.users || mechRes.data || [];
            setMechanics(allUsers.filter(u => u.role === 'mechanic' || u.role === 'admin'));
        } catch (err) {
            toast.error('Failed to load dashboard data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const assignMechanic = async (requestId, mechanicId) => {
        if (!mechanicId) return;
        try {
            await axiosInstance.patch(`/api/roadside/${requestId}/assign`, { mechanicId });
            toast.success('Mechanic dispatched!');
            fetchData();
        } catch (err) {
            toast.error('Failed to assign mechanic');
        }
    };

    if (loading) {
        return (
            <div className="p-6 space-y-6 max-w-7xl mx-auto">
                <div className="skeleton h-24 rounded-2xl" />
                <div className="grid grid-cols-3 gap-4">
                    {[...Array(3)].map((_, i) => <div key={i} className="skeleton h-28 rounded-2xl" />)}
                </div>
                <div className="skeleton h-96 rounded-2xl" />
            </div>
        );
    }

    const pending   = requests.filter(r => r.status === 'Pending' || r.status === 'Accepted');
    const active    = requests.filter(r => r.status === 'Mechanic Assigned' || r.status === 'On The Way');
    const completed = requests.filter(r => r.status === 'Completed');

    return (
        <div className="p-4 sm:p-6 pb-12">
            <div className="max-w-7xl mx-auto space-y-6">

                {/* Header */}
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="glass-panel p-6">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-500 to-accent-600 flex items-center justify-center shadow-glow-accent">
                            <MapPin className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-display font-bold text-surface-900 dark:text-white flex items-center gap-3">
                                Dispatch Command Center
                                <span className="flex items-center gap-1.5 px-2 py-1 bg-success-100 dark:bg-success-500/15 text-success-600 dark:text-success-400 text-xs font-bold rounded-full">
                                    <span className="w-1.5 h-1.5 bg-success-500 rounded-full" />Live
                                </span>
                            </h1>
                            <p className="text-surface-500 text-sm mt-0.5">Monitor emergencies and dispatch mechanics in real time.</p>
                        </div>
                    </div>
                </motion.div>

                {/* Stats Row */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[
                        { label: 'Pending Rescues',   value: pending.length,   icon: AlertTriangle, color: 'text-danger-500',  bg: 'bg-danger-50 dark:bg-danger-500/10'  },
                        { label: 'Active Dispatches', value: active.length,    icon: Wrench,        color: 'text-warning-500', bg: 'bg-warning-50 dark:bg-warning-500/10' },
                        { label: 'Completed Rescues', value: completed.length, icon: CheckCircle,   color: 'text-success-500', bg: 'bg-success-50 dark:bg-success-500/10' },
                    ].map((s, i) => (
                        <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="glass-card p-5">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-semibold text-surface-500 uppercase tracking-wider">{s.label}</p>
                                    <p className="text-3xl font-display font-black text-surface-900 dark:text-white mt-1">{s.value}</p>
                                </div>
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${s.bg}`}>
                                    <s.icon className={`w-6 h-6 ${s.color}`} />
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Map + Dispatch Panel */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Live Map */}
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="lg:col-span-2 glass-panel overflow-hidden" style={{ height: 560 }}>
                        <div className="flex items-center justify-between px-5 py-3.5 border-b border-surface-200/60 dark:border-surface-800/60">
                            <div className="flex items-center gap-2">
                                <Activity className="w-4 h-4 text-brand-500" />
                                <span className="font-semibold text-surface-900 dark:text-white text-sm">Live Map</span>
                            </div>
                            <span className="text-xs text-surface-400">{requests.filter(r => r.latitude && r.longitude).length} pins</span>
                        </div>
                        <MapContainer center={[12.9716, 77.5946]} zoom={12} style={{ height: 'calc(100% - 49px)', width: '100%' }}>
                            <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" attribution='© <a href="https://carto.com/">Carto</a>' />
                            {requests.filter(r => r.latitude && r.longitude && r.status !== 'Completed' && r.status !== 'Cancelled').map(req => (
                                <Marker key={req._id} position={[req.latitude, req.longitude]}>
                                    <Popup>
                                        <div className="p-2 min-w-[160px]">
                                            <h3 className="font-bold text-sm">{req.issueDescription}</h3>
                                            <p className="text-xs text-gray-500 mt-1">{req.customer?.username}</p>
                                            <p className="text-xs mt-1">{req.vehicle?.brand} {req.vehicle?.model} — {req.vehicle?.plateNumber}</p>
                                            <span className="inline-block mt-2 px-2 py-0.5 bg-orange-100 text-orange-700 text-xs font-bold rounded-lg">{req.status}</span>
                                        </div>
                                    </Popup>
                                </Marker>
                            ))}
                        </MapContainer>
                    </motion.div>

                    {/* Action Queue */}
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-panel p-5 flex flex-col" style={{ height: 560 }}>
                        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-surface-200/60 dark:border-surface-800/60">
                            <AlertTriangle className="w-4 h-4 text-danger-500" />
                            <h2 className="font-semibold text-surface-900 dark:text-white text-sm">Action Required</h2>
                            {pending.length > 0 && <span className="badge badge-danger">{pending.length}</span>}
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-3">
                            {pending.length === 0 ? (
                                <div className="text-center py-8 text-surface-400">
                                    <CheckCircle className="w-8 h-8 mx-auto mb-2 opacity-30 text-success-500" />
                                    <p className="text-sm">All clear! No pending rescues.</p>
                                </div>
                            ) : (
                                pending.map(req => (
                                    <div key={req._id} className="p-4 rounded-xl border border-danger-200 dark:border-danger-500/20 bg-danger-50/50 dark:bg-danger-500/5 space-y-3">
                                        <div className="flex items-start justify-between gap-2">
                                            <div>
                                                <p className="font-bold text-danger-700 dark:text-danger-400 text-sm">{req.issueDescription}</p>
                                                <p className="text-xs text-surface-500 mt-0.5">{req.customer?.username} · {req.vehicle?.plateNumber}</p>
                                            </div>
                                            <span className="text-xs text-surface-400 whitespace-nowrap">{new Date(req.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                        <div>
                                            <label className="input-label text-[10px] mb-1">Dispatch Mechanic</label>
                                            <select
                                                className="input-modern py-1.5 text-sm"
                                                onChange={e => assignMechanic(req._id, e.target.value)}
                                                defaultValue=""
                                            >
                                                <option value="" disabled>Select responder...</option>
                                                {mechanics.map(m => (
                                                    <option key={m._id} value={m._id}>{m.username} ({m.role})</option>
                                                ))}
                                                {mechanics.length === 0 && <option value="" disabled>No mechanics available</option>}
                                            </select>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </motion.div>
                </div>

            </div>
        </div>
    );
}
