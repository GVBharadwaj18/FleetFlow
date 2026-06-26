import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "../utils/axiosInstance";
import { motion } from "framer-motion";
import { Package, Truck, Calendar, FileText, PlusCircle, ArrowLeft } from "lucide-react";

export default function AddPartOrder() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [part, setPart] = useState(null);
    const [form, setForm] = useState({
        supplier: "",
        amount: "",
        notes: "",
        orderDate: new Date().toISOString().split("T")[0],
    });

    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchPart = async () => {
            try {
                const res = await axios.get(`/api/parts/${id}`);
                setPart(res.data);
            } catch (err) {
                setError("Failed to load part details");
            } finally {
                setFetching(false);
            }
        };
        fetchPart();
    }, [id]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            await axios.post(`/api/parts/${id}/order`, {
                supplier: form.supplier,
                amount: Number(form.amount),
                notes: form.notes,
                orderDate: form.orderDate,
            });

            // Reload part to see new history
            const res = await axios.get(`/api/parts/${id}`);
            setPart(res.data);
            setForm({ ...form, supplier: "", amount: "", notes: "" });
        } catch (err) {
            setError(err.response?.data?.message || "Failed to order part");
        } finally {
            setLoading(false);
        }
    };

    if (fetching) return <div className="p-10 text-center text-slate-500">Loading part details...</div>;
    if (!part && !fetching) return <div className="p-10 text-center text-rose-500">Part not found.</div>;

    return (
        <div className="p-6 pb-12">
            <div className="max-w-5xl mx-auto space-y-6">
                <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-500 hover:text-slate-700 transition-colors">
                    <ArrowLeft className="w-4 h-4" /> Back
                </button>

                <div className="glass-panel p-6 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                            <Package className="w-6 h-6 text-primary-500" /> Restock {part.name}
                        </h1>
                        <p className="text-slate-500 mt-1">Current Stock: <span className="font-semibold text-slate-800">{part.quantity} units</span></p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Order Form */}
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-panel p-6">
                        <h2 className="text-lg font-semibold text-slate-800 mb-6 flex items-center gap-2">
                            <PlusCircle className="w-5 h-5 text-emerald-500" /> Place New Order
                        </h2>
                        
                        {error && <div className="p-3 mb-4 bg-rose-50 text-rose-600 rounded-lg border border-rose-100">{error}</div>}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="flex items-center text-sm font-medium text-slate-700 mb-1"><Truck className="w-4 h-4 mr-1 text-slate-400"/> Supplier</label>
                                <input type="text" name="supplier" value={form.supplier} onChange={handleChange} className="input-modern py-2" required placeholder="Acme Auto Parts" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="flex items-center text-sm font-medium text-slate-700 mb-1"><Package className="w-4 h-4 mr-1 text-slate-400"/> Amount</label>
                                    <input type="number" name="amount" value={form.amount} onChange={handleChange} className="input-modern py-2" required min="1" placeholder="50" />
                                </div>
                                <div>
                                    <label className="flex items-center text-sm font-medium text-slate-700 mb-1"><Calendar className="w-4 h-4 mr-1 text-slate-400"/> Order Date</label>
                                    <input type="date" name="orderDate" value={form.orderDate} onChange={handleChange} className="input-modern py-2" required />
                                </div>
                            </div>
                            <div>
                                <label className="flex items-center text-sm font-medium text-slate-700 mb-1"><FileText className="w-4 h-4 mr-1 text-slate-400"/> Notes</label>
                                <textarea name="notes" value={form.notes} onChange={handleChange} className="input-modern py-2" rows="3" placeholder="Additional details..." />
                            </div>
                            <button type="submit" disabled={loading} className="btn-primary w-full">
                                {loading ? "Processing..." : "Add to Inventory"}
                            </button>
                        </form>
                    </motion.div>

                    {/* Order History */}
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-panel p-6">
                        <h2 className="text-lg font-semibold text-slate-800 mb-6 flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-blue-500" /> Order History
                        </h2>
                        
                        <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                            {(!part.orderHistory || part.orderHistory.length === 0) ? (
                                <p className="text-slate-500 text-center py-8">No previous orders found for this part.</p>
                            ) : (
                                [...part.orderHistory].reverse().map((order, idx) => (
                                    <div key={idx} className="p-4 rounded-xl border border-slate-100 bg-slate-50 dark:bg-surface-800/50 hover:bg-slate-50 dark:bg-surface-800 transition-colors">
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="font-semibold text-slate-800">{order.supplier}</div>
                                            <div className="text-sm font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">+{order.amount} units</div>
                                        </div>
                                        <div className="text-sm text-slate-500 flex items-center gap-1 mb-2">
                                            <Calendar className="w-3 h-3"/> {new Date(order.orderDate).toLocaleDateString()}
                                        </div>
                                        {order.notes && <p className="text-sm text-slate-600 bg-white dark:bg-surface-900 p-2 rounded border border-slate-100">{order.notes}</p>}
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
