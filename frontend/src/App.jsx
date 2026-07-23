import { Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Vehicles from "./pages/Vehicles";
import AddVehicle from "./pages/AddVehicle";
import ProtectedRoute from "./components/ProtectedRoute";
import MaintenanceList from "./pages/MaintenanceList";
import InvoiceList from './pages/invoices/InvoiceList';
import AddBill from './pages/invoices/AddBill';
import EditBill from './pages/invoices/EditBill';
import InvoicesPage from './pages/invoices/InvoicesPage';
import EditMaintenance from "./pages/EditMaintenance";
import ArchivedInvoices from "./pages/invoices/ArchivedInvoices";
import Dashboard from "./pages/Dashboard";
import AddPartOrder from "./pages/AddPartOrder";
import Booking from "./pages/Booking";
import Reports from "./pages/Reports";
import RequestAssistance from "./pages/roadside/RequestAssistance";
import MyAssistanceRequests from "./pages/roadside/MyAssistanceRequests";
import AssistanceDashboard from "./pages/roadside/AssistanceDashboard";
import AssignedJobs from "./pages/roadside/AssignedJobs";
import PredictiveMaintenance from "./pages/PredictiveMaintenance";
import FleetIntelligence from "./pages/FleetIntelligence";
import LiveMap from "./pages/LiveMap";
import ApiDocs from "./pages/ApiDocs";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route
        path="/vehicles"
        element={
          <ProtectedRoute>
            <Vehicles />
          </ProtectedRoute>
        }
      />
      <Route
        path="/live-map"
        element={
          <ProtectedRoute>
            <LiveMap />
          </ProtectedRoute>
        }
      />
      <Route
        path="/api-docs"
        element={
          <ProtectedRoute>
            <ApiDocs />
          </ProtectedRoute>
        }
      />
      <Route
        path="/vehicles/new"
        element={
          <ProtectedRoute>
            <AddVehicle />
          </ProtectedRoute>
        }
      />
      <Route
        path="/maintenance"
        element={
          <ProtectedRoute>
            <MaintenanceList />
          </ProtectedRoute>
        }
      />
      <Route
        path="/invoices"
        element={
          <ProtectedRoute>
            <InvoiceList />
          </ProtectedRoute>
        }
      />
      <Route
        path="/InvoicesPage"
        element={
          <ProtectedRoute>
            <InvoicesPage />
          </ProtectedRoute>
        }
      />

      <Route path="/add-bill"
        element={
          <ProtectedRoute>
            <AddBill />
          </ProtectedRoute>}
      />
      <Route path="/edit-bill/:id"
        element={
          <ProtectedRoute>
            <EditBill />
          </ProtectedRoute>}
      />
      <Route
        path="/edit-maintenance/:id"
        element={
          <ProtectedRoute>
            <EditMaintenance />
          </ProtectedRoute>
        }
      />
      <Route
        path="/invoices/archived"
        element={
          <ProtectedRoute>
            <ArchivedInvoices />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/booking"
        element={
          <ProtectedRoute>
            <Booking />
          </ProtectedRoute>
        }
      />
      <Route
        path="/parts/:id/order"
        element={
          <ProtectedRoute>
            <AddPartOrder />
          </ProtectedRoute>
        }
      />
      <Route
        path="/reports"
        element={
          <ProtectedRoute>
            <Reports />
          </ProtectedRoute>
        }
      />
      <Route
        path="/request-assistance"
        element={
          <ProtectedRoute>
            <RequestAssistance />
          </ProtectedRoute>
        }
      />
      <Route
        path="/my-requests"
        element={
          <ProtectedRoute>
            <MyAssistanceRequests />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dispatch"
        element={
          <ProtectedRoute>
            <AssistanceDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/assigned-jobs"
        element={
          <ProtectedRoute>
            <AssignedJobs />
          </ProtectedRoute>
        }
      />
      <Route
        path="/predictive-maintenance"
        element={
          <ProtectedRoute>
            <PredictiveMaintenance />
          </ProtectedRoute>
        }
      />
      <Route
        path="/fleet-intelligence"
        element={
          <ProtectedRoute>
            <FleetIntelligence />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default App;

