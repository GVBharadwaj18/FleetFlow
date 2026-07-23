import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import AppShell from "./AppShell";
import { jwtDecode } from "jwt-decode";

export default function ProtectedRoute({ children }) {
  const { auth } = useAuth();
  const location = useLocation();

  if (!auth?.token) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // Safely check JWT expiration for real tokens without throwing on demo tokens
  if (auth.token && !auth.token.startsWith("demo_token")) {
    try {
      const decoded = jwtDecode(auth.token);
      if (decoded && decoded.exp && decoded.exp * 1000 < Date.now()) {
        localStorage.removeItem("auth");
        return <Navigate to="/" replace />;
      }
    } catch (err) {
      // Custom or non-standard token format: allow access gracefully
    }
  }

  if (location.pathname === "/") {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <AppShell>
      {children}
    </AppShell>
  );
}
