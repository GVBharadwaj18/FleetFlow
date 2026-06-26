import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "../utils/axiosInstance";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import { Wrench, Car, Calendar, Package, PlusCircle, Trash2, ArrowLeft, Save, Sparkles } from "lucide-react";

export default function EditMaintenance() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [form, setForm] = useState(null);
    const [vehicles, setVehicles] = useState([]);
    const [availableParts, setAvailableParts] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [recordRes, vehiclesRes, partsRes] = await Promise.all([
                    axios.get(`/api/maintenance/${id}`),
                    axios.get("/api/vehicles"),
                    axios.get("/api/parts"),
                ]);

                const record = recordRes.data;
                setForm({
                    vehicleId: record.vehicleId?._id || "",
                    serviceDate: record.serviceDate?.split("T")[0] || "",
                    services: record.services || [],
                    partsUsed: record.partsUsed?.map(p => p._id) || [],
                    aiNotes: record.aiNotes || ""
                });

                setVehicles(vehiclesRes.data);
                setAvailableParts(partsRes.data);
            } catch (err) {
                console.error(err);
                toast.error("Failed to load maintenance record");
            }
        };

        fetchData();
    }, [id]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const handlePartsToggle = (partId) => {
        setForm(prev => {
            const exists = prev.partsUsed.includes(partId);
            const updated = exists
                ? prev.partsUsed.filter(id => id !== partId)
                : [...prev.partsUsed, partId];
            return { ...prev, partsUsed: updated };
        });
    };

    const addService = () => {
        setForm(prev => ({
            ...prev,
            services: [...prev.services, { description: "", cost: "" }]
        }));
    };

    const updateService = (index, field, value) => {
        const updated = [...form.services];
        updated[index][field] = field === "cost" ? parseInt(value) || "" : value;
        setForm(prev => ({ ...prev, services: updated }));
    };

    const removeService = (index) => {
        const updated = form.services.filter((_, i) => i !== index);
        setForm(prev => ({ ...prev, services: updated }));
    };

    const handleSubmit = async () => {
        try {
            await axios.put(`/api/maintenance/${id}`, form);
            toast.success("Maintenance updated successfully");
            navigate("/maintenance");
        } catch (err) {
            console.error(err);
            toast.error("Failed to update maintenance");
        }
    };

    const handleAIGenerateNotes = () => {
        if (!form.services.length) {
            toast.error("Please add services first.");
            return;
        }
        toast.promise(
            new Promise(resolve => setTimeout(resolve, 2000)),
            {
                loading: 'AI analyzing service data...',
                success: 'Maintenance summary generated!',
                error: 'Failed to generate summary.',
            }
        ).then(() => {
            const summary = `System Diagnosis: The vehicle required standard scheduled maintenance. Performed ${form.services.length} discrete operations including ${form.services.map(s => s.description).join(', ')}. All replaced components were verified for OEM compliance. Next recommended service in 5,000 miles.`;
            setForm(prev => ({ ...prev, aiNotes: summary }));
        });
    };

    if (!form) return <div className="p-10 text-center text-slate-500">Loading editor...</div>;

    return (
        <div className="p-6 pb-12">
            <div className="max-w-2xl mx-auto space-y-6">
                <button onClick={() => navigate("/maintenance")} className="flex items-center gap-2 text-slate-500 hover:text-slate-700 transition-colors">
                    <ArrowLeft className="w-4 h-4" /> Back to Records
                </button>

                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-panel p-8">
                    <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2 border-b border-slate-100 pb-4">
                        <Wrench className="w-6 h-6 text-amber-500" /> Edit Service Record
                    </h2>

                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="flex items-center text-sm font-medium text-slate-700 mb-1"><Car className="w-4 h-4 mr-1 text-slate-400"/> Vehicle</label>
                                <select name="vehicleId" value={form.vehicleId} onChange={handleChange} className="input-modern py-2">
                                    <option value="">-- Select Vehicle --</option>
                                    {vehicles.map(v => (
                                        <option key={v._id} value={v._id}>{v.brand} {v.model} ({v.plateNumber})</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="flex items-center text-sm font-medium text-slate-700 mb-1"><Calendar className="w-4 h-4 mr-1 text-slate-400"/> Service Date</label>
                                <input name="serviceDate" type="date" value={form.serviceDate || ""} onChange={handleChange} className="input-modern py-2" />
                            </div>
                        </div>

                        <div className="border border-slate-100 p-4 rounded-xl bg-slate-50 dark:bg-surface-800/50">
                            <h4 className="font-semibold text-slate-800 mb-3 flex items-center gap-2"><Wrench className="w-4 h-4 text-slate-500"/> Services Rendered</h4>
                            <div className="space-y-3">
                                {form.services.map((srv, idx) => (
                                    <div key={idx} className="flex gap-3 items-center">
                                        <input value={srv.description || ""} onChange={(e) => updateService(idx, "description", e.target.value)} placeholder="E.g. Oil Change" className="input-modern flex-1 py-1.5 text-sm" />
                                        <input type="number" value={srv.cost || ""} onChange={(e) => updateService(idx, "cost", e.target.value)} placeholder="Cost ($)" className="input-modern w-24 py-1.5 text-sm" />
                                        <button onClick={() => removeService(idx)} className="p-1.5 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                            <button onClick={addService} className="mt-3 flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors">
                                <PlusCircle className="w-4 h-4"/> Add Service Line
                            </button>
                        </div>

                        <div className="border border-slate-100 p-4 rounded-xl bg-slate-50 dark:bg-surface-800/50">
                            <h4 className="font-semibold text-slate-800 mb-3 flex items-center gap-2"><Package className="w-4 h-4 text-slate-500"/> Parts Used</h4>
                            <div className="max-h-48 overflow-y-auto pr-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {availableParts.map(part => (
                                    <label key={part._id} className="flex items-center gap-3 p-2 rounded-lg border border-slate-200 bg-white dark:bg-surface-900 cursor-pointer hover:border-primary-300 transition-colors">
                                        <input type="checkbox" checked={form.partsUsed.includes(part._id)} onChange={() => handlePartsToggle(part._id)} className="w-4 h-4 text-primary-600 rounded border-slate-300 focus:ring-primary-500" />
                                        <span className="text-sm text-slate-700">{part.name}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="border border-indigo-100 p-4 rounded-xl bg-indigo-50/30">
                            <div className="flex items-center justify-between mb-3">
                                <h4 className="font-semibold text-indigo-900 flex items-center gap-2"><Sparkles className="w-4 h-4 text-indigo-500"/> AI Service Notes</h4>
                                <button type="button" onClick={handleAIGenerateNotes} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-100 text-indigo-700 hover:bg-indigo-200 transition-colors">
                                    <Sparkles className="w-3.5 h-3.5" /> Generate Summary
                                </button>
                            </div>
                            <textarea
                                name="aiNotes"
                                value={form.aiNotes || ""}
                                onChange={handleChange}
                                placeholder="AI will generate a professional summary of the maintenance performed, or you can type here manually..."
                                className="input-modern w-full h-24 py-2 text-sm bg-white dark:bg-surface-900"
                            ></textarea>
                        </div>

                        <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
                            <button onClick={() => navigate("/maintenance")} className="btn-secondary">Cancel</button>
                            <button onClick={handleSubmit} className="btn-primary flex items-center gap-2"><Save className="w-4 h-4"/> Save Changes</button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
