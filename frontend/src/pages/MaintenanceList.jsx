import { useEffect, useState } from "react";
import axios from "../utils/axiosInstance";
import ConfirmModal from "../components/ConfirmModal";
import AddMaintenanceModal from "../components/AddMaintenanceModal";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import InvoiceModal from "../components/InvoiceModal";
import { motion, AnimatePresence } from "framer-motion";
import { PenTool as Tool, Plus, Calendar, FileText, Edit, Wrench, Package, ChevronDown, ChevronUp } from "lucide-react";
import { DataTable } from "../ui/DataTable";
import { Button } from "../ui/Button";

const STATUS_DOT = {
  active:    'bg-success-500',
  pending:   'bg-warning-500',
  completed: 'bg-brand-500',
};

export default function MaintenanceList() {
  const [records, setRecords] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [recordToDelete, _setRecordToDelete] = useState(null);
  const [invoiceModalVisible, setInvoiceModalVisible] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [expanded, setExpanded] = useState(null);
  const navigate = useNavigate();

  const fetchRecords = async () => {
    try {
      const res = await axios.get("/api/maintenance");
      setRecords(res.data);
    } catch (err) { toast.error("Failed to fetch maintenance records"); }
  };

  const fetchVehicles = async () => {
    try {
      const res = await axios.get("/api/vehicles");
      setVehicles(res.data);
    } catch (err) { toast.error("Failed to fetch vehicles"); }
  };

  useEffect(() => {
    Promise.all([fetchRecords(), fetchVehicles()]).finally(() => setLoading(false));
  }, []);

  const handleDelete = async () => {
    try {
      await axios.delete(`/api/maintenance/${recordToDelete._id}`);
      setRecords(prev => prev.filter(r => r._id !== recordToDelete._id));
      toast.success("Record deleted");
      setConfirmVisible(false);
    } catch (err) { toast.error("Failed to delete record"); }
  };

  const handleAdd = (newRecord) => { setRecords(prev => [...prev, newRecord]); };

  const columns = [
    {
      id: "vehicle", header: "Vehicle",
      accessorFn: (row) => `${row.vehicleId?.brand || ""} ${row.vehicleId?.model || ""}`,
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-brand-50 dark:bg-brand-500/10 flex items-center justify-center flex-shrink-0">
            <Wrench className="w-4 h-4 text-brand-500" />
          </div>
          <span className="font-medium text-surface-900 dark:text-surface-100 text-sm">
            {row.original.vehicleId?.brand || "Unknown"} {row.original.vehicleId?.model || ""}
          </span>
        </div>
      ),
    },
    {
      id: "date", header: "Service Date",
      accessorFn: (row) => row.serviceDate,
      cell: ({ row }) => (
        <div className="flex items-center gap-2 text-sm text-surface-600 dark:text-surface-400">
          <Calendar className="w-4 h-4 text-brand-400" />
          {new Date(row.original.serviceDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </div>
      ),
    },
    {
      id: "services", header: "Services",
      cell: ({ row }) => (
        <span className="badge badge-warning">
          <Wrench className="w-3 h-3" /> {row.original.services.length} services
        </span>
      ),
    },
    {
      id: "parts", header: "Parts Used",
      cell: ({ row }) => (
        <span className="badge badge-brand">
          <Package className="w-3 h-3" /> {row.original.partsUsed?.length || 0} parts
        </span>
      ),
    },
    {
      id: "actions", header: "",
      cell: ({ row }) => {
        const record = row.original;
        return (
          <div className="flex items-center gap-2 justify-end">
            <Button variant="secondary" size="sm" onClick={() => navigate(`/edit-maintenance/${record._id}`)}>
              <Edit className="w-3.5 h-3.5" />
            </Button>
            <Button variant="secondary" size="sm" onClick={async () => {
              try {
                const res = await axios.get(`/api/bills/by-maintenance/${record._id}`);
                setSelectedInvoice(res.data);
                setInvoiceModalVisible(true);
              } catch (err) { toast.error("No invoice found for this record."); }
            }}>
              <FileText className="w-3.5 h-3.5" />
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="p-6 pb-12">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="glass-panel p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-warning-500 to-warning-600 flex items-center justify-center shadow-[0_0_20px_rgba(245,158,11,0.4)]">
                <Tool className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-display font-bold text-surface-900 dark:text-white">Maintenance Records</h1>
                <p className="text-surface-500 text-sm mt-0.5">
                  {loading ? '...' : `${records.length} service records`}
                </p>
              </div>
            </div>
            <button onClick={() => setShowModal(true)} className="btn-primary">
              <Plus className="w-4 h-4" /> Add Record
            </button>
          </div>
        </motion.div>

        {/* Stats Row */}
        {!loading && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-3 gap-4">
            {[
              { label: 'Total Records',   value: records.length,                                              color: 'text-brand-500',   bg: 'bg-brand-50 dark:bg-brand-500/10'   },
              { label: 'This Month',      value: records.filter(r => new Date(r.serviceDate).getMonth() === new Date().getMonth()).length, color: 'text-warning-500', bg: 'bg-warning-50 dark:bg-warning-500/10' },
              { label: 'Total Parts Used',value: records.reduce((acc, r) => acc + (r.partsUsed?.length || 0), 0), color: 'text-success-500', bg: 'bg-success-50 dark:bg-success-500/10' },
            ].map((s) => (
              <div key={s.label} className={`glass-card p-4 text-center ${s.bg}`}>
                <p className={`text-2xl font-display font-bold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-surface-500 font-medium mt-0.5">{s.label}</p>
              </div>
            ))}
          </motion.div>
        )}

        {/* Table */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-panel p-6">
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => <div key={i} className="skeleton h-14 rounded-xl" />)}
            </div>
          ) : (
            <DataTable columns={columns} data={records} searchKey="vehicle" searchPlaceholder="Search by vehicle..." />
          )}
        </motion.div>
      </div>

      <AddMaintenanceModal visible={showModal} onClose={() => setShowModal(false)} vehicles={vehicles} onSave={handleAdd} />
      <ConfirmModal visible={confirmVisible} title="Delete Record" message="Delete this maintenance record? This cannot be undone." onConfirm={handleDelete} onCancel={() => setConfirmVisible(false)} />
      <InvoiceModal visible={invoiceModalVisible} invoice={selectedInvoice} onClose={() => setInvoiceModalVisible(false)} />
    </div>
  );
}
