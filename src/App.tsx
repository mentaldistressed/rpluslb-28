
import { Toaster } from "@/components/ui/toaster";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { TicketsProvider } from "@/contexts/TicketsContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import MainLayout from "@/components/Layouts/MainLayout";
import { lazy as ReactLazy, Suspense } from 'react';

import LoginPage from "@/pages/LoginPage";
import TicketsPage from "@/pages/TicketsPage";
import NewTicketPage from "@/pages/NewTicketPage";
import TicketDetailPage from "@/pages/TicketDetailPage";
import UsersPage from "@/pages/UsersPage";
import SettingsPage from "@/pages/SettingsPage";
import NotFoundPage from "@/pages/NotFoundPage";
import FinancesPage from "@/pages/FinancesPage";
import MaintenancePage from "@/pages/MaintenancePage";
import DashboardPage from "@/pages/DashboardPage";

// Lazy-loaded components
const ToolsPage = ReactLazy(() => import('@/pages/tools/'));
const LyricsSyncPage = ReactLazy(() => import('@/pages/tools/sync'));
const LyricsSyncEditor = ReactLazy(() => import('@/pages/tools/sync/editor'));

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
    return <Navigate to="/tickets" replace />;
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
                <Route path="/" element={<Navigate to="/login" replace />} />
                <Route path="/login" element={<LoginPage />} />
                
                <Route 
                  path="/dashboard" 
                  element={
                    <AdminRoute>
                      <DashboardPage />
                    </AdminRoute>
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
                    <AdminRoute>
                      <Suspense fallback={<div>загрузка...</div>}>
                        <ToolsPage />
                      </Suspense>
                    </AdminRoute>
                  } 
                />
                
                <Route 
                  path="/tools/sync" 
                  element={
                    <ProtectedRoute>
                      <Suspense fallback={<div>загрузка...</div>}>
                        <LyricsSyncPage />
                      </Suspense>
                    </ProtectedRoute>
                  } 
                />
                
                <Route 
                  path="/tools/sync/editor" 
                  element={
                    <ProtectedRoute>
                      <Suspense fallback={<div>загрузка...</div>}>
                        <LyricsSyncEditor />
                      </Suspense>
                    </ProtectedRoute>
                  } 
                />
                
                <Route 
                  path="/tickets/new" 
                  element={
                    <AdminRoute>
                      <NewTicketPage />
                    </AdminRoute>
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
                    <AdminRoute>
                      <FinancesPage />
                    </AdminRoute>
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
