import { useEffect, useState } from "react";
import axios from "../../utils/axiosInstance";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import { FileText, Search, Calendar, Car, User, DollarSign } from "lucide-react";

export default function InvoicesPage() {
    const [invoices, setInvoices] = useState([]);
    const [filtered, setFiltered] = useState([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);

    const fetchInvoices = async () => {
        try {
            const res = await axios.get("/api/bills");
            setInvoices(res.data);
            setFiltered(res.data);
        } catch (err) {
            toast.error("Failed to fetch invoices");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInvoices();
    }, []);

    const handleSearch = (e) => {
        const term = e.target.value.toLowerCase();
        setSearch(term);

        const results = invoices.filter(inv =>
            inv.vehicle?.plateNumber?.toLowerCase().includes(term) ||
            `${inv.customer?.firstName} ${inv.customer?.lastName}`.toLowerCase().includes(term) ||
            inv.description?.toLowerCase().includes(term)
        );
        setFiltered(results);
    };

    return (
        <div className="p-6 pb-12">
            <div className="max-w-6xl mx-auto space-y-6">
                <div className="glass-panel p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
                            <FileText className="w-8 h-8 text-primary-500" /> Service Invoices
                        </h1>
                        <p className="text-slate-500 mt-1">Review all active and historical billing statements.</p>
                    </div>
                    
                    <div className="relative w-full md:w-96">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-slate-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search plate, customer, or service..."
                            value={search}
                            onChange={handleSearch}
                            className="input-modern pl-10 py-2 w-full"
                        />
                    </div>
                </div>

                {loading ? (
                    <div className="p-10 text-center text-slate-500">Loading invoices...</div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filtered.length === 0 ? (
                            <div className="col-span-full py-16 text-center text-slate-500 glass-panel">
                                <FileText className="w-12 h-12 mx-auto mb-4 opacity-20" />
                                No results found for your search.
                            </div>
                        ) : (
                            filtered.map((inv, index) => (
                                <motion.div 
                                    key={inv._id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="glass-card p-6 flex flex-col justify-between"
                                >
                                    <div>
                                        <div className="flex justify-between items-start mb-4 border-b border-slate-100 pb-4">
                                            <div>
                                                <span className="text-xs font-semibold text-primary-600 bg-primary-50 px-2 py-1 rounded-full">
                                                    #{inv._id.substring(inv._id.length - 6).toUpperCase()}
                                                </span>
                                            </div>
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
                                                    {inv.customer ? `${inv.customer.firstName} ${inv.customer.lastName}` : "Unknown Customer"}
                                                </span>
                                            </div>
                                            
                                            <div className="flex items-center gap-3 text-sm">
                                                <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-surface-700 flex items-center justify-center shrink-0">
                                                    <Car className="w-4 h-4 text-slate-500"/>
                                                </div>
                                                <span className="font-medium text-slate-800">
                                                    {inv.vehicle?.plateNumber || "No Plate"}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="bg-slate-50 dark:bg-surface-800 rounded-lg p-3 space-y-2 mb-4">
                                            <h4 className="text-xs font-semibold text-slate-500 uppercase">Services Rendered</h4>
                                            <ul className="space-y-1">
                                                {inv.services.map((srv, idx) => (
                                                    <li key={idx} className="flex justify-between text-sm text-slate-700">
                                                        <span>{srv.description}</span>
                                                        <span className="font-medium">${Number(srv.price || 0).toLocaleString()}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>

                                    <div className="pt-4 border-t border-slate-100 flex justify-between items-center mt-auto">
                                        <span className="text-sm font-semibold text-slate-500">Total Due</span>
                                        <span className="text-xl font-bold text-emerald-600 flex items-center gap-1">
                                            <DollarSign className="w-5 h-5"/>{Number(inv.totalPrice || 0).toLocaleString()}
                                        </span>
                                    </div>
                                </motion.div>
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
