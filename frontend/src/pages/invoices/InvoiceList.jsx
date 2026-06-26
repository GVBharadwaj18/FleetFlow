import React, { useEffect, useState, useRef } from 'react';
import axiosInstance from '../../utils/axiosInstance';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Plus, User, Car, DollarSign, Calendar, Edit, Archive, Printer, X, ChevronDown, ChevronUp, Package, Wrench, MoreHorizontal } from 'lucide-react';
import { DataTable } from '../../ui/DataTable';
import { Button } from '../../ui/Button';

const InvoiceList = () => {
    const [bills, setBills] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [vehicles, setVehicles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedCustomer, setSelectedCustomer] = useState('');
    const [selectedVehicle, setSelectedVehicle] = useState('');
    const [printBill, setPrintBill] = useState(null);
    const [expandedId, setExpandedId] = useState(null);
    const printRef = useRef();
    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [billRes, custRes, vehRes] = await Promise.all([
                    axiosInstance.get('/api/bills'),
                    axiosInstance.get('/api/customers'),
                    axiosInstance.get('/api/vehicles'),
                ]);
                setBills(billRes.data);
                setCustomers(custRes.data);
                setVehicles(vehRes.data);
            } catch (error) {
                toast.error(`Failed to load invoices`);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const filteredBills = bills.filter((bill) => {
        const matchCustomer = selectedCustomer ? bill.customer?._id === selectedCustomer : true;
        const matchVehicle = selectedVehicle ? bill.vehicle?._id === selectedVehicle : true;
        return matchCustomer && matchVehicle;
    });

    const handleArchive = async (id) => {
        const confirmed = window.confirm('Are you sure you want to archive this invoice?');
        if (!confirmed) return;

        try {
            await axiosInstance.patch(`/api/bills/${id}/archive`);
            toast.success('Invoice archived successfully');
            setBills((prev) => prev.filter((b) => b._id !== id));
        } catch (err) {
            toast.error(`Failed to archive invoice`);
        }
    };

    const toggleExpand = (id) => {
        setExpandedId(prev => (prev === id ? null : id));
    };

    const columns = [
        {
            id: "id",
            header: "Invoice #",
            accessorFn: (row) => row._id.substring(row._id.length - 6).toUpperCase(),
            cell: ({ row }) => (
                <span className="text-xs font-semibold text-primary-600 bg-primary-50 px-2 py-1 rounded-full dark:bg-primary-500/10 dark:text-primary-400">
                    #{row.original._id.substring(row.original._id.length - 6).toUpperCase()}
                </span>
            )
        },
        {
            id: "date",
            header: "Date",
            accessorFn: (row) => row.date,
            cell: ({ row }) => (
                <span className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-surface-400" />
                    {new Date(row.original.date).toLocaleDateString()}
                </span>
            )
        },
        {
            id: "customer",
            header: "Customer",
            accessorFn: (row) => `${row.customer?.firstName} ${row.customer?.lastName}`,
            cell: ({ row }) => (
                <span className="flex items-center gap-2 font-medium">
                    <User className="w-4 h-4 text-surface-400" />
                    <span>🦾 Customer: {row.original.customer ? `${row.original.customer.firstName} ${row.original.customer.lastName}` : 'Unknown'}</span>
                </span>
            )
        },
        {
            id: "vehicle",
            header: "Vehicle",
            accessorFn: (row) => `${row.vehicle?.brand} ${row.vehicle?.model}`,
            cell: ({ row }) => (
                <span className="flex items-center gap-2 text-surface-600 dark:text-surface-400">
                    <Car className="w-4 h-4 text-surface-400" />
                    {row.original.vehicle ? `${row.original.vehicle.brand} ${row.original.vehicle.model}${row.original.vehicle.plateNumber ? ` - ${row.original.vehicle.plateNumber}` : ''}` : 'Unknown'}
                </span>
            )
        },
        {
            id: "amount",
            header: "Amount",
            accessorFn: (row) => row.totalPrice,
            cell: ({ row }) => (
                <span className="font-bold text-emerald-600 dark:text-emerald-500">
                    {Number(row.original.totalPrice || 0).toLocaleString()} €
                </span>
            )
        },
        {
            id: "actions",
            header: "Actions",
            cell: ({ row }) => {
                const bill = row.original;
                return (
                    <div className="flex items-center gap-2">
                        <Button variant="secondary" size="sm" onClick={() => navigate(`/edit-bill/${bill._id}`)} title="Edit">
                            <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="secondary" size="sm" onClick={() => setPrintBill(bill)} title="Print">
                            <Printer className="w-4 h-4" />
                        </Button>
                        <Button variant="danger" size="sm" onClick={() => handleArchive(bill._id)} title="Archive">
                            <Archive className="w-4 h-4" />
                        </Button>
                    </div>
                );
            }
        }
    ];

    return (
        <div className="p-6 pb-12">
            <div className="max-w-5xl mx-auto space-y-6">
                {/* Header */}
                <div className="glass-panel p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-success-500 to-success-700 flex items-center justify-center">
                            <FileText className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-display font-bold text-surface-900 dark:text-white">Invoices</h1>
                            <p className="text-surface-500 text-sm mt-0.5">{bills.length} invoices found</p>
                        </div>
                    </div>
                    <button className="btn-primary" onClick={() => navigate('/add-bill')}>
                        <Plus className="w-4 h-4" /> Create Invoice
                    </button>
                </div>

                {/* Filters */}
                <div className="glass-panel p-5 flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                        <label className="input-label"><User className="w-3 h-3 inline mr-1" />Customer</label>
                        <select value={selectedCustomer} onChange={(e) => setSelectedCustomer(e.target.value)} className="input-modern">
                            <option value="">All Customers</option>
                            {customers.map((cust) => (
                                <option key={cust._id} value={cust._id}>{cust.firstName} {cust.lastName}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex-1">
                        <label className="input-label"><Car className="w-3 h-3 inline mr-1" />Vehicle</label>
                        <select value={selectedVehicle} onChange={(e) => setSelectedVehicle(e.target.value)} className="input-modern">
                            <option value="">All Vehicles</option>
                            {vehicles.map((veh) => (
                                <option key={veh._id} value={veh._id}>{veh.brand} {veh.model} — {veh.plateNumber}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex items-end">
                        <button className="btn-secondary" onClick={() => { setSelectedCustomer(''); setSelectedVehicle(''); }}>Reset</button>
                    </div>
                </div>

                {loading ? (
                    <div className="glass-panel p-6 space-y-3">
                        {[...Array(5)].map((_, i) => <div key={i} className="skeleton h-14 rounded-xl" />)}
                    </div>
                ) : (
                    <div className="glass-panel p-6">
                        <DataTable columns={columns} data={filteredBills} searchKey="customer" searchPlaceholder="Search by customer name..." />
                    </div>
                )}
            </div>

            {/* Printable View */}
            {printBill && (
                <div className="fixed inset-0 bg-white dark:bg-surface-900 text-black p-10 z-50 overflow-auto" ref={printRef}>
                    <div className="max-w-2xl mx-auto border-2 border-slate-200 rounded-xl p-10">
                        <div className="flex justify-between items-start mb-8 border-b-2 border-slate-100 pb-6">
                            <div>
                                <h2 className="text-3xl font-black text-slate-900 tracking-tight">INVOICE</h2>
                                <p className="text-sm text-slate-500 mt-1">#{printBill._id.toUpperCase()}</p>
                            </div>
                            <div className="text-right">
                                <p className="font-bold text-slate-800">Vehicle Management System</p>
                                <p className="text-sm text-slate-500">123 Garage Lane</p>
                                <p className="text-sm text-slate-500">Date: {new Date(printBill.date).toLocaleDateString()}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-8 mb-8">
                            <div>
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Billed To</h3>
                                <p className="font-semibold text-slate-800">{printBill.customer?.firstName} {printBill.customer?.lastName}</p>
                                <p className="text-sm text-slate-600">{printBill.customer?.email}</p>
                                <p className="text-sm text-slate-600">{printBill.customer?.phone}</p>
                            </div>
                            <div>
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Vehicle Details</h3>
                                <p className="font-semibold text-slate-800">{printBill.vehicle?.brand} {printBill.vehicle?.model}</p>
                                <p className="text-sm text-slate-600">Plate: {printBill.vehicle?.plateNumber}</p>
                                <p className="text-sm text-slate-600">Year: {printBill.vehicle?.year}</p>
                            </div>
                        </div>

                        <table className="w-full mb-8">
                            <thead>
                                <tr className="border-b-2 border-slate-200 text-left">
                                    <th className="py-3 text-sm font-bold text-slate-700">Description</th>
                                    <th className="py-3 text-sm font-bold text-slate-700 text-right">Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {printBill.services.map((srv, idx) => (
                                    <tr key={idx} className="border-b border-slate-100">
                                        <td className="py-4 text-sm text-slate-800">{srv.description}</td>
                                        <td className="py-4 text-sm text-slate-800 text-right font-medium">${Number(srv.price || 0).toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {Array.isArray(printBill.maintenanceId?.partsUsed) && printBill.maintenanceId.partsUsed.length > 0 && (
                            <div className="mb-8">
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Parts Used (Included in total)</h3>
                                <div className="flex flex-wrap gap-2">
                                    {printBill.maintenanceId.partsUsed.map((part, idx) => (
                                        <span key={idx} className="bg-slate-100 dark:bg-surface-700 text-slate-700 px-3 py-1 rounded text-sm">{part.name}</span>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="flex justify-end border-t-2 border-slate-200 pt-6">
                            <div className="text-right">
                                <span className="text-sm font-bold text-slate-500 uppercase mr-4">Total Amount Due</span>
                                <span className="text-3xl font-black text-slate-900">${Number(printBill.totalPrice || 0).toLocaleString()}</span>
                            </div>
                        </div>

                        {/* Action Buttons (Hidden when printing) */}
                        <div className="flex justify-between gap-3 mt-12 pt-8 border-t border-dashed border-slate-200 no-print">
                            <button onClick={() => setPrintBill(null)} className="btn-secondary flex items-center gap-2"><X className="w-4 h-4"/> Close Preview</button>
                            <button onClick={() => { window.print(); setTimeout(() => setPrintBill(null), 500); }} className="btn-primary flex items-center gap-2"><Printer className="w-4 h-4"/> Print Invoice</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InvoiceList;
