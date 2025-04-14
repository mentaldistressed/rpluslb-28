
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Wrench, Clock, ExternalLink, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format, formatDistance } from "date-fns";
import { ru } from "date-fns/locale";

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
        setTimeRemaining(
          formatDistance(endTime, now, { 
            addSuffix: false,
            locale: ru 
          })
        );
      } else {
        setTimeRemaining("скоро");
      }
    };
    
    updateTimeRemaining();
    const interval = setInterval(updateTimeRemaining, 60000); // Update every minute
    
    return () => clearInterval(interval);
  }, [endTime]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const handleCheckAvailability = () => {
    window.location.replace('/');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-6">
          <div className="rounded-full bg-primary/10 p-5 w-20 h-20 flex items-center justify-center mb-4 animate-fade-in">
            <Wrench className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">
            технические работы
          </h1>
        </div>
        
        <Card className="border-0 shadow-lg overflow-hidden animate-fade-in">
          <CardContent className="p-0">
            <div className="bg-white p-6 border-b border-slate-100">
              <p className="text-slate-600 text-center">{message}</p>
              
              {endTime && (
                <div className="mt-6 space-y-4">
                  <div className="bg-slate-50 rounded-lg p-5 border border-slate-100">
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center text-sm text-slate-500">
                        <Clock className="mr-2 h-4 w-4 text-slate-400" />
                        примерное время ожидания
                      </div>
                      <div className="text-xs text-slate-400 font-mono">
                        {format(endTime, "dd.MM.yyyy HH:mm", { locale: ru })}
                      </div>
                    </div>
                    
                    <div className="text-2xl font-bold text-slate-800 text-center">
                      {timeRemaining}
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="bg-slate-50 p-6">
              <Button
                onClick={handleCheckAvailability}
                variant="outline"
                className="w-full group hover:bg-primary hover:text-white transition-colors"
              >
                <span>проверить доступность</span>
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
              
              <div className="mt-4 text-center">
                <p className="text-primary text-sm font-medium">ЛКПО</p>
                <p className="text-xs text-slate-400">© rplus</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
