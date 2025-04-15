
import { ReactNode, useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Toaster } from "@/components/ui/toaster";
import Header from "./Header";
import Sidebar from "./Sidebar";
import { NewsBanner } from "@/components/NewsBanner";
import { supabase } from "@/integrations/supabase/client";
import MaintenancePage from "@/pages/MaintenancePage";
import { Loader2 } from "lucide-react";

interface MaintenanceSettings {
  enabled: boolean;
  endTime: string;
  message: string;
}

interface MainLayoutProps {
  children: ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const { user } = useAuth();
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [isCheckingMaintenance, setIsCheckingMaintenance] = useState(true);

  // Check if maintenance mode is enabled
  useEffect(() => {
    const checkMaintenanceMode = async () => {
      try {
        const { data, error } = await supabase
          .from('system_settings')
          .select('*')
          .eq('key', 'maintenance_mode')
          .single();

        if (!error && data && data.value) {
          const settings = JSON.parse(data.value) as MaintenanceSettings;
          setMaintenanceMode(settings.enabled);
        } else {
          setMaintenanceMode(false);
        }
      } catch (error) {
        console.error("Error checking maintenance mode:", error);
        setMaintenanceMode(false);
      } finally {
        setIsCheckingMaintenance(false);
      }
    };

    checkMaintenanceMode();

    // Subscribe to changes in the system_settings table
    const subscription = supabase
      .channel('system_settings_changes')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'system_settings',
        filter: 'key=eq.maintenance_mode'
      }, (payload) => {
        if (payload.new && payload.new.value) {
          try {
            const settings = JSON.parse(payload.new.value as string) as MaintenanceSettings;
            setMaintenanceMode(settings.enabled);
          } catch (e) {
            console.error("Error parsing maintenance settings update:", e);
          }
        }
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Show loading state while checking maintenance mode
  if (isCheckingMaintenance) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary/70" />
          <span className="text-sm text-muted-foreground">загрузка...</span>
        </div>
        <Toaster />
      </div>
    );
  }

  // Show maintenance page for non-admin users when in maintenance mode
  if (maintenanceMode && user && user.role !== 'admin') {
    return <MaintenancePage />;
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        {children}
        <Toaster />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <div className="flex flex-col flex-1">
        <div className="flex flex-1">
          <Sidebar />
          <main className="flex-1 p-6 overflow-auto animate-fade-in">
            <div className="mb-4 max-w-7xl mx-auto">
              <NewsBanner />
            </div>
            <div className="max-w-7xl mx-auto">
              {children}
            </div>
          </main>
        </div>
      </div>
      <Toaster />
    </div>
  );
}
