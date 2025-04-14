
import { Toaster } from "@/components/ui/toaster";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { TicketsProvider } from "@/contexts/TicketsContext";
import MainLayout from "@/components/Layouts/MainLayout";

import LoginPage from "@/pages/LoginPage";
import TicketsPage from "@/pages/TicketsPage";
import NewTicketPage from "@/pages/NewTicketPage";
import TicketDetailPage from "@/pages/TicketDetailPage";
import UsersPage from "@/pages/UsersPage";
import SettingsPage from "@/pages/SettingsPage";
import NotFoundPage from "@/pages/NotFoundPage";
import FinancesPage from "@/pages/FinancesPage";
import MaintenancePage from "@/pages/MaintenancePage";
import ReleasesPage from "@/pages/ReleasesPage";

// Import Russian locale for date-fns
import { ru } from "date-fns/locale";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return <div className="flex h-screen items-center justify-center">загрузка...</div>;
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return <div className="flex h-screen items-center justify-center">загрузка...</div>;
  }
  
  if (!user || user.role !== 'admin') {
    return <Navigate to="/releases" replace />;
  }
  
  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <AuthProvider>
        <TicketsProvider>
          <MainLayout>
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<LoginPage />} />
              
              {/* Protected routes */}
              <Route path="/" element={<Navigate to="/releases" replace />} />
              
              <Route 
                path="/tickets" 
                element={
                  <ProtectedRoute>
                    <TicketsPage />
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/releases" 
                element={
                  <ProtectedRoute>
                    <ReleasesPage />
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/tickets/new" 
                element={
                  <ProtectedRoute>
                    <NewTicketPage />
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/tickets/:ticketId" 
                element={
                  <ProtectedRoute>
                    <TicketDetailPage />
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/users" 
                element={
                  <AdminRoute>
                    <UsersPage />
                  </AdminRoute>
                } 
              />

              <Route 
                path="/finances" 
                element={
                  <ProtectedRoute>
                    <FinancesPage />
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/settings" 
                element={
                  <ProtectedRoute>
                    <SettingsPage />
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/maintenance" 
                element={<MaintenancePage />} 
              />
              
              {/* Catch-all route */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </MainLayout>
          <Toaster />
        </TicketsProvider>
      </AuthProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
