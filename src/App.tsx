import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "./components/providers/ThemeProvider";
import { MainLayout } from "./components/layout/MainLayout";
import { ProtectedRoute } from "./components/layout/ProtectedRoute";
import { PermissionRoute } from "./components/layout/PermissionRoute";
import { Login } from "./features/auth/Login";
import { Register } from "./features/auth/Register";
import { Dashboard } from "./features/dashboard/Dashboard";
import { PPPoECustomers } from "./features/customers/PPPoECustomers";
import { PPPoEUserDetails } from "./features/customers/PPPoEUserDetails";
import { HotspotCustomers } from "./features/customers/HotspotCustomers";
import { HotspotUserDetails } from "./features/customers/HotspotUserDetails";
import { Settings } from "./features/settings/Settings";
import { Operators } from "./features/operators/Operators";
import { OperatorDetails } from "./features/operators/OperatorDetails";
import { Unauthorized } from "./features/errors/Unauthorized";
import { CustomerMap } from "./features/map/CustomerMap";
import { Packages } from "./features/packages/Packages";
import { PackageDetails } from "./features/packages/PackageDetails";
import { MikroTikRouters } from "./features/routers/MikroTikRouters";
import { RouterDetails } from "./features/routers/RouterDetails";
import { ElectronicPayments } from "./features/payments/ElectronicPayments";
import { ManualPayments } from "./features/payments/ManualPayments";
import { SMSOutbox } from "./features/sms/SMSOutbox";
import { FinanceDashboard } from "./features/finance/FinanceDashboard";
import { Income } from "./features/finance/Income";
import { Expenses } from "./features/finance/Expenses";
import { Reports } from "./features/finance/Reports";
import { SuperAdminDashboard } from "./features/superAdmin/SuperAdminDashboard";
import { TenantDetailsPage } from "./features/superAdmin/TenantDetailsPage";
import { PERMISSIONS } from "./lib/permissions";

function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="easyisp-ui-theme">
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          <Route element={<ProtectedRoute />}>
            <Route element={<MainLayout />}>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={
                <PermissionRoute permission={PERMISSIONS.DASHBOARD_VIEW}>
                  <Dashboard />
                </PermissionRoute>
              } />

              {/* Customer Routes */}
              <Route path="/customers/pppoe" element={
                <PermissionRoute permission={PERMISSIONS.CUSTOMERS_VIEW}>
                  <PPPoECustomers />
                </PermissionRoute>
              } />
              <Route path="/customers/pppoe/:id" element={
                <PermissionRoute permission={PERMISSIONS.CUSTOMERS_VIEW}>
                  <PPPoEUserDetails />
                </PermissionRoute>
              } />
              <Route path="/customers/hotspot" element={
                <PermissionRoute permission={PERMISSIONS.CUSTOMERS_VIEW}>
                  <HotspotCustomers />
                </PermissionRoute>
              } />
              <Route path="/customers/hotspot/:id" element={
                <PermissionRoute permission={PERMISSIONS.CUSTOMERS_VIEW}>
                  <HotspotUserDetails />
                </PermissionRoute>
              } />

              {/* Settings */}
              <Route path="/settings" element={
                <PermissionRoute permission={PERMISSIONS.SETTINGS_GENERAL}>
                  <Settings />
                </PermissionRoute>
              } />

              {/* Team */}
              <Route path="/operators" element={
                <PermissionRoute permission={PERMISSIONS.OPERATORS_VIEW}>
                  <Operators />
                </PermissionRoute>
              } />
              <Route path="/operators/:id" element={
                <PermissionRoute permission={PERMISSIONS.OPERATORS_VIEW}>
                  <OperatorDetails />
                </PermissionRoute>
              } />

              {/* Map */}
              <Route path="/map" element={
                <PermissionRoute permission={PERMISSIONS.DASHBOARD_VIEW}>
                  <CustomerMap />
                </PermissionRoute>
              } />

              {/* Packages */}
              <Route path="/packages" element={
                <PermissionRoute permission={PERMISSIONS.PACKAGES_VIEW}>
                  <Packages />
                </PermissionRoute>
              } />
              <Route path="/packages/:id" element={
                <PermissionRoute permission={PERMISSIONS.PACKAGES_VIEW}>
                  <PackageDetails />
                </PermissionRoute>
              } />

              {/* Routers / NAS */}
              <Route path="/nas" element={
                <PermissionRoute permission={PERMISSIONS.ROUTERS_VIEW}>
                  <MikroTikRouters />
                </PermissionRoute>
              } />
              <Route path="/nas/:id" element={
                <PermissionRoute permission={PERMISSIONS.ROUTERS_VIEW}>
                  <RouterDetails />
                </PermissionRoute>
              } />

              {/* Payments */}
              <Route path="/payments/electronic" element={
                <PermissionRoute permission={PERMISSIONS.PAYMENTS_VIEW}>
                  <ElectronicPayments />
                </PermissionRoute>
              } />
              <Route path="/payments/manual" element={
                <PermissionRoute permission={PERMISSIONS.PAYMENTS_VIEW}>
                  <ManualPayments />
                </PermissionRoute>
              } />

              {/* SMS */}
              <Route path="/sms" element={
                <PermissionRoute permission={PERMISSIONS.SMS_VIEW}>
                  <SMSOutbox />
                </PermissionRoute>
              } />

              {/* Finance */}
              <Route path="/finance" element={
                <PermissionRoute permission={PERMISSIONS.FINANCE_VIEW}>
                  <FinanceDashboard />
                </PermissionRoute>
              } />
              <Route path="/finance/income" element={
                <PermissionRoute permission={PERMISSIONS.FINANCE_VIEW}>
                  <Income />
                </PermissionRoute>
              } />
              <Route path="/finance/expenses" element={
                <PermissionRoute permission={PERMISSIONS.FINANCE_EXPENSES}>
                  <Expenses />
                </PermissionRoute>
              } />
              <Route path="/finance/reports" element={
                <PermissionRoute permission={PERMISSIONS.FINANCE_REPORTS}>
                  <Reports />
                </PermissionRoute>
              } />

              {/* Super Admin */}
              <Route path="/super-admin" element={<SuperAdminDashboard />} />
              <Route path="/super-admin/tenant/:id" element={<TenantDetailsPage />} />

              {/* Add other routes here */}
              <Route path="*" element={<div className="p-4">Page Not Found</div>} />
            </Route>
          </Route>
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
