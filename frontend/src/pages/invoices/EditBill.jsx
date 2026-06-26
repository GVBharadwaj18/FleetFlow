import React, { useEffect, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { useParams, useNavigate } from 'react-router-dom';
import axiosInstance from '../../utils/axiosInstance';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { FileEdit, User, Car, Wrench, Package, PlusCircle, Trash2, Save, ArrowLeft, DollarSign } from 'lucide-react';

const EditBill = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [customers, setCustomers] = useState([]);
    const [vehicles, setVehicles] = useState([]);
    const [availableParts, setAvailableParts] = useState([]);
    const [form, setForm] = useState({ partsUsed: [] });

    const { register, control, handleSubmit, reset } = useForm({
        defaultValues: {
            customer: '',
            vehicle: '',
            maintenanceId: '',
            services: [],
        },
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: 'services',
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [billRes, customersRes, vehiclesRes, partsRes] = await Promise.all([
                    axiosInstance.get(`/api/bills/${id}`),
                    axiosInstance.get('/api/customers'),
                    axiosInstance.get('/api/vehicles'),
                    axiosInstance.get('/api/parts'),
                ]);

                reset({
                    customer: billRes.data.customer._id,
                    vehicle: billRes.data.vehicle._id,
                    services: billRes.data.services,
                    maintenanceId: billRes.data.maintenanceId?._id || '',
                });

                setCustomers(customersRes.data);
                setVehicles(vehiclesRes.data);
                setAvailableParts(partsRes.data);
                setForm({ partsUsed: (billRes.data.maintenanceId?.partsUsed || []).map(p => p._id) });
            } catch (err) {
                toast.error('Failed to fetch invoice data.');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id, reset]);

    const onSubmit = async (data) => {
        const cleanedServices = data.services.map((s) => ({
            description: s.description,
            price: parseFloat(s.price.toString().replace(',', '.')) || 0,
        }));

        const totalPrice = cleanedServices.reduce((sum, s) => sum + s.price, 0);

        try {
            await axiosInstance.put(`/api/bills/${id}`, {
                customer: data.customer,
                vehicle: data.vehicle,
                maintenanceId: data.maintenanceId,
                services: cleanedServices,
                totalPrice,
                partsUsed: form.partsUsed,
            });

            toast.success('Invoice updated successfully');
            navigate('/invoices');
        } catch (err) {
            toast.error('Update failed.');
        }
    };

    if (loading) return <div className="p-10 text-center text-slate-500">Loading editor...</div>;

    return (
        <div className="p-6 pb-12">
            <div className="max-w-3xl mx-auto space-y-6">
                <button onClick={() => navigate('/invoices')} className="flex items-center gap-2 text-slate-500 hover:text-slate-700 transition-colors">
                    <ArrowLeft className="w-4 h-4" /> Back to Invoices
                </button>

                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-panel p-8">
                    <h2 className="text-2xl font-bold text-slate-800 mb-8 flex items-center gap-2 border-b border-slate-100 pb-4">
                        <FileEdit className="w-6 h-6 text-amber-500" /> Edit Invoice
                    </h2>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="flex items-center text-sm font-medium text-slate-700 mb-1"><User className="w-4 h-4 mr-1 text-slate-400"/> Customer</label>
                                <select {...register('customer')} className="input-modern py-2 w-full" required>
                                    <option value="">-- Select Customer --</option>
                                    {customers.map((c) => (
                                        <option key={c._id} value={c._id}>{c.firstName} {c.lastName}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="flex items-center text-sm font-medium text-slate-700 mb-1"><Car className="w-4 h-4 mr-1 text-slate-400"/> Vehicle</label>
                                <select {...register('vehicle')} className="input-modern py-2 w-full" required>
                                    <option value="">-- Select Vehicle --</option>
                                    {vehicles.map((v) => (
                                        <option key={v._id} value={v._id}>{v.model} - {v.plateNumber}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="border border-slate-100 p-5 rounded-xl bg-slate-50 dark:bg-surface-800/50">
                            <h4 className="font-semibold text-slate-800 mb-4 flex items-center gap-2"><Wrench className="w-4 h-4 text-slate-500"/> Billed Services</h4>
                            <div className="space-y-3">
                                {fields.map((field, index) => (
                                    <div key={field.id} className="flex gap-3 items-center">
                                        <input type="text" placeholder="Service description" {...register(`services.${index}.description`)} className="input-modern flex-1 py-1.5" />
                                        <div className="relative w-32">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <DollarSign className="h-4 w-4 text-slate-400" />
                                            </div>
                                            <input type="number" step="0.01" placeholder="0.00" {...register(`services.${index}.price`)} className="input-modern w-full pl-8 py-1.5" />
                                        </div>
                                        <button type="button" onClick={() => remove(index)} className="p-1.5 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors">
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                            <button type="button" onClick={() => append({ description: '', price: '' })} className="mt-4 flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors">
                                <PlusCircle className="w-4 h-4"/> Add Service
                            </button>
                        </div>

                        <div className="border border-slate-100 p-5 rounded-xl bg-slate-50 dark:bg-surface-800/50">
                            <h4 className="font-semibold text-slate-800 mb-4 flex items-center gap-2"><Package className="w-4 h-4 text-slate-500"/> Parts Used</h4>
                            <div className="max-h-48 overflow-y-auto pr-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {availableParts.map((part) => (
                                    <label key={part._id} className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 bg-white dark:bg-surface-900 cursor-pointer hover:border-primary-300 transition-colors">
                                        <input
                                            type="checkbox"
                                            checked={form.partsUsed.includes(part._id)}
                                            onChange={() => {
                                                const exists = form.partsUsed.includes(part._id);
                                                const updated = exists ? form.partsUsed.filter(id => id !== part._id) : [...form.partsUsed, part._id];
                                                setForm(prev => ({ ...prev, partsUsed: updated }));
                                            }}
                                            className="w-4 h-4 text-primary-600 rounded border-slate-300 focus:ring-primary-500"
                                        />
                                        <span className="text-sm font-medium text-slate-700">{part.name}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row justify-end items-center pt-6 border-t border-slate-100 gap-4">
                            <div className="flex w-full sm:w-auto gap-3">
                                <button type="button" onClick={() => navigate('/invoices')} className="btn-secondary flex-1 sm:flex-none">Cancel</button>
                                <button type="submit" className="btn-primary flex-1 sm:flex-none flex items-center justify-center gap-2"><Save className="w-4 h-4"/> Save Changes</button>
                            </div>
                        </div>
                    </form>
                </motion.div>
            </div>
        </div>
    );
};

export default EditBill;
