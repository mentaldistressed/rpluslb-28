
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format, addMinutes } from "date-fns";
import { ru } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { 
  ShieldAlert, 
  Clock, 
  RefreshCw, 
  AlertTriangle,
  ArrowRight
} from "lucide-react";

interface MaintenanceSettings {
  enabled: boolean;
  endTime: string;
  message: string;
}

export default function MaintenancePage() {
  const [message, setMessage] = useState("проводятся технические работы. личный кабинет временно недоступен.");
  const [endTime, setEndTime] = useState<Date | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);

  useEffect(() => {
    const fetchMaintenanceSettings = async () => {
      try {
        const { data, error } = await supabase
          .from('system_settings')
          .select('*')
          .eq('key', 'maintenance_mode')
          .single();

        if (!error && data && data.value) {
          const settings = JSON.parse(data.value) as MaintenanceSettings;
          setMessage(settings.message || "проводятся технические работы. личный кабинет временно недоступен.");
          
          if (settings.endTime) {
            const parsedEndTime = new Date(settings.endTime);
            setEndTime(parsedEndTime);
          } else {
            // If no end time is set, default to 30 minutes from now
            setEndTime(addMinutes(new Date(), 30));
          }
        }
      } catch (error) {
        console.error("Error fetching maintenance settings:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMaintenanceSettings();
  }, []);

  // Update the countdown timer
  useEffect(() => {
    if (!endTime) return;
    
    const updateTimeRemaining = () => {
      const now = new Date();
      
      if (endTime > now) {
        const formattedDistance = format(endTime, "HH:mm", { locale: ru });
        setTimeRemaining(formattedDistance);
      } else {
        setTimeRemaining("скоро");
      }
    };
    
    updateTimeRemaining();
    const interval = setInterval(updateTimeRemaining, 60000); // Update every minute
    
    return () => clearInterval(interval);
  }, [endTime]);

  const handleCheckAvailability = () => {
    setIsCheckingAvailability(true);
    
    // Simulate checking availability
    setTimeout(() => {
      setIsCheckingAvailability(false);
      window.location.replace('/');
    }, 1500);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 p-6 flex flex-col items-center justify-center">
        <div className="w-full max-w-md space-y-6">
          <Skeleton className="h-12 w-12 rounded-full mx-auto" />
          <Skeleton className="h-8 w-3/4 mx-auto" />
          <Skeleton className="h-32 w-full rounded-lg" />
          <Skeleton className="h-10 w-full rounded-md" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6">
      <div className="max-w-md mx-auto pt-10 md:pt-20">
        {/* Header with Alert Icon */}
        <div className="flex items-center justify-center mb-8">
          <div className="relative">
            <div className="absolute inset-0 animate-pulse bg-yellow-200 rounded-full opacity-20"></div>
            <AlertTriangle size={50} className="text-yellow-500 relative z-10" />
          </div>
        </div>
        
        {/* Main Content */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden animate-fade-in">
          {/* Status Header */}
          <div className="bg-slate-800 p-4 flex items-center">
            <ShieldAlert className="text-yellow-400 mr-3" />
            <h1 className="text-white font-semibold">Техническое обслуживание</h1>
          </div>
          
          {/* Message */}
          <div className="p-6">
            <p className="text-slate-700 mb-6">{message}</p>
            
            {/* Estimated time section */}
            <div className="mb-6 bg-slate-50 rounded-lg p-4 border border-slate-100">
              <div className="flex items-center justify-between text-sm text-slate-600 mb-2">
                <div className="flex items-center">
                  <Clock className="mr-2 h-4 w-4 text-slate-400" />
                  <span>Ориентировочное время завершения</span>
                </div>
              </div>
              
              <div className="text-center">
                <span className="text-2xl font-mono text-slate-800">
                  {endTime ? format(endTime, "dd.MM.yyyy • HH:mm", { locale: ru }) : "--:--"}
                </span>
              </div>
            </div>
            
            <Separator className="my-6" />
            
            {/* Action button */}
            <Button 
              onClick={handleCheckAvailability} 
              disabled={isCheckingAvailability}
              className="w-full"
            >
              {isCheckingAvailability ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Проверка...
                </>
              ) : (
                <>
                  Проверить доступность
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </div>
          
          {/* Footer */}
          <div className="bg-slate-50 p-3 text-center border-t border-slate-100">
            <p className="text-xs text-slate-500">© ЛКПО · {new Date().getFullYear()}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
