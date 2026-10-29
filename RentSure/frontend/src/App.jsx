
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./AuthContext";
import ProtectedRoute from "./ProtectedRoute";
import AuthPage from "./AuthPage";
import DashboardPage from "./DashboardPage";
import PropertiesPage from "./PropertiesPage";
import LandlordPropertiesPage from "./LandlordPropertiesPage";
import PropertyDetailsPage from "./PropertyDetailsPage";
import TenantHomePage from "./TenantHomePage";
import TenantUploadsPage from "./TenantUploadsPage";
import Home from "./Home";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public pages */}
          <Route path="/" element={<Home />} />
          <Route path="/properties" element={<PropertiesPage />} />
          <Route
            path="/properties/:id"
            element={<PropertyDetailsPage />}
          />

          {/* Authentication */}
          <Route
            path="/login"
            element={<AuthPage mode="login" />}
          />
          <Route
            path="/register"
            element={<AuthPage mode="register" />}
          />

          {/* Authenticated workspace */}
          <Route element={<ProtectedRoute />}>
            <Route
              path="/dashboard"
              element={<DashboardPage />}
            />

            {/* Landlord workspace */}
            <Route
              path="/landlord/properties"
              element={<LandlordPropertiesPage />}
            />
            <Route
              path="/my-properties"
              element={<LandlordPropertiesPage />}
            />

            {/* Tenant workspace */}
            <Route
              path="/tenant"
              element={<TenantHomePage />}
            />
            <Route
              path="/tenant/home"
              element={<TenantHomePage />}
            />
            <Route
              path="/tenant/uploads"
              element={<TenantUploadsPage />}
            />
          </Route>

          {/* Unknown routes */}
          <Route
            path="*"
            element={<Navigate to="/" replace />}
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
