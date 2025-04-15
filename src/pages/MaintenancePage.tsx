
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
      <div className="flex h-screen items-center justify-center bg-gradient-to-b from-background to-background/50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 bg-primary/5 rounded-full flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
          <span className="text-sm text-muted-foreground">загрузка...</span>
        </div>
      </div>
    );
  }

  const handleCheckAvailability = () => {
    window.location.replace('/');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-background to-background/50 p-4">
      <div className="w-full max-w-md">
        <div className="mx-auto bg-primary/10 p-5 rounded-full w-20 h-20 flex items-center justify-center mb-6">
          <Wrench className="h-8 w-8 text-primary" />
        </div>
        
        <Card className="card-shadow border-border/40 overflow-hidden">
          <CardHeader className="text-center pb-4 border-b border-border/40 bg-secondary/30">
            <CardTitle className="text-2xl font-medium">
              техническое обслуживание
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4 pt-6">
            <p className="text-foreground leading-relaxed">{message}</p>
            
            {endTime && (
              <div className="space-y-4 py-2">
                <div className="w-full bg-secondary/50 rounded-lg p-4">
                  <div className="flex items-center justify-center gap-2 text-sm text-foreground/80 font-medium mb-2">
                    <Clock className="h-4 w-4" />
                    <span>примерное время ожидания:</span>
                  </div>
                  <div className="text-xl font-bold text-foreground">{timeRemaining}</div>
                </div>
                
                <div className="text-sm text-muted-foreground">
                  планируемое окончание технических работ:<br />
                  <span className="font-medium text-foreground/80">{format(endTime, "dd.MM.yyyy HH:mm", { locale: ru })}</span>
                </div>
              </div>
            )}
            
            <div className="pt-6 border-t border-border/40 text-sm text-muted-foreground space-y-4">
              <div>
                <p className="text-primary font-medium">ЛКПО</p>
                <p>© rplus</p>
              </div>
              
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={handleCheckAvailability}
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
