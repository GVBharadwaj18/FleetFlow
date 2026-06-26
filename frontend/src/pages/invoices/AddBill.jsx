import React, { useEffect, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import axiosInstance from '../../utils/axiosInstance';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { FilePlus, User, Car, Calendar, Wrench, Package, PlusCircle, Trash2, Save, ArrowLeft, DollarSign, Sparkles } from 'lucide-react';

const AddBill = () => {
    const navigate = useNavigate();
    const { maintenanceId } = useParams();

    const { register, control, handleSubmit, watch, reset } = useForm({
        defaultValues: {
            customer: '',
            vehicle: '',
            date: new Date().toISOString().split("T")[0],
            services: [{ description: '', price: 0 }],
        },
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: 'services',
    });

    const [customers, setCustomers] = useState([]);
    const [vehicles, setVehicles] = useState([]);
    const [availableParts, setAvailableParts] = useState([]);
    const [form, setForm] = useState({ partsUsed: [] });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [custRes, vehRes, partsRes] = await Promise.all([
                    axiosInstance.get('/api/customers'),
                    axiosInstance.get('/api/vehicles'),
                    axiosInstance.get('/api/parts'),
                ]);
                setCustomers(custRes.data);
                setVehicles(vehRes.data);
                setAvailableParts(partsRes.data);
            } catch (err) {
                toast.error('Failed to load required data.');
            }
        };
        fetchData();
    }, []);

    const services = watch('services');
    const totalPrice = services.reduce((sum, item) => sum + Number(item.price || 0), 0);

    const onSubmit = async (data) => {
        try {
            const cleanedServices = data.services.map((s) => ({
                description: s.description,
                price: parseFloat(s.price.toString().replace(',', '.')) || 0,
            }));

            await axiosInstance.post('/api/bills', {
                customer: data.customer,
                vehicle: data.vehicle,
                date: data.date,
                services: cleanedServices,
                totalPrice,
                maintenanceId,
                partsUsed: form.partsUsed,
            });

            toast.success('Invoice created successfully!');
            reset();
            navigate('/invoices');
        } catch (err) {
            toast.error('Failed to submit invoice: ' + err.message);
        }
    };

    const handleAISuggestions = () => {
        toast.promise(
            new Promise((resolve) => setTimeout(resolve, 1500)),
            {
                loading: 'Analyzing vehicle history...',
                success: 'AI generated service suggestions!',
                error: 'Failed to generate suggestions.',
            }
        ).then(() => {
            append([
                { description: 'Synthetic Oil Change & Filter', price: 85.00 },
                { description: 'Multi-Point Inspection', price: 45.00 },
                { description: 'Tire Rotation', price: 30.00 }
            ]);
            setForm(prev => ({ ...prev, partsUsed: availableParts.slice(0, 2).map(p => p._id) }));
        });
    };

    return (
        <div className="p-6 pb-12">
            <div className="max-w-3xl mx-auto space-y-6">
                <button onClick={() => navigate('/invoices')} className="flex items-center gap-2 text-slate-500 hover:text-slate-700 transition-colors">
                    <ArrowLeft className="w-4 h-4" /> Back to Invoices
                </button>

                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-panel p-8">
                    <h2 className="text-2xl font-bold text-slate-800 mb-8 flex items-center gap-2 border-b border-slate-100 pb-4">
                        <FilePlus className="w-6 h-6 text-emerald-500" /> Create New Invoice
                    </h2>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="flex items-center text-sm font-medium text-slate-700 mb-1"><User className="w-4 h-4 mr-1 text-slate-400"/> Customer</label>
                                <select {...register('customer')} className="input-modern py-2 w-full" required>
                                    <option value="">-- Select Customer --</option>
                                    {customers.map((cust) => (
                                        <option key={cust._id} value={cust._id}>{cust.firstName} {cust.lastName}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="flex items-center text-sm font-medium text-slate-700 mb-1"><Car className="w-4 h-4 mr-1 text-slate-400"/> Vehicle</label>
                                <select {...register('vehicle')} className="input-modern py-2 w-full" required>
                                    <option value="">-- Select Vehicle --</option>
                                    {vehicles.map((veh) => (
                                        <option key={veh._id} value={veh._id}>{veh.brand} {veh.model} - {veh.plateNumber}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="md:col-span-2">
                                <label className="flex items-center text-sm font-medium text-slate-700 mb-1"><Calendar className="w-4 h-4 mr-1 text-slate-400"/> Invoice Date</label>
                                <input type="date" {...register("date", { required: true })} className="input-modern py-2 w-full" />
                            </div>
                        </div>

                        <div className="border border-slate-100 p-5 rounded-xl bg-slate-50 dark:bg-surface-800/50">
                            <div className="flex items-center justify-between mb-4">
                                <h4 className="font-semibold text-slate-800 flex items-center gap-2"><Wrench className="w-4 h-4 text-slate-500"/> Billed Services</h4>
                                <button type="button" onClick={handleAISuggestions} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors border border-indigo-200">
                                    <Sparkles className="w-3.5 h-3.5" /> AI Suggest
                                </button>
                            </div>
                            <div className="space-y-3">
                                {fields.map((item, index) => (
                                    <div key={item.id} className="flex gap-3 items-center">
                                        <input type="text" placeholder="Service description" {...register(`services.${index}.description`, { required: true })} className="input-modern flex-1 py-1.5" />
                                        <div className="relative w-32">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <DollarSign className="h-4 w-4 text-slate-400" />
                                            </div>
                                            <input type="number" placeholder="0.00" {...register(`services.${index}.price`, { required: true })} className="input-modern w-full pl-8 py-1.5" />
                                        </div>
                                        <button type="button" onClick={() => remove(index)} className="p-1.5 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors" title="Remove Service">
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                            <button type="button" onClick={() => append({ description: '', price: 0 })} className="mt-4 flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors">
                                <PlusCircle className="w-4 h-4"/> Add Another Service
                            </button>
                        </div>

                        <div className="border border-slate-100 p-5 rounded-xl bg-slate-50 dark:bg-surface-800/50">
                            <h4 className="font-semibold text-slate-800 mb-4 flex items-center gap-2"><Package className="w-4 h-4 text-slate-500"/> Parts Included</h4>
                            <div className="max-h-48 overflow-y-auto pr-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {availableParts.map(part => (
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

                        <div className="flex flex-col sm:flex-row justify-between items-center pt-6 border-t border-slate-100 gap-4">
                            <div className="text-2xl font-black text-slate-800 flex items-center gap-2">
                                <span className="text-sm font-medium text-slate-500 uppercase">Total Due:</span> 
                                <span className="text-emerald-600 flex items-center"><DollarSign className="w-6 h-6"/>{totalPrice.toLocaleString()}</span>
                            </div>
                            <div className="flex w-full sm:w-auto gap-3">
                                <button type="button" onClick={() => navigate('/invoices')} className="btn-secondary flex-1 sm:flex-none">Cancel</button>
                                <button type="submit" className="btn-primary flex-1 sm:flex-none flex items-center justify-center gap-2"><Save className="w-4 h-4"/> Save Invoice</button>
                            </div>
                        </div>
                    </form>
                </motion.div>
            </div>
        </div>
    );
};

export default AddBill;
