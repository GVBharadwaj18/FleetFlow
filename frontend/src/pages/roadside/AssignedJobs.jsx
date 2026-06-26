import React, { useState, useEffect } from 'react';
import axiosInstance from '../../utils/axiosInstance';
import { motion } from 'framer-motion';
import { Wrench, MapPin, Phone, Car, CheckCircle, Navigation, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AssignedJobs() {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    // Assuming we store the logged in user's ID in localStorage or context. 
    // The backend will filter or we filter here. For now we fetch all and let backend handle it, or filter by user.
    // Our backend roadsideController currently sends all requests to mechanics. We filter here.
    const currentUser = JSON.parse(localStorage.getItem('user'));

    useEffect(() => {
        const fetchJobs = async () => {
            try {
                const res = await axiosInstance.get('/api/roadside');
                // Filter jobs assigned to this specific mechanic that are not completed/cancelled
                const myJobs = res.data.filter(j => 
                    j.assignedMechanic?._id === currentUser?.id && 
                    !['Completed', 'Cancelled'].includes(j.status)
                );
                setJobs(myJobs);
            } catch (err) {
                toast.error('Failed to load assigned jobs');
            } finally {
                setLoading(false);
            }
        };
        fetchJobs();
    }, [currentUser?.id]);

    const updateStatus = async (jobId, newStatus) => {
        try {
            await axiosInstance.patch(`/api/roadside/${jobId}/status`, { status: newStatus });
            toast.success(`Job marked as ${newStatus}`);
            setJobs(prev => prev.filter(j => j._id !== jobId || newStatus !== 'Completed'));
            if (newStatus !== 'Completed') {
                const res = await axiosInstance.get('/api/roadside');
                const myJobs = res.data.filter(j => 
                    j.assignedMechanic?._id === currentUser?.id && 
                    !['Completed', 'Cancelled'].includes(j.status)
                );
                setJobs(myJobs);
            }
        } catch (err) {
            toast.error('Failed to update job status');
        }
    };

    if (loading) return <div className="p-10 text-center text-slate-500">Loading your jobs...</div>;

    return (
        <div className="p-6 pb-12">
            <div className="max-w-4xl mx-auto space-y-6">
                <div className="glass-panel p-6">
                    <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
                        <Wrench className="w-8 h-8 text-amber-500" /> Active Dispatches
                    </h1>
                    <p className="text-slate-500 mt-1">Manage your active emergency response jobs.</p>
                </div>

                {jobs.length === 0 ? (
                    <div className="text-center py-16 glass-panel text-slate-500">
                        <CheckCircle className="w-12 h-12 mx-auto mb-4 opacity-20 text-emerald-500" />
                        You have no active rescue missions assigned.
                    </div>
                ) : (
                    <div className="grid gap-6">
                        {jobs.map((job, idx) => (
                            <motion.div key={job._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }} className="glass-card p-6 border-l-4 border-amber-500">
                                <div className="flex flex-col md:flex-row justify-between md:items-start gap-4 mb-4">
                                    <div>
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-xs font-bold uppercase">{job.status}</span>
                                            <span className="text-xs text-slate-400">{new Date(job.createdAt).toLocaleTimeString()}</span>
                                        </div>
                                        <h3 className="text-xl font-bold text-rose-600 flex items-center gap-2">
                                            <AlertTriangle className="w-5 h-5"/> {job.issueDescription}
                                        </h3>
                                        {job.customDescription && <p className="text-sm text-slate-600 italic mt-1">"{job.customDescription}"</p>}
                                    </div>

                                    <div className="flex flex-col gap-2 w-full md:w-auto">
                                        {job.status === 'Mechanic Assigned' && (
                                            <button onClick={() => updateStatus(job._id, 'On The Way')} className="btn-primary w-full md:w-auto flex justify-center items-center gap-2 bg-indigo-600 hover:bg-indigo-700">
                                                <Navigation className="w-4 h-4"/> Start Route
                                            </button>
                                        )}
                                        {job.status === 'On The Way' && (
                                            <button onClick={() => updateStatus(job._id, 'Completed')} className="btn-primary w-full md:w-auto flex justify-center items-center gap-2 bg-emerald-600 hover:bg-emerald-700">
                                                <CheckCircle className="w-4 h-4"/> Mark Resolved
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                                    <div className="bg-slate-50 dark:bg-surface-800 p-4 rounded-xl border border-slate-100">
                                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Customer Info</h4>
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center shrink-0">
                                                <Phone className="w-5 h-5 text-slate-500" />
                                            </div>
                                            <div>
                                                <p className="font-semibold text-slate-800">{job.customer?.username}</p>
                                                <p className="text-sm text-slate-500">{job.customer?.email}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="bg-slate-50 dark:bg-surface-800 p-4 rounded-xl border border-slate-100">
                                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Vehicle Profile</h4>
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center shrink-0">
                                                <Car className="w-5 h-5 text-slate-500" />
                                            </div>
                                            <div>
                                                <p className="font-semibold text-slate-800">{job.vehicle?.brand} {job.vehicle?.model}</p>
                                                <p className="text-sm font-mono text-slate-500">{job.vehicle?.plateNumber}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-4 bg-indigo-50 p-4 rounded-xl border border-indigo-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div className="flex items-start gap-2">
                                        <MapPin className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
                                        <div>
                                            <p className="font-semibold text-indigo-900 text-sm">Emergency Location</p>
                                            <p className="text-indigo-700 text-sm">{job.address || `${job.latitude}, ${job.longitude}`}</p>
                                        </div>
                                    </div>
                                    <a 
                                        href={`https://www.google.com/maps/dir/?api=1&destination=${job.latitude},${job.longitude}`} 
                                        target="_blank" 
                                        rel="noreferrer"
                                        className="px-4 py-2 bg-indigo-600 text-white text-sm font-bold rounded-lg hover:bg-indigo-700 text-center transition-colors"
                                    >
                                        Get Directions
                                    </a>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
