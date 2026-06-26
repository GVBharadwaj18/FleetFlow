import { useEffect, useState } from "react";
import axios from "../../utils/axiosInstance";
import { motion } from "framer-motion";
import { Archive, Calendar, User, Car, DollarSign } from "lucide-react";

export default function ArchivedInvoices() {
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchArchived = async () => {
            try {
                const res = await axios.get("/api/bills/archived");
                setInvoices(res.data);
            } catch (err) {
                console.error("Failed to fetch archived invoices:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchArchived();
    }, []);

    return (
        <div className="p-6 pb-12">
            <div className="max-w-6xl mx-auto space-y-6">
                <div className="glass-panel p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
                            <Archive className="w-8 h-8 text-primary-500" /> Archived Invoices
                        </h1>
                        <p className="text-slate-500 mt-1">Read-only historical records of closed billing accounts.</p>
                    </div>
                </div>

                {loading ? (
                    <div className="p-10 text-center text-slate-500">Loading archives...</div>
                ) : invoices.length === 0 ? (
                    <div className="py-16 text-center text-slate-500 glass-panel">
                        <Archive className="w-12 h-12 mx-auto mb-4 opacity-20" />
                        No archived invoices found.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {invoices.map((inv, index) => (
                            <motion.div 
                                key={inv._id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="glass-card p-6 flex flex-col justify-between opacity-80 hover:opacity-100 transition-opacity grayscale-[50%] hover:grayscale-0"
                            >
                                <div>
                                    <div className="flex justify-between items-start mb-4 border-b border-slate-100 pb-4">
                                        <span className="text-xs font-semibold text-slate-500 bg-slate-100 dark:bg-surface-700 px-2 py-1 rounded-full flex items-center gap-1">
                                            <Archive className="w-3 h-3"/> Archived
                                        </span>
                                        <div className="flex items-center gap-1 text-sm text-slate-500">
                                            <Calendar className="w-4 h-4"/> {new Date(inv.date).toLocaleDateString()}
                                        </div>
                                    </div>

                                    <div className="space-y-3 mb-6">
                                        <div className="flex items-center gap-3 text-sm">
                                            <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-surface-700 flex items-center justify-center shrink-0">
                                                <User className="w-4 h-4 text-slate-500"/>
                                            </div>
                                            <span className="font-medium text-slate-800">
                                                {inv.customer ? `${inv.customer.firstName} ${inv.customer.lastName}` : "Unknown"}
                                            </span>
                                        </div>
                                        
                                        <div className="flex items-center gap-3 text-sm">
                                            <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-surface-700 flex items-center justify-center shrink-0">
                                                <Car className="w-4 h-4 text-slate-500"/>
                                            </div>
                                            <span className="font-medium text-slate-800">
                                                {inv.vehicle?.brand} {inv.vehicle?.model}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-slate-100 flex justify-between items-center mt-auto">
                                    <span className="text-sm font-semibold text-slate-500">Total Charged</span>
                                    <span className="text-xl font-bold text-slate-700 flex items-center gap-1">
                                        <DollarSign className="w-5 h-5"/>{Number(inv.totalPrice || 0).toLocaleString()}
                                    </span>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
