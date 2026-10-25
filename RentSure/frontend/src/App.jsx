
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./AuthContext";
import ProtectedRoute from "./ProtectedRoute";
import AuthPage from "./AuthPage";
import DashboardPage from "./DashboardPage";
import PropertiesPage from "./PropertiesPage";
import LandlordPropertiesPage from "./LandlordPropertiesPage";
import Home from "./Home";
import PropertyDetailsPage from "./PropertyDetailsPage";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public pages */}
          <Route path="/" element={<Home />} />
          <Route
            path="/properties/:id"
            element={<PropertyDetailsPage />}
          />
          <Route path="/properties" element={<PropertiesPage />} />

          {/* Login and registration */}
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

            {/* Landlord property management */}
            <Route
              path="/my-properties"
              element={<LandlordPropertiesPage />}
            />
            <Route
              path="/landlord/properties"
              element={<LandlordPropertiesPage />}
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
