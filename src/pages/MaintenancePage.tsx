
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Wrench, Clock, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format, formatDistance } from "date-fns";
import { ru } from "date-fns/locale";

interface MaintenanceSettings {
  enabled: boolean;
  endTime: string;
  message: string;
}

export default function MaintenancePage() {
  const [message, setMessage] = useState("Проводятся технические работы. Личный кабинет временно недоступен.");
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
          setMessage(settings.message || "Проводятся технические работы. Личный кабинет временно недоступен.");
          
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

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-blue-50 to-indigo-50 p-4">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute left-1/4 top-1/4 w-32 h-32 rounded-full bg-purple-200 opacity-30 animate-pulse" style={{ animationDuration: '4s' }}></div>
        <div className="absolute right-1/4 bottom-1/4 w-40 h-40 rounded-full bg-blue-200 opacity-30 animate-pulse" style={{ animationDuration: '6s' }}></div>
        <div className="absolute left-1/3 bottom-1/3 w-24 h-24 rounded-full bg-indigo-200 opacity-30 animate-pulse" style={{ animationDuration: '5s' }}></div>
      </div>
      
      <div className="w-full max-w-md z-10 animate-fade-in">
        <div className="mx-auto bg-primary/10 p-5 rounded-full w-24 h-24 flex items-center justify-center mb-6 shadow-md">
          <Wrench className="h-10 w-10 text-primary animate-pulse" style={{ animationDuration: '3s' }} />
        </div>
        
        <Card className="w-full max-w-md shadow-xl border border-indigo-100 backdrop-blur-sm bg-white/90">
          <CardHeader className="text-center pb-2 border-b border-indigo-50">
            <CardTitle className="text-2xl bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              технические работы
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-6 pt-6">
            <p className="text-slate-700 leading-relaxed">{message}</p>
            
            {endTime && (
              <div className="space-y-4 py-2">
                <div className="w-full bg-indigo-50 rounded-lg p-4">
                  <div className="flex items-center justify-center gap-2 text-sm text-indigo-700 font-medium mb-2">
                    <Clock className="h-4 w-4" />
                    <span>примерное время ожидания:</span>
                  </div>
                  <div className="text-2xl font-bold text-indigo-800">{timeRemaining}</div>
                </div>
                
                <div className="text-sm text-slate-600">
                  планируемое окончание:<br />
                  <span className="font-medium text-slate-700">{format(endTime, "dd.MM.yyyy HH:mm", { locale: ru })}</span>
                </div>
              </div>
            )}
            
            <div className="pt-4 border-t border-indigo-50 text-sm text-slate-500 space-y-2">
              <p className="text-indigo-600 font-medium">© rplus</p>
              <p>ЛКПО</p>
              
              <Button
                variant="ghost"
                size="sm"
                className="mt-4 text-xs text-slate-500 hover:text-indigo-600"
                onClick={() => window.location.reload()}
              >
                <div className="flex items-center gap-1">
                  <span>проверить доступность</span>
                  <ExternalLink className="h-3 w-3" />
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
