import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, CalendarIcon, Plus, Trash2 } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface SystemSettings {
  key: string;
  value: string;
}

interface MaintenanceSettings {
  enabled: boolean;
  endTime: string;
  message: string;
}

interface NewsBannerSettings {
  enabled: boolean;
  title: string;
  content: string;
  backgroundColor: string;
  textColor: string;
}

interface ChangelogEntry {
  id: string;
  version: string;
  description: string;
  created_at: string;
}

const SettingsPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isAdmin, setIsAdmin] = useState(false);
  
  const [systemSettings, setSystemSettings] = useState<SystemSettings[]>([]);
  const [systemVersion, setSystemVersion] = useState("");
  const [lastUpdate, setLastUpdate] = useState(new Date());
  
  const [maintenanceSettings, setMaintenanceSettings] = useState<MaintenanceSettings>({
    enabled: false,
    endTime: new Date(Date.now() + 3600000).toISOString(),
    message: "система находится на техническом обслуживании. пожалуйста, попробуйте позже."
  });
  
  const [newsBannerSettings, setNewsBannerSettings] = useState<NewsBannerSettings>({
    enabled: true,
    title: "Объявление",
    content: "добро пожаловать в новый личный кабинет правообладателя",
    backgroundColor: "#3B82F6",
    textColor: "#FFFFFF"
  });
  
  const [changelogEntries, setChangelogEntries] = useState<ChangelogEntry[]>([]);
  const [newVersion, setNewVersion] = useState("");
  const [newDescription, setNewDescription] = useState<string>("");
  const [isLoadingChangelog, setIsLoadingChangelog] = useState(false);
  const [isAddingChangelog, setIsAddingChangelog] = useState(false);
  const [isChangelogDialogOpen, setIsChangelogDialogOpen] = useState(false);
  const [rlsError, setRlsError] = useState(false);
  
  useEffect(() => {
    if (user && user.role === 'admin') {
      setIsAdmin(true);
      fetchSettings();
    }
  }, [user]);
  
  const fetchSettings = async () => {
    try {
      const { data: settings, error } = await supabase
        .from('system_settings')
        .select('*');
        
      if (error) {
        throw error;
      }
      
      if (settings) {
        setSystemSettings(settings);
        
        settings.forEach(setting => {
          if (setting.key === 'system_version') {
            setSystemVersion(setting.value);
          } else if (setting.key === 'last_update') {
            setLastUpdate(new Date(setting.value));
          } else if (setting.key === 'maintenance_mode') {
            try {
              setMaintenanceSettings(JSON.parse(setting.value));
            } catch (e) {
              console.error("Error parsing maintenance settings:", e);
            }
          } else if (setting.key === 'news_banner') {
            try {
              setNewsBannerSettings(JSON.parse(setting.value));
            } catch (e) {
              console.error("Error parsing news banner settings:", e);
            }
          }
        });
      }
      
      await fetchChangelogEntries();
      
    } catch (error) {
      console.error("Error fetching settings:", error);
      toast({
        title: "ошибка",
        description: "не удалось загрузить настройки",
        variant: "destructive"
      });
    }
  };
  
  const fetchChangelogEntries = async () => {
    setIsLoadingChangelog(true);
    try {
      const { data, error } = await supabase
        .from('changelog_entries')
        .select('*')
        .order('version', { ascending: false });
      
      if (error) {
        if (error.code === '42501') {
          setRlsError(true);
          console.warn("RLS policy preventing changelog access. Admin needs to update RLS policies.");
        } else {
          console.error("Error fetching changelog entries:", error);
          toast({
            title: "ошибка",
            description: "не удалось загрузить записи журнала изменений",
            variant: "destructive"
          });
        }
      } else if (data) {
        setChangelogEntries(data);
      }
    } catch (error) {
      console.error("Error fetching changelog entries:", error);
    } finally {
      setIsLoadingChangelog(false);
    }
  };
  
  const handleUpdateSystemSettings = async (key: string, value: string) => {
    try {
      const { error } = await supabase
        .from('system_settings')
        .update({ value })
        .eq('key', key);
        
      if (error) throw error;
      
      toast({
        title: "настройки обновлены",
        description: "настройки системы были успешно обновлены",
      });
      
      if (key === 'system_version') {
        setSystemVersion(value);
        
        const now = new Date().toISOString();
        await supabase
          .from('system_settings')
          .update({ value: now })
          .eq('key', 'last_update');
          
        setLastUpdate(new Date(now));
      }
    } catch (error) {
      console.error(`Error updating ${key}:`, error);
      toast({
        title: "ошибка",
        description: "не удалось обновить настройки системы",
        variant: "destructive"
      });
    }
  };
  
  const handleUpdateMaintenanceMode = async () => {
    try {
      const { error } = await supabase
        .from('system_settings')
        .update({ value: JSON.stringify(maintenanceSettings) })
        .eq('key', 'maintenance_mode');
        
      if (error) throw error;
      
      toast({
        title: "режим обслуживания обновлен",
        description: maintenanceSettings.enabled 
          ? "режим о��служивания включен"
          : "режим обслуживания отключен",
      });
    } catch (error) {
      console.error("Error updating maintenance mode:", error);
      toast({
        title: "ошибка",
        description: "не удалось обновить режим обслуживания",
        variant: "destructive"
      });
    }
  };
  
  const handleUpdateNewsBanner = async () => {
    try {
      const { error } = await supabase
        .from('system_settings')
        .update({ value: JSON.stringify(newsBannerSettings) })
        .eq('key', 'news_banner');
        
      if (error) throw error;
      
      toast({
        title: "баннер обновлен",
        description: "настройки баннера были успешно обновлены",
      });
    } catch (error) {
      console.error("Error updating news banner:", error);
      toast({
        title: "ошибка",
        description: "не удалось обновить настройки баннера",
        variant: "destructive"
      });
    }
  };
  
  const handleAddChangelogEntry = async () => {
    if (!newVersion.trim() || !newDescription.trim()) {
      toast({
        title: "ошибка",
        description: "пожалуйста, заполните все поля",
        variant: "destructive"
      });
      return;
    }
    
    setIsAddingChangelog(true);
    
    try {
      if (rlsError) {
        toast({
          title: "ошибка доступа",
          description: "у вас нет прав для добавления записей в журнал изменений. обратитесь к администратору базы данных для настройки политик безопасности",
          variant: "destructive"
        });
        setIsAddingChangelog(false);
        setIsChangelogDialogOpen(false);
        return;
      }
      
      const changes = newDescription
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);
      
      const { data, error } = await supabase
        .from('changelog_entries')
        .insert({
          version: newVersion,
          description: changes
        })
        .select()
        .single();
      
      if (error) {
        if (error.code === '42501') {
          setRlsError(true);
          throw new Error("Error adding changelog entry: 401");
        }
        throw error;
      }
      
      setChangelogEntries([data, ...changelogEntries]);
      setNewVersion("");
      setNewDescription("");
      setIsChangelogDialogOpen(false);
      
      toast({
        title: "запись добавлена",
        description: "запись журнала изменений была успешно добавлена",
      });
      
      await handleUpdateSystemSettings('system_version', newVersion);
      
    } catch (error) {
      console.error("Error adding changelog entry:", error);
      toast({
        title: "ошибка",
        description: "не удалось добавить запись в журнал изменений",
        variant: "destructive"
      });
    } finally {
      setIsAddingChangelog(false);
    }
  };
  
  const handleDeleteChangelogEntry = async (id: string) => {
    try {
      if (rlsError) {
        toast({
          title: "ошибка доступа",
          description: "у вас нет прав для удаления записей из журнала изменений. обратитесь к администратору базы данных для настройки политик безопасности",
          variant: "destructive"
        });
        return;
      }
      
      const { error } = await supabase
        .from('changelog_entries')
        .delete()
        .eq('id', id);
        
      if (error) {
        if (error.code === '42501') {
          setRlsError(true);
          throw new Error("Error deleting changelog entry: 401");
        }
        throw error;
      }
      
      setChangelogEntries(changelogEntries.filter(entry => entry.id !== id));
      
      toast({
        title: "запись удалена",
        description: "запись журнала изменений была успешно удалена",
      });
    } catch (error) {
      console.error("Error deleting changelog entry:", error);
      toast({
        title: "ошибка",
        description: "не удалось удалить запись из журнала изменений",
        variant: "destructive"
      });
    }
  };
  
  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-16rem)]">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>доступ запрещен</CardTitle>
            <CardDescription>у вас нет доступа к настройкам системы</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col space-y-3">
        <h1 className="text-2xl font-semibold">настройки системы</h1>
        <p className="text-muted-foreground">
          управление настройками системы
        </p>
      </div>
      
      <Tabs defaultValue="general">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="general">основные</TabsTrigger>
          <TabsTrigger value="notifications">уведомления</TabsTrigger>
          <TabsTrigger value="maintenance">обслуживание</TabsTrigger>
        </TabsList>
        
        <TabsContent value="general" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>система</CardTitle>
              <CardDescription>основные настройки системы</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-3">
                <Label htmlFor="systemVersion">версия системы</Label>
                <div className="flex items-center gap-3">
                  <Input
                    id="systemVersion"
                    value={systemVersion}
                    onChange={(e) => setSystemVersion(e.target.value)}
                    className="max-w-xs"
                  />
                  <Button onClick={() => handleUpdateSystemSettings('system_version', systemVersion)}>
                    обновить
                  </Button>
                </div>
              </div>
              
              <div className="grid gap-3">
                <Label>последнее обновление</Label>
                <div className="flex items-center space-x-3">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-[240px] justify-start text-left font-normal",
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {format(lastUpdate, "PPP")}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={lastUpdate}
                        onSelect={(date) => date && setLastUpdate(date)}
                      />
                    </PopoverContent>
                  </Popover>
                  <Button 
                    onClick={() => 
                      handleUpdateSystemSettings('last_update', lastUpdate.toISOString())
                    }
                  >
                    обновить
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>журнал изменений</CardTitle>
                <CardDescription>история версий системы</CardDescription>
              </div>
              
              <Dialog open={isChangelogDialogOpen} onOpenChange={setIsChangelogDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="ml-auto">
                    <Plus className="h-4 w-4 mr-2" />
                    добавить запись
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>новая запись журнала</DialogTitle>
                    <DialogDescription>
                      добавить новую запись в журнал изменений системы
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="version">версия</Label>
                      <Input
                        id="version"
                        placeholder="1.0.0"
                        value={newVersion}
                        onChange={(e) => setNewVersion(e.target.value)}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="description">описание изменений</Label>
                      <Textarea
                        id="description"
                        placeholder="список изменений..."
                        value={newDescription}
                        onChange={(e) => setNewDescription(e.target.value)}
                        rows={5}
                      />
                    </div>
                  </div>
                  
                  <DialogFooter>
                    <Button onClick={handleAddChangelogEntry} disabled={isAddingChangelog}>
                      {isAddingChangelog && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      добавить
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            
            <CardContent>
              {isLoadingChangelog ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : rlsError ? (
                <div className="text-center py-6 space-y-2">
                  <Badge variant="destructive" className="mx-auto px-3 py-1">ошибка доступа к таблице</Badge>
                  <p className="text-muted-foreground text-sm max-w-md mx-auto">
                    у вас нет доступа к таблице журнала изменений. обратитесь к администратору базы данных для настройки политик безопасности строк (RLS).
                  </p>
                </div>
              ) : changelogEntries.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-muted-foreground">журнал изменений пуст</p>
                </div>
              ) : (
                <ScrollArea className="h-[400px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>версия</TableHead>
                        <TableHead>дата</TableHead>
                        <TableHead className="w-[60%]">описание</TableHead>
                        <TableHead>действия</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {changelogEntries.map((entry) => (
                        <TableRow key={entry.id}>
                          <TableCell className="font-medium">
                            <Badge variant="outline">{entry.version}</Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {format(parseISO(entry.created_at), "dd.MM.yyyy")}
                          </TableCell>
                          <TableCell className="whitespace-pre-wrap text-sm">
                            {Array.isArray(entry.description) ? (
                              <ul className="list-disc list-inside space-y-1">
                                {entry.description.map((change, index) => (
                                  <li key={index}>{change}</li>
                                ))}
                              </ul>
                            ) : (
                              <p>{entry.description}</p>
                            )}
                          </TableCell>
                          <TableCell>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>удалить запись?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    вы уверены, что хотите удалить запись из журнала изменений?
                                    это действие не может быть отменено.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>отмена</AlertDialogCancel>
                                  <AlertDialogAction 
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    onClick={() => handleDeleteChangelogEntry(entry.id)}
                                  >
                                    удалить
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              )}
              
              {rlsError && (
                <div className="mt-4 p-4 border rounded bg-muted/50">
                  <h4 className="font-medium text-sm">как исправить ошибку доступа к таблице?</h4>
                  <ol className="text-sm mt-2 space-y-1 text-muted-foreground">
                    <li>1. Перейдите в панель управления Supabase</li>
                    <li>2. Откройте раздел "Authentication" → "Policies"</li>
                    <li>3. Найдите таблицу "changelog_entries" и добавьте новую политику</li>
                    <li>4. Добавьте политику с разрешением на INSERT, UPDATE, DELETE для пользователей с ролью "admin"</li>
                  </ol>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="notifications" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>информационный баннер</CardTitle>
              <CardDescription>настройки информационного баннера на главной странице</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center space-x-2">
                <Switch 
                  id="banner-enabled"
                  checked={newsBannerSettings.enabled}
                  onCheckedChange={(checked) => 
                    setNewsBannerSettings({...newsBannerSettings, enabled: checked})
                  }
                />
                <Label htmlFor="banner-enabled">показывать баннер</Label>
              </div>
              
              <div className="space-y-3">
                <Label htmlFor="banner-title">заголовок баннера</Label>
                <Input
                  id="banner-title"
                  value={newsBannerSettings.title}
                  onChange={(e) => 
                    setNewsBannerSettings({...newsBannerSettings, title: e.target.value})
                  }
                />
              </div>
              
              <div className="space-y-3">
                <Label htmlFor="banner-content">содержание баннера</Label>
                <Textarea
                  id="banner-content"
                  value={newsBannerSettings.content}
                  onChange={(e) => 
                    setNewsBannerSettings({...newsBannerSettings, content: e.target.value})
                  }
                  rows={4}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <Label htmlFor="background-color">цвет фона</Label>
                  <div className="flex gap-2 items-center">
                    <Input
                      id="background-color"
                      type="color"
                      value={newsBannerSettings.backgroundColor}
                      onChange={(e) => 
                        setNewsBannerSettings({
                          ...newsBannerSettings, 
                          backgroundColor: e.target.value
                        })
                      }
                      className="w-12 h-8 p-1"
                    />
                    <Input 
                      value={newsBannerSettings.backgroundColor}
                      onChange={(e) => 
                        setNewsBannerSettings({
                          ...newsBannerSettings, 
                          backgroundColor: e.target.value
                        })
                      }
                      className="flex-1"
                    />
                  </div>
                </div>
                
                <div className="space-y-3">
                  <Label htmlFor="text-color">цвет текста</Label>
                  <div className="flex gap-2 items-center">
                    <Input
                      id="text-color"
                      type="color"
                      value={newsBannerSettings.textColor}
                      onChange={(e) => 
                        setNewsBannerSettings({
                          ...newsBannerSettings, 
                          textColor: e.target.value
                        })
                      }
                      className="w-12 h-8 p-1"
                    />
                    <Input 
                      value={newsBannerSettings.textColor}
                      onChange={(e) => 
                        setNewsBannerSettings({
                          ...newsBannerSettings, 
                          textColor: e.target.value
                        })
                      }
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>
              
              <div className="pt-2">
                <Button onClick={handleUpdateNewsBanner}>
                  сохранить настройки баннера
                </Button>
              </div>
              
              <div className="pt-4 pb-2">
                <h4 className="text-sm font-medium mb-2">предпросмотр:</h4>
                <div 
                  className="rounded-md p-4 text-sm"
                  style={{ 
                    backgroundColor: `${newsBannerSettings.backgroundColor}40`,
                    color: newsBannerSettings.textColor,
                    borderWidth: 1,
                    borderColor: `${newsBannerSettings.backgroundColor}70`
                  }}
                >
                  <div className="font-medium border-b pb-2 mb-2"
                       style={{ borderColor: `${newsBannerSettings.backgroundColor}70` }}>
                    {newsBannerSettings.title}
                  </div>
                  <p className="whitespace-pre-wrap">
                    {newsBannerSettings.content}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="maintenance" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>режим обслуживания</CardTitle>
              <CardDescription>настройки режима технического обслуживания</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center space-x-2">
                <Switch 
                  id="maintenance-enabled"
                  checked={maintenanceSettings.enabled}
                  onCheckedChange={(checked) => 
                    setMaintenanceSettings({...maintenanceSettings, enabled: checked})
                  }
                />
                <Label htmlFor="maintenance-enabled">включить режим обслуживания</Label>
              </div>
              
              <div className="space-y-3">
                <Label>плановое время завершения</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-[240px] justify-start text-left font-normal",
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(new Date(maintenanceSettings.endTime), "PPp")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={new Date(maintenanceSettings.endTime)}
                      onSelect={(date) => 
                        date && setMaintenanceSettings({
                          ...maintenanceSettings, 
                          endTime: date.toISOString()
                        })
                      }
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div className="space-y-3">
                <Label htmlFor="maintenance-message">сообщение пользователям</Label>
                <Textarea
                  id="maintenance-message"
                  value={maintenanceSettings.message}
                  onChange={(e) => 
                    setMaintenanceSettings({...maintenanceSettings, message: e.target.value})
                  }
                  rows={3}
                />
              </div>
              
              <div className="pt-2">
                <Button onClick={handleUpdateMaintenanceMode}>
                  сохранить настройки режима
                </Button>
              </div>
              
              <div className="pt-2">
                <p className="text-xs text-muted-foreground">
                  при включении режима обслуживания, доступ к системе будет ограничен только для администраторов.
                  пользователи увидят экран технического обслуживания.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SettingsPage;
