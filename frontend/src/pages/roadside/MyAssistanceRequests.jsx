import React, { useState, useEffect } from 'react';
import axiosInstance from '../../utils/axiosInstance';
import { motion } from 'framer-motion';
import { AlertTriangle, Clock, MapPin, CheckCircle, Car } from 'lucide-react';
import toast from 'react-hot-toast';
import { Skeleton } from "../../ui/Skeleton";
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

export default function MyAssistanceRequests() {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRequests = async () => {
            try {
                const res = await axiosInstance.get('/api/roadside');
                setRequests(res.data);
            } catch (err) {
                toast.error('Failed to load your roadside requests');
            } finally {
                setLoading(false);
            }
        };
        fetchRequests();
    }, []);

    const getStatusColor = (status) => {
        switch (status) {
            case 'Pending': return 'bg-amber-100 text-amber-700';
            case 'Accepted': return 'bg-blue-100 text-blue-700';
            case 'Mechanic Assigned': return 'bg-indigo-100 text-indigo-700';
            case 'On The Way': return 'bg-purple-100 text-purple-700';
            case 'Completed': return 'bg-emerald-100 text-emerald-700';
            case 'Cancelled': return 'bg-rose-100 text-rose-700';
            default: return 'bg-slate-100 text-slate-700';
        }
    };

    if (loading) {
        return (
            <div className="p-6 pb-12 max-w-4xl mx-auto space-y-6">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-64 w-full" />
                <Skeleton className="h-64 w-full" />
            </div>
        );
    }

    const activeRequests = requests.filter(r => r.status !== 'Completed' && r.status !== 'Cancelled');
    const pastRequests = requests.filter(r => r.status === 'Completed' || r.status === 'Cancelled');

    return (
        <div className="p-4 sm:p-6 pb-12 bg-surface-50 dark:bg-surface-950 min-h-screen">
            <div className="max-w-6xl mx-auto space-y-8">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <h1 className="text-4xl font-black text-surface-900 dark:text-white flex items-center gap-3 tracking-tight">
                            <AlertTriangle className="w-10 h-10 text-rose-500" /> My Emergency Requests
                        </h1>
                        <p className="text-surface-500 mt-2 text-lg">Live tracking and history of your roadside assistance calls.</p>
                    </div>
                </div>

                {requests.length === 0 ? (
                    <div className="text-center py-20 glass-panel text-slate-500 shadow-soft rounded-[2rem] border-0">
                        <CheckCircle className="w-16 h-16 mx-auto mb-4 opacity-20 text-emerald-500" />
                        <p className="text-xl font-semibold">You have no emergency assistance requests.</p>
                    </div>
                ) : (
                    <div className="space-y-8">
                        {/* Active Requests with Live Map */}
                        {activeRequests.length > 0 && (
                            <div className="space-y-6">
                                <h2 className="text-2xl font-bold text-surface-900 dark:text-white flex items-center gap-2">
                                    <span className="w-3 h-3 rounded-full bg-rose-500 animate-ping absolute"></span>
                                    <span className="w-3 h-3 rounded-full bg-rose-500 relative"></span>
                                    Active Dispatches
                                </h2>
                                
                                {activeRequests.map((req, idx) => (
                                    <motion.div key={req._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-panel overflow-hidden shadow-soft rounded-[2rem] border-0">
                                        
                                        {/* Map Area */}
                                        <div className="h-64 sm:h-96 w-full bg-surface-200 relative">
                                            {req.latitude && req.longitude ? (
                                                <MapContainer center={[req.latitude, req.longitude]} zoom={13} style={{ height: '100%', width: '100%', zIndex: 10 }}>
                                                    <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" attribution='&copy; <a href="https://carto.com/">Carto</a>' />
                                                    
                                                    {/* Customer Location */}
                                                    <Marker position={[req.latitude, req.longitude]}>
                                                        <Popup><div className="font-bold text-rose-600">Your Location</div></Popup>
                                                    </Marker>
                                                    
                                                    {/* Simulated Mechanic Location if accepted */}
                                                    {(req.status === 'Mechanic Assigned' || req.status === 'On The Way') && (
                                                        <Marker position={[req.latitude + 0.015, req.longitude + 0.015]}>
                                                            <Popup><div className="font-bold text-indigo-600">Assigned Mechanic (Nearby Garage)</div></Popup>
                                                        </Marker>
                                                    )}
                                                </MapContainer>
                                            ) : (
                                                <div className="flex items-center justify-center h-full text-surface-500">
                                                    No GPS location provided for this request.
                                                </div>
                                            )}
                                            
                                            {/* Status Overlay */}
                                            <div className="absolute top-4 left-4 z-20">
                                                <span className={`px-4 py-2 rounded-xl text-sm font-bold shadow-md ${getStatusColor(req.status)}`}>
                                                    {req.status}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Details Area */}
                                        <div className="p-6">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                <div>
                                                    <h4 className="text-sm font-bold text-surface-400 mb-3 uppercase tracking-wider flex items-center gap-2">
                                                        <Car className="w-4 h-4"/> Vehicle Info
                                                    </h4>
                                                    <div className="bg-surface-50 dark:bg-surface-800/50 p-4 rounded-2xl border border-surface-100 dark:border-surface-700/50">
                                                        <p className="font-bold text-lg text-surface-900 dark:text-white">{req.vehicle?.brand} {req.vehicle?.model}</p>
                                                        <p className="text-surface-500 font-medium mt-1">Plate: <span className="bg-white dark:bg-surface-900 px-2 py-1 rounded shadow-sm border border-surface-200 dark:border-surface-700 text-black dark:text-white ml-2">{req.vehicle?.plateNumber}</span></p>
                                                    </div>
                                                </div>
                                                
                                                <div>
                                                    <h4 className="text-sm font-bold text-surface-400 mb-3 uppercase tracking-wider flex items-center gap-2">
                                                        <AlertTriangle className="w-4 h-4"/> Emergency Details
                                                    </h4>
                                                    <div className="bg-rose-50 dark:bg-rose-500/10 p-4 rounded-2xl border border-rose-100 dark:border-rose-500/20">
                                                        <p className="font-bold text-rose-700 dark:text-rose-400 text-lg">{req.issueDescription}</p>
                                                        {req.customDescription && <p className="text-rose-600/80 dark:text-rose-300 mt-2 font-medium italic">"{req.customDescription}"</p>}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="mt-6 pt-6 border-t border-surface-100 dark:border-surface-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-sm font-medium text-surface-500">
                                                <div className="flex items-center gap-2 bg-surface-100 dark:bg-surface-800 px-3 py-2 rounded-lg">
                                                    <MapPin className="w-4 h-4 text-primary-500"/> 
                                                    {req.address ? req.address : `Lat: ${req.latitude?.toFixed(4)}, Lng: ${req.longitude?.toFixed(4)}`}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Clock className="w-4 h-4"/> Requested at {new Date(req.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}

                        {/* Past Requests */}
                        {pastRequests.length > 0 && (
                            <div className="space-y-4 pt-6">
                                <h2 className="text-xl font-bold text-surface-900 dark:text-white flex items-center gap-2 mb-4">
                                    <Clock className="w-5 h-5 text-surface-400" /> Past Requests
                                </h2>
                                {pastRequests.map((req) => (
                                    <div key={req._id} className="glass-panel p-5 shadow-sm rounded-2xl border border-surface-200 dark:border-surface-800 flex flex-col md:flex-row md:items-center justify-between gap-4 opacity-80 hover:opacity-100 transition-opacity">
                                        <div>
                                            <div className="flex items-center gap-3 mb-2">
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(req.status)}`}>
                                                    {req.status}
                                                </span>
                                                <span className="font-bold text-surface-900 dark:text-white">{req.issueDescription}</span>
                                            </div>
                                            <p className="text-sm text-surface-500 font-medium">{req.vehicle?.brand} {req.vehicle?.model} • {new Date(req.createdAt).toLocaleDateString()}</p>
                                        </div>
                                        <div className="text-sm font-medium text-surface-400 flex items-center gap-2">
                                            <MapPin className="w-4 h-4"/> {req.address ? req.address : 'GPS Location'}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
