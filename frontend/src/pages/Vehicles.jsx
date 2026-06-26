import { useEffect, useState } from "react";
import axios from "../utils/axiosInstance";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import { motion, AnimatePresence } from "framer-motion";
import EditVehicleModal from "../components/EditVehicleModal";
import ConfirmModal from "../components/ConfirmModal";
import toast from "react-hot-toast";
import { Car, Plus, Trash2, Edit, User, ChevronDown, ChevronUp, Grid, List, Search } from "lucide-react";
import { DataTable } from "../ui/DataTable";
import { Button } from "../ui/Button";

export default function Vehicles() {
  const [vehicles, setVehicles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [owners, setOwners] = useState([]);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [vehicleToDelete, setVehicleToDelete] = useState(null);
  const [viewMode, setViewMode] = useState('grid');
  const [search, setSearch] = useState('');

  const navigate = useNavigate();
  const { auth } = useAuth();

  const fetchAll = async () => {
    try {
      const [vehiclesRes, categoriesRes, ownersRes] = await Promise.all([
        axios.get("/api/vehicles"),
        axios.get("/api/categories"),
        axios.get("/api/customers"),
      ]);
      setVehicles(vehiclesRes.data);
      setCategories(categoriesRes.data);
      setOwners(ownersRes.data);
    } catch (err) {
      toast.error("Failed to fetch vehicles: " + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const confirmDelete = (vehicle) => { setVehicleToDelete(vehicle); setConfirmVisible(true); };

  const handleConfirmDelete = async () => {
    try {
      await axios.delete(`/api/vehicles/${vehicleToDelete._id}`);
      setVehicles(prev => prev.filter(v => v._id !== vehicleToDelete._id));
      setConfirmVisible(false);
      setVehicleToDelete(null);
      toast.success("Vehicle removed successfully");
    } catch (err) {
      toast.error("Failed to delete: " + (err.response?.data?.message || err.message));
    }
  };

  const handleUpdate = async (updatedVehicle) => {
    try {
      const res = await axios.put(`/api/vehicles/${updatedVehicle._id}`, updatedVehicle);
      const updated = res.data;
      updated.ownerId = owners.find(o => o._id === updated.ownerId);
      updated.categoryId = categories.find(c => c._id === updated.categoryId);
      setVehicles(prev => prev.map(v => v._id === updated._id ? updated : v));
      setShowEditModal(false);
      toast.success("Vehicle updated");
    } catch (err) {
      toast.error("Update failed: " + (err.response?.data?.message || err.message));
    }
  };

  const filtered = vehicles.filter(v =>
    !search ||
    v.brand?.toLowerCase().includes(search.toLowerCase()) ||
    v.model?.toLowerCase().includes(search.toLowerCase()) ||
    v.plateNumber?.toLowerCase().includes(search.toLowerCase())
  );

  const columns = [
    {
      id: 'brand', header: 'Brand / Model',
      accessorFn: (row) => `${row.brand} ${row.model}`,
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-brand-50 dark:bg-brand-500/10 flex items-center justify-center flex-shrink-0">
            <Car className="w-4 h-4 text-brand-500" />
          </div>
          <div>
            <p className="font-semibold text-surface-900 dark:text-surface-100 text-sm">{row.original.brand} {row.original.model}</p>
            <p className="text-xs text-surface-500">{row.original.year}</p>
          </div>
        </div>
      ),
    },
    { accessorKey: 'plateNumber', header: 'Plate', cell: ({ getValue }) => <span className="font-mono text-sm font-semibold tracking-wider px-2.5 py-1 bg-surface-100 dark:bg-surface-800 rounded-lg">{getValue()}</span> },
    {
      id: 'category', header: 'Category',
      cell: ({ row }) => <span className="badge badge-brand">{row.original.categoryId?.name || 'Unknown'}</span>,
    },
    {
      id: 'owner', header: 'Owner',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-accent-100 dark:bg-accent-500/15 flex items-center justify-center text-[10px] font-bold text-accent-600 dark:text-accent-400">
            {row.original.ownerId?.firstName?.charAt(0) || '?'}
          </div>
          <span className="text-sm text-surface-700 dark:text-surface-300">{row.original.ownerId?.firstName} {row.original.ownerId?.lastName}</span>
        </div>
      ),
    },
    {
      id: 'actions', header: '',
      cell: ({ row }) => (
        <div className="flex items-center gap-2 justify-end">
          <Button variant="secondary" size="sm" onClick={() => { setEditingVehicle(row.original); setShowEditModal(true); }}>
            <Edit className="w-3.5 h-3.5" />
          </Button>
          <Button variant="danger" size="sm" onClick={() => confirmDelete(row.original)}>
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-6 pb-12">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Page Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="glass-panel p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-glow-sm">
                <Car className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-display font-bold text-surface-900 dark:text-white">Vehicle Fleet</h1>
                <p className="text-surface-500 text-sm mt-0.5">
                  {loading ? '...' : `${vehicles.length} vehicles registered`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* View toggle */}
              <div className="flex items-center bg-surface-100 dark:bg-surface-800 rounded-xl p-1 gap-1">
                <button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-surface-700 shadow-soft text-brand-600' : 'text-surface-400 hover:text-surface-700'}`}>
                  <Grid className="w-4 h-4" />
                </button>
                <button onClick={() => setViewMode('table')} className={`p-2 rounded-lg transition-all ${viewMode === 'table' ? 'bg-white dark:bg-surface-700 shadow-soft text-brand-600' : 'text-surface-400 hover:text-surface-700'}`}>
                  <List className="w-4 h-4" />
                </button>
              </div>
              <button onClick={() => navigate("/vehicles/new")} className="btn-primary">
                <Plus className="w-4 h-4" /> Add Vehicle
              </button>
            </div>
          </div>
        </motion.div>

        {/* Search Bar */}
        {!loading && viewMode === 'grid' && (
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
            <input
              type="text"
              placeholder="Search by brand, model, or plate..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="input-modern pl-11 w-full md:w-96"
            />
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => <div key={i} className="skeleton h-44 rounded-2xl" />)}
          </div>
        ) : viewMode === 'grid' ? (
          <AnimatePresence>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((vehicle, idx) => (
                <motion.div
                  key={vehicle._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: idx * 0.05 }}
                  className="glass-card p-5 group"
                >
                  {/* Vehicle Card Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-100 to-brand-200 dark:from-brand-500/15 dark:to-brand-700/15 flex items-center justify-center">
                        <Car className="w-6 h-6 text-brand-600 dark:text-brand-400" />
                      </div>
                      <div>
                        <h3 className="font-display font-bold text-surface-900 dark:text-surface-100">{vehicle.brand} {vehicle.model}</h3>
                        <p className="text-xs text-surface-500 mt-0.5">{vehicle.year}</p>
                      </div>
                    </div>
                    <span className="badge badge-brand">{vehicle.categoryId?.name || 'N/A'}</span>
                  </div>

                  {/* Plate */}
                  <div className="flex items-center gap-2 mb-4 px-3 py-2 bg-surface-50 dark:bg-surface-800/60 rounded-xl">
                    <span className="text-xs text-surface-400 font-medium">PLATE</span>
                    <span className="font-mono font-bold text-surface-900 dark:text-surface-100 tracking-widest text-sm">{vehicle.plateNumber}</span>
                  </div>

                  {/* Owner */}
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-6 h-6 rounded-full bg-accent-100 dark:bg-accent-500/15 flex items-center justify-center text-[10px] font-bold text-accent-600 dark:text-accent-400 flex-shrink-0">
                      {vehicle.ownerId?.firstName?.charAt(0) || '?'}
                    </div>
                    <span className="text-sm text-surface-600 dark:text-surface-400">{vehicle.ownerId?.firstName} {vehicle.ownerId?.lastName || 'Unknown Owner'}</span>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-3 border-t border-surface-200/60 dark:border-surface-700/40">
                    <button onClick={() => { setEditingVehicle(vehicle); setShowEditModal(true); }} className="flex-1 px-3 py-2 text-xs font-semibold text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-500/10 hover:bg-brand-100 dark:hover:bg-brand-500/20 rounded-lg transition-colors flex items-center justify-center gap-1.5">
                      <Edit className="w-3.5 h-3.5" /> Edit
                    </button>
                    <button onClick={() => confirmDelete(vehicle)} className="flex-1 px-3 py-2 text-xs font-semibold text-danger-600 dark:text-danger-400 bg-danger-50 dark:bg-danger-500/10 hover:bg-danger-100 dark:hover:bg-danger-500/20 rounded-lg transition-colors flex items-center justify-center gap-1.5">
                      <Trash2 className="w-3.5 h-3.5" /> Remove
                    </button>
                  </div>
                </motion.div>
              ))}

              {filtered.length === 0 && (
                <div className="col-span-full text-center py-16 text-surface-400">
                  <Car className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p className="font-medium">No vehicles found</p>
                  <p className="text-sm mt-1">Try a different search or add a new vehicle</p>
                </div>
              )}
            </div>
          </AnimatePresence>
        ) : (
          <div className="glass-panel p-6">
            <DataTable columns={columns} data={vehicles} searchKey="brand" searchPlaceholder="Search vehicles..." />
          </div>
        )}
      </div>

      <EditVehicleModal visible={showEditModal} vehicle={editingVehicle} categories={categories} owners={owners} onClose={() => setShowEditModal(false)} onSave={handleUpdate} />
      <ConfirmModal visible={confirmVisible} title="Remove Vehicle" message={`Remove the ${vehicleToDelete?.brand} ${vehicleToDelete?.model}? This cannot be undone.`} onConfirm={handleConfirmDelete} onCancel={() => { setConfirmVisible(false); setVehicleToDelete(null); }} />
    </div>
  );
}
