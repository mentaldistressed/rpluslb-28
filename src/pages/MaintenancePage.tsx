
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Tools, Clock } from "lucide-react";
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/20 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto bg-primary/10 p-3 rounded-full w-16 h-16 flex items-center justify-center mb-4">
            <Tools className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">технические работы</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-6">
          <p className="text-muted-foreground">{message}</p>
          
          {endTime && (
            <div className="space-y-2">
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>примерное время ожидания: {timeRemaining}</span>
              </div>
              
              <div className="text-sm text-muted-foreground">
                планируемое окончание: {format(endTime, "dd.MM.yyyy HH:mm", { locale: ru })}
              </div>
            </div>
          )}
          
          <div className="pt-4 border-t text-sm text-muted-foreground">
            <p>© rplus</p>
            <p>ЛКПО</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
