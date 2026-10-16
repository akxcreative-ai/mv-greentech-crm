import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, ProtectedRoute } from './contexts/AuthContext';

// Layout
import { AppLayout } from './components/layout/AppLayout';

// Pages
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { LeadsPage } from './pages/LeadsPage';
import { LeadDetailPage } from './pages/LeadDetailPage';
import { CustomersPage } from './pages/CustomersPage';
import { CustomerDetailPage } from './pages/CustomerDetailPage';
import { FollowUpsPage } from './pages/FollowUpsPage';
import { CustomerVisitsPage } from './pages/CustomerVisitsPage';
import { ItemMasterPage } from './pages/ItemMasterPage';
import { QuotationsPage } from './pages/QuotationsPage';
import { CreateQuotationPage } from './pages/CreateQuotationPage';
import { QuotationDetailPage } from './pages/QuotationDetailPage';
import { OrdersPage } from './pages/OrdersPage';
import { SalesTargetsPage } from './pages/SalesTargetsPage';
import { ReportsPage } from './pages/ReportsPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { UserManagementPage } from './pages/UserManagementPage';
import { SettingsPage } from './pages/SettingsPage';
import { AuditLogsPage } from './pages/AuditLogsPage';
import { MastersPage } from './pages/MastersPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 60 * 1000,
    },
  },
});

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Auth Route */}
            <Route path="/login" element={<LoginPage />} />

            {/* Protected CRM App Layout */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="leads" element={<LeadsPage />} />
              <Route path="leads/:id" element={<LeadDetailPage />} />
              <Route path="customers" element={<CustomersPage />} />
              <Route path="customers/:id" element={<CustomerDetailPage />} />
              <Route path="visits" element={<CustomerVisitsPage />} />
              <Route path="follow-ups" element={<FollowUpsPage />} />
              <Route path="items" element={<ItemMasterPage />} />
              <Route path="quotations" element={<QuotationsPage />} />
              <Route path="quotations/create" element={<CreateQuotationPage />} />
              <Route path="quotations/:id" element={<QuotationDetailPage />} />
              <Route path="orders" element={<OrdersPage />} />
              <Route path="targets" element={<SalesTargetsPage />} />
              <Route path="reports" element={<ReportsPage />} />
              <Route path="notifications" element={<NotificationsPage />} />
              <Route
                path="users"
                element={
                  <ProtectedRoute allowedRoles={['DIRECTOR', 'ADMINISTRATOR']}>
                    <UserManagementPage />
                  </ProtectedRoute>
                }
              />
              <Route path="masters" element={<MastersPage />} />
              <Route
                path="audit-logs"
                element={
                  <ProtectedRoute allowedRoles={['DIRECTOR', 'ADMINISTRATOR']}>
                    <AuditLogsPage />
                  </ProtectedRoute>
                }
              />
              <Route path="settings" element={<SettingsPage />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
