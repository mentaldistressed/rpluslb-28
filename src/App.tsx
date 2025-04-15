import { Toaster } from "@/components/ui/toaster";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { TicketsProvider } from "@/contexts/TicketsContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
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
import DashboardPage from "@/pages/DashboardPage";
import ToolsPage from "@/pages/tools";

// Import Russian locale for date-fns
import { ru } from "date-fns/locale";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-b from-background to-background/50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 bg-primary/5 rounded-full flex items-center justify-center">
            <div className="h-6 w-6 border-t-2 border-primary animate-spin rounded-full" />
          </div>
          <span className="text-sm text-muted-foreground">загрузка...</span>
        </div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-b from-background to-background/50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 bg-primary/5 rounded-full flex items-center justify-center">
            <div className="h-6 w-6 border-t-2 border-primary animate-spin rounded-full" />
          </div>
          <span className="text-sm text-muted-foreground">загрузка...</span>
        </div>
      </div>
    );
  }
  
  if (!user || user.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="light" storageKey="rplus-theme">
      <BrowserRouter>
        <AuthProvider>
          <TicketsProvider>
            <MainLayout>
              <Routes>
                {/* Redirect root to login or dashboard */}
                <Route path="/" element={<Navigate to="/login" replace />} />
                <Route path="/login" element={<LoginPage />} />
                
                {/* Protected routes */}
                <Route 
                  path="/dashboard" 
                  element={
                    <ProtectedRoute>
                      <DashboardPage />
                    </ProtectedRoute>
                  } 
                />

                <Route 
                  path="/tickets" 
                  element={
                    <ProtectedRoute>
                      <TicketsPage />
                    </ProtectedRoute>
                  } 
                />

                <Route 
                  path="/tools" 
                  element={
                    <ProtectedRoute>
                      <ToolsPage />
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
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
