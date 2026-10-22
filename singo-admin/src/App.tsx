import { BrowserRouter, Routes, Route } from "react-router-dom";

import Welcome from "./pages/Welcome";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Tracking from "./pages/Tracking";

import CompanyLogin from "./pages/company/CompanyLogin";
import CompanyRegister from "./pages/company/CompanyRegister";
import CompanyDashboard from "./pages/company/CompanyDashboard";
import CreateDelivery from "./pages/company/CreateDelivery";
import CompanySettlements from "./pages/company/CompanySettlements";
import CompanyTracking from "./pages/company/CompanyTracking";

import DriverLogin from "./pages/driver/DriverLogin";
import DriverRegister from "./pages/driver/DriverRegister";
import DriverDashboard from "./pages/driver/DriverDashboard";
import DriverSettlements from "./pages/driver/DriverSettlements";

import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminSettlements from "./pages/admin/AdminSettlements";
import AdminManageSettlements from "./pages/admin/AdminManageSettlements";
import AdminTracking from "./pages/admin/AdminTracking";
import Analytics from "./pages/Analytics";
import DriversPage from "./pages/admin/Drivers";
import CompaniesPage from "./pages/admin/Companies";
import DeliveriesPage from "./pages/admin/Deliveries";
import BranchesPage from "./pages/admin/Branches";

import ProtectedRoute from "./router/ProtectedRoute";


function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* PUBLIC ROUTES */}
        <Route path="/" element={<Welcome />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register-admin" element={<Register />} />
        <Route path="/tracking" element={<Tracking />} />

        {/* COMPANY ROUTES */}
        <Route path="/company/login" element={<CompanyLogin />} />
        <Route path="/company/register" element={<CompanyRegister />} />
        <Route
          path="/company"
          element={
            <ProtectedRoute role="COMPANY">
              <CompanyDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/company/create-delivery"
          element={
            <ProtectedRoute role="COMPANY">
              <CreateDelivery />
            </ProtectedRoute>
          }
        />
        <Route
          path="/company/settlements"
          element={
            <ProtectedRoute role="COMPANY">
              <CompanySettlements />
            </ProtectedRoute>
          }
        />
        <Route
          path="/company/tracking"
          element={
            <ProtectedRoute role="COMPANY">
              <CompanyTracking />
            </ProtectedRoute>
          }
        />

        {/* DRIVER ROUTES */}
        <Route path="/driver/login" element={<DriverLogin />} />
        <Route path="/driver/register" element={<DriverRegister />} />
        <Route
          path="/driver"
          element={
            <ProtectedRoute role="DRIVER">
              <DriverDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/driver/settlements"
          element={
            <ProtectedRoute role="DRIVER">
              <DriverSettlements />
            </ProtectedRoute>
          }
        />

        {/* ADMIN ROUTES */}
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute role="ADMIN">
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/dashboard/companies"
          element={
            <ProtectedRoute role="ADMIN">
              <CompaniesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/dashboard/drivers"
          element={
            <ProtectedRoute role={["ADMIN", "BRANCH_ADMIN"]}>
              <DriversPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/dashboard/branches"
          element={
            <ProtectedRoute role="ADMIN">
              <BranchesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/dashboard/deliveries"
          element={
            <ProtectedRoute role={["ADMIN", "BRANCH_ADMIN"]}>
              <DeliveriesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/dashboard/create-delivery"
          element={
            <ProtectedRoute role="ADMIN">
              <CreateDelivery />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/dashboard/settlements"
          element={
            <ProtectedRoute role="ADMIN">
              <AdminSettlements />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/dashboard/manage-settlements"
          element={
            <ProtectedRoute role="ADMIN">
              <AdminManageSettlements />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/dashboard/analytics"
          element={
            <ProtectedRoute role="ADMIN">
              <Analytics />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/dashboard/tracking"
          element={
            <ProtectedRoute role="ADMIN">
              <AdminTracking />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;