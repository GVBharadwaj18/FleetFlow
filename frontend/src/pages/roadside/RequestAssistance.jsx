import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../utils/axiosInstance';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, MapPin, Camera, Car, Send, CheckCircle } from 'lucide-react';

export default function RequestAssistance() {
    const navigate = useNavigate();
    const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm();
    const [vehicles, setVehicles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [gettingLocation, setGettingLocation] = useState(false);
    const [locationCaptured, setLocationCaptured] = useState(false);
    const [previewImage, setPreviewImage] = useState(null);

    useEffect(() => {
        const fetchVehicles = async () => {
            try {
                const res = await axiosInstance.get('/api/vehicles');
                setVehicles(res.data);
            } catch (err) {
                toast.error('Failed to load vehicles');
            }
        };
        fetchVehicles();
    }, []);

    const getLocation = () => {
        setGettingLocation(true);
        if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setValue('latitude', position.coords.latitude);
                    setValue('longitude', position.coords.longitude);
                    setLocationCaptured(true);
                    toast.success('GPS location captured!');
                    setGettingLocation(false);
                },
                () => {
                    toast.error('Could not get location. Enter address manually.');
                    setGettingLocation(false);
                }
            );
        } else {
            toast.error('Geolocation not supported by your browser.');
            setGettingLocation(false);
        }
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setValue('imageUrl', reader.result);
                setPreviewImage(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const onSubmit = async (data) => {
        if (!data.latitude && !data.longitude && !data.address) {
            toast.error('Please provide GPS location or a manual address.');
            return;
        }
        setLoading(true);
        try {
            await axiosInstance.post('/api/roadside', data);
            toast.success('Emergency request submitted! Help is on the way.');
            navigate('/my-requests');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to submit request.');
        } finally {
            setLoading(false);
        }
    };

    const ISSUE_TYPES = [
        { value: 'Flat Tire',       label: 'Flat Tire',            color: 'text-warning-600' },
        { value: 'Battery Problem', label: 'Battery / Jump Start', color: 'text-brand-600'   },
        { value: 'Engine Issue',    label: 'Engine Issue',         color: 'text-danger-600'  },
        { value: 'Lockout',         label: 'Locked Out',           color: 'text-accent-600'  },
        { value: 'Out of Gas',      label: 'Out of Gas',           color: 'text-surface-600' },
        { value: 'Unknown Issue',   label: 'Unknown Issue',        color: 'text-surface-600' },
        { value: 'Other',           label: 'Other',                color: 'text-surface-600' },
    ];

    return (
        <div className="p-4 sm:p-6 pb-12">
            <div className="max-w-2xl mx-auto">

                {/* SOS Header */}
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
                    <div className="glass-panel p-5 border-l-4 border-danger-500 overflow-visible">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-danger-100 dark:bg-danger-500/15 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-glow-danger">
                                <AlertTriangle className="w-7 h-7 text-danger-600 dark:text-danger-400" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-display font-bold text-surface-900 dark:text-white">Emergency SOS</h1>
                                <p className="text-sm text-surface-500 mt-0.5">A mechanic will be dispatched to your location immediately.</p>
                            </div>
                        </div>
                    </div>
                </motion.div>

                <motion.form
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    onSubmit={handleSubmit(onSubmit)}
                    className="glass-panel p-6 space-y-6"
                >
                    {/* Vehicle Selection */}
                    <div>
                        <label className="input-label">
                            <Car className="w-3.5 h-3.5 inline mr-1.5" />Vehicle in Distress
                        </label>
                        <select {...register('vehicle', { required: 'Please select a vehicle' })} className="input-modern">
                            <option value="">— Select Vehicle —</option>
                            {vehicles.map(v => (
                                <option key={v._id} value={v._id}>{v.brand} {v.model} ({v.plateNumber})</option>
                            ))}
                        </select>
                        {errors.vehicle && <p className="text-danger-500 text-xs mt-1">{errors.vehicle.message}</p>}
                    </div>

                    {/* Location */}
                    <div className="space-y-3 p-4 rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800/40">
                        <h3 className="text-sm font-semibold text-surface-700 dark:text-surface-300 flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-brand-500" /> Your Location
                        </h3>
                        <button
                            type="button"
                            onClick={getLocation}
                            disabled={gettingLocation}
                            className={`w-full py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all ${locationCaptured ? 'bg-success-100 text-success-700 dark:bg-success-500/15 dark:text-success-400' : 'bg-brand-100 text-brand-700 dark:bg-brand-500/15 dark:text-brand-400 hover:bg-brand-200 dark:hover:bg-brand-500/25'}`}
                        >
                            {locationCaptured ? (
                                <><CheckCircle className="w-4 h-4" /> GPS Location Captured</>
                            ) : gettingLocation ? (
                                <><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg> Getting location...</>
                            ) : (
                                <><MapPin className="w-4 h-4" /> Use Current GPS Location</>
                            )}
                        </button>
                        <div className="grid grid-cols-2 gap-3">
                            <input type="text" placeholder="Latitude" {...register('latitude')} readOnly className="input-modern text-center text-xs font-mono" />
                            <input type="text" placeholder="Longitude" {...register('longitude')} readOnly className="input-modern text-center text-xs font-mono" />
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="flex-1 h-px bg-surface-200 dark:bg-surface-700" />
                            <span className="text-xs text-surface-400 font-medium">OR</span>
                            <div className="flex-1 h-px bg-surface-200 dark:bg-surface-700" />
                        </div>
                        <input type="text" placeholder="Enter address manually..." {...register('address')} className="input-modern" />
                    </div>

                    {/* Issue Type */}
                    <div>
                        <label className="input-label">Nature of Emergency</label>
                        <select {...register('issueDescription', { required: 'Please select issue type' })} className="input-modern">
                            {ISSUE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                        </select>
                        {errors.issueDescription && <p className="text-danger-500 text-xs mt-1">{errors.issueDescription.message}</p>}
                        <textarea
                            {...register('customDescription')}
                            placeholder="Describe the problem in more detail..."
                            rows={3}
                            className="input-modern mt-3 resize-none"
                        />
                    </div>

                    {/* Photo Upload */}
                    <div>
                        <label className="input-label"><Camera className="w-3.5 h-3.5 inline mr-1.5" />Photo (Optional)</label>
                        <label className="block w-full px-4 py-3 rounded-xl border-2 border-dashed border-surface-300 dark:border-surface-600 text-center cursor-pointer hover:border-brand-400 transition-colors text-sm text-surface-500">
                            <Camera className="w-5 h-5 mx-auto mb-1 opacity-50" />
                            Click to upload photo
                            <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                        </label>
                        <input type="hidden" {...register('imageUrl')} />
                        <AnimatePresence>
                            {previewImage && (
                                <motion.img
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    src={previewImage}
                                    alt="Preview"
                                    className="mt-3 rounded-xl max-h-48 object-cover border border-surface-200 dark:border-surface-700 w-full"
                                />
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Submit */}
                    <button type="submit" disabled={loading} className="w-full btn-danger justify-center py-3 text-base">
                        {loading ? (
                            <><svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg> Submitting...</>
                        ) : (
                            <><Send className="w-5 h-5" /> Send Emergency Request</>
                        )}
                    </button>
                </motion.form>
            </div>
        </div>
    );
}
