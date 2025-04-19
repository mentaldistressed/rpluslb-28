
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { supabase, ChangelogEntry } from "@/integrations/supabase/client";
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

interface SystemVersion {
  version: string;
  lastUpdate: string;
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
  
  const [systemVersion, setSystemVersion] = useState("");
  const [lastUpdate, setLastUpdate] = useState("");
  const [versionSaving, setVersionSaving] = useState(false);
  
  const [changelogVersion, setChangelogVersion] = useState("");
  const [changelogDescription, setChangelogDescription] = useState("");
  const [changelogEntries, setChangelogEntries] = useState<ChangelogEntry[]>([]);
  const [isChangelogSaving, setIsChangelogSaving] = useState(false);

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
            setNewsContent(bannerData.value || "");
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
        
        const { data: settings, error: settingsError } = await supabase
          .from('system_settings')
          .select('*');
          
        if (!settingsError && settings) {
          settings.forEach(setting => {
            if (setting.key === 'system_version') {
              setSystemVersion(setting.value || "");
            } else if (setting.key === 'last_update') {
              setLastUpdate(setting.value || "");
            }
          });
        }
        
        // Attempt to fetch changelog entries if the table exists
        try {
          const { data: changelog, error: changelogError } = await supabase
            .from('changelog_entries')
            .select('*')
            .order('version', { ascending: false });
            
          if (changelogError) {
            console.error("Error fetching changelog:", changelogError);
          } else if (changelog) {
            setChangelogEntries(changelog as ChangelogEntry[]);
          }
        } catch (error) {
          console.error("Error fetching changelog:", error);
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
  
  const handleSaveVersion = async () => {
    if (!user || user.role !== 'admin') return;
    
    setVersionSaving(true);
    
    try {
      const updates = [
        {
          key: 'system_version',
          value: systemVersion
        },
        {
          key: 'last_update',
          value: lastUpdate
        }
      ];
      
      const { error } = await supabase
        .from('system_settings')
        .upsert(updates, {
          onConflict: 'key'
        });
        
      if (error) throw error;
      
      toast({
        title: "версия системы обновлена",
        description: "Информация о версии успешно обновлена",
      });
    } catch (error) {
      console.error("Error saving version:", error);
      toast({
        title: "ошибка",
        description: "не удалось обновить версию",
        variant: "destructive",
      });
    } finally {
      setVersionSaving(false);
    }
  };
  
  const handleAddChangelogEntry = async () => {
    if (!user || user.role !== 'admin') return;
    
    setIsChangelogSaving(true);
    
    try {
      // Using a raw POST request instead of the Supabase client
      // to handle the case where the table might not exist yet
      const response = await fetch(`${supabase.supabaseUrl}/rest/v1/changelog_entries`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabase.supabaseKey,
          'Authorization': `Bearer ${supabase.supabaseKey}`,
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          version: changelogVersion,
          description: changelogDescription
        })
      });
      
      if (!response.ok) {
        throw new Error(`Error adding changelog entry: ${response.status}`);
      }
      
      // Refresh changelog entries
      try {
        const { data: changelog } = await supabase
          .from('changelog_entries')
          .select('*')
          .order('version', { ascending: false });
          
        if (changelog) {
          setChangelogEntries(changelog as ChangelogEntry[]);
        }
      } catch (error) {
        console.error("Error refreshing changelog:", error);
      }
      
      setChangelogVersion("");
      setChangelogDescription("");
      
      toast({
        title: "запись добавлена",
        description: "Новая запись успешно добавлена в журнал изменений",
      });
    } catch (error) {
      console.error("Error adding changelog entry:", error);
      toast({
        title: "ошибка",
        description: "не удалось добавить запись",
        variant: "destructive",
      });
    } finally {
      setIsChangelogSaving(false);
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

          <Card>
            <CardHeader>
              <CardTitle>версия системы</CardTitle>
              <CardDescription>
                управление версией системы и информацией об обновлении
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="system-version">версия</Label>
                  <Input
                    id="system-version"
                    value={systemVersion}
                    onChange={(e) => setSystemVersion(e.target.value)}
                    placeholder="1.1.2.1"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="last-update">последнее обновление</Label>
                  <Input
                    id="last-update"
                    type="datetime-local"
                    value={lastUpdate}
                    onChange={(e) => setLastUpdate(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button 
                onClick={handleSaveVersion} 
                disabled={versionSaving}
              >
                {versionSaving ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    сохранение...
                  </>
                ) : (
                  "сохранить версию"
                )}
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>журнал изменений</CardTitle>
              <CardDescription>
                управление записями в журнале изменений системы
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="changelog-version">версия</Label>
                <Input
                  id="changelog-version"
                  value={changelogVersion}
                  onChange={(e) => setChangelogVersion(e.target.value)}
                  placeholder="1.1.2.1"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="changelog-description">описание изменений</Label>
                <Textarea
                  id="changelog-description"
                  value={changelogDescription}
                  onChange={(e) => setChangelogDescription(e.target.value)}
                  placeholder="опишите изменения в этой версии..."
                  className="min-h-[100px]"
                />
              </div>
              
              <Button 
                onClick={handleAddChangelogEntry}
                disabled={isChangelogSaving || !changelogVersion || !changelogDescription}
                className="w-full"
              >
                {isChangelogSaving ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    добавление...
                  </>
                ) : (
                  "добавить запись"
                )}
              </Button>
              
              <div className="mt-6 space-y-4">
                <h4 className="text-sm font-medium">существующие записи</h4>
                {changelogEntries.length > 0 ? (
                  changelogEntries.map((entry) => (
                    <div
                      key={entry.id}
                      className="border rounded-lg p-4 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <h5 className="font-medium">Версия {entry.version}</h5>
                        <span className="text-xs text-muted-foreground">
                          {new Date(entry.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {entry.description}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground text-sm">Пока нет записей в журнале изменений.</p>
                )}
              </div>
            </CardContent>
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
}
