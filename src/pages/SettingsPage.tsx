import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { RefreshCw, Clock } from "lucide-react";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";

interface BannerSettings {
  title: string;
  content: string;
  backgroundColor: string;
  textColor: string;
  enabled: boolean;
}

interface MaintenanceSettings {
  enabled: boolean;
  endTime: string;
  message: string;
}

export default function SettingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [bannerTitle, setBannerTitle] = useState("Объявление");
  const [newsContent, setNewsContent] = useState("");
  const [backgroundColor, setBackgroundColor] = useState("#F2FCE2");
  const [textColor, setTextColor] = useState("#1A1F2C");
  const [isEnabled, setIsEnabled] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const [maintenanceEnabled, setMaintenanceEnabled] = useState(false);
  const [maintenanceEndTime, setMaintenanceEndTime] = useState("");
  const [maintenanceMessage, setMaintenanceMessage] = useState("проводятся технические работы. личный кабинет временно недоступен.");
  const [maintenanceSaving, setMaintenanceSaving] = useState(false);
  
  useEffect(() => {
    const fetchSettings = async () => {
      setIsLoading(true);
      
      try {
        const { data: bannerData, error: bannerError } = await supabase
          .from('system_settings')
          .select('*')
          .eq('key', 'news_banner')
          .single();
          
        if (!bannerError && bannerData) {
          try {
            const parsedSettings = JSON.parse(bannerData.value) as BannerSettings;
            setBannerTitle(parsedSettings.title);
            setNewsContent(parsedSettings.content);
            setBackgroundColor(parsedSettings.backgroundColor);
            setTextColor(parsedSettings.textColor);
            setIsEnabled(parsedSettings.enabled !== false);
          } catch (e) {
            setNewsContent(bannerData.value);
          }
        }
        
        const { data: maintenanceData, error: maintenanceError } = await supabase
          .from('system_settings')
          .select('*')
          .eq('key', 'maintenance_mode')
          .single();
          
        if (!maintenanceError && maintenanceData && maintenanceData.value) {
          try {
            const parsedSettings = JSON.parse(maintenanceData.value) as MaintenanceSettings;
            setMaintenanceEnabled(parsedSettings.enabled);
            setMaintenanceEndTime(parsedSettings.endTime || "");
            setMaintenanceMessage(parsedSettings.message || "проводятся технические работы. личный кабинет временно недоступен.");
          } catch (e) {
            console.error("Error parsing maintenance settings:", e);
          }
        }
      } catch (error) {
        console.error("Error fetching settings:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchSettings();
  }, []);
  
  const handleSaveNewsBanner = async () => {
    if (!user || user.role !== 'admin') return;
    
    setIsSaving(true);
    
    try {
      const bannerSettings: BannerSettings = {
        title: bannerTitle,
        content: newsContent,
        backgroundColor: backgroundColor,
        textColor: textColor,
        enabled: isEnabled
      };
      
      const { error } = await supabase
        .from('system_settings')
        .upsert({
          key: 'news_banner',
          value: JSON.stringify(bannerSettings)
        }, {
          onConflict: 'key'
        });
        
      if (error) throw error;
      
      toast({
        title: "Объявление сохранено",
        description: "Объявление было успешно обновлено",
      });
    } catch (error) {
      console.error("Error saving news banner:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось сохранить объявление",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleSaveMaintenanceSettings = async () => {
    if (!user || user.role !== 'admin') return;
    
    setMaintenanceSaving(true);
    
    try {
      const maintenanceSettings: MaintenanceSettings = {
        enabled: maintenanceEnabled,
        endTime: maintenanceEndTime,
        message: maintenanceMessage
      };
      
      const { error } = await supabase
        .from('system_settings')
        .upsert({
          key: 'maintenance_mode',
          value: JSON.stringify(maintenanceSettings)
        }, {
          onConflict: 'key'
        });
        
      if (error) throw error;
      
      toast({
        title: "настройки сохранены",
        description: maintenanceEnabled 
          ? "режим технических работ включен" 
          : "режим технических работ отключен",
      });
    } catch (error) {
      console.error("Error saving maintenance settings:", error);
      toast({
        title: "ошибка",
        description: "не удалось сохранить настройки режима тех.работ",
        variant: "destructive",
      });
    } finally {
      setMaintenanceSaving(false);
    }
  };
  
  if (!user) return null;
  
  const isAdmin = user.role === 'admin';
  
  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">персональные настройки</h1>
      </div>
      
      {isAdmin && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>режим технических работ</CardTitle>
              <CardDescription>
                настройте режим технических работ для пользователей
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch 
                  id="maintenance-enabled" 
                  checked={maintenanceEnabled}
                  onCheckedChange={setMaintenanceEnabled}
                />
                <Label htmlFor="maintenance-enabled">
                  включить режим технических работ
                </Label>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="maintenance-message">сообщение для пользователей</Label>
                <Textarea
                  id="maintenance-message"
                  value={maintenanceMessage}
                  onChange={(e) => setMaintenanceMessage(e.target.value)}
                  placeholder="Введите сообщение о технических работах..."
                  className="min-h-[80px]"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="maintenance-end-time">примерное время окончания</Label>
                <div className="flex items-center space-x-2">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  <Input
                    id="maintenance-end-time"
                    type="datetime-local"
                    value={maintenanceEndTime}
                    onChange={(e) => setMaintenanceEndTime(e.target.value)}
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  Укажите примерное время окончания технических работ
                </p>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button 
                onClick={handleSaveMaintenanceSettings} 
                disabled={maintenanceSaving}
              >
                {maintenanceSaving ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    сохранение...
                  </>
                ) : (
                  "сохранить настройки"
                )}
              </Button>
            </CardFooter>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>управление объявлениями</CardTitle>
              <CardDescription>
                настройте текст объявления, который будет отображаться для всех пользователей
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch 
                  id="banner-enabled" 
                  checked={isEnabled}
                  onCheckedChange={setIsEnabled}
                />
                <Label htmlFor="banner-enabled">включить объявление</Label>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="banner-title">заголовок объявления</Label>
                  <Input
                    id="banner-title"
                    value={bannerTitle}
                    onChange={(e) => setBannerTitle(e.target.value)}
                    placeholder="заголовок объявления"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="text-color">цвет текста</Label>
                  <div className="flex items-center space-x-2">
                    <div 
                      className="w-6 h-6 rounded border"
                      style={{ backgroundColor: textColor }}
                    />
                    <Input
                      id="text-color"
                      type="color"
                      value={textColor}
                      onChange={(e) => setTextColor(e.target.value)}
                      className="w-full h-10"
                    />
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="news-content">текст объявления</Label>
                <Textarea
                  id="news-content"
                  value={newsContent}
                  onChange={(e) => setNewsContent(e.target.value)}
                  placeholder="введите текст объявления..."
                  className="min-h-[120px]"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="background-color">цвет фона</Label>
                <div className="flex items-center space-x-2">
                  <div 
                    className="w-6 h-6 rounded border"
                    style={{ backgroundColor: backgroundColor }}
                  />
                  <Input
                    id="background-color"
                    type="color"
                    value={backgroundColor}
                    onChange={(e) => setBackgroundColor(e.target.value)}
                    className="w-full h-10"
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button 
                onClick={handleSaveNewsBanner} 
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    сохранение...
                  </>
                ) : (
                  "сохранить объявление"
                )}
              </Button>
            </CardFooter>
          </Card>
        </>
      )}
      
      {!isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle>пока здесь ничего нет...</CardTitle>
            <CardDescription>
              но скоро что-то точно появится :)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              страница находится в разработке
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
