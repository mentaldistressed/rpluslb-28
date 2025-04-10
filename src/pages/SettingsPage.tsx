
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { NewsBanner } from "@/components/NewsBanner";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { RefreshCw, Palette } from "lucide-react";
import { Label } from "@/components/ui/label";

interface BannerSettings {
  title: string;
  content: string;
  backgroundColor: string;
  textColor: string;
}

export default function SettingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [bannerTitle, setBannerTitle] = useState("Объявление");
  const [newsContent, setNewsContent] = useState("");
  const [backgroundColor, setBackgroundColor] = useState("#F2FCE2");
  const [textColor, setTextColor] = useState("#1A1F2C");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Fetch current news banner content
  useEffect(() => {
    const fetchNewsContent = async () => {
      setIsLoading(true);
      // Use a more generic approach to query the table without relying on type checking
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .eq('key', 'news_banner')
        .single();
        
      if (!error && data) {
        try {
          // Parse the JSON value
          const parsedSettings = JSON.parse(data.value) as BannerSettings;
          setBannerTitle(parsedSettings.title);
          setNewsContent(parsedSettings.content);
          setBackgroundColor(parsedSettings.backgroundColor);
          setTextColor(parsedSettings.textColor);
        } catch (e) {
          // If parsing fails, use the string value as content with default settings
          setNewsContent(data.value);
        }
      }
      setIsLoading(false);
    };
    
    fetchNewsContent();
  }, []);
  
  const handleSaveNewsBanner = async () => {
    if (!user || user.role !== 'admin') return;
    
    setIsSaving(true);
    
    try {
      // Create a banner settings object
      const bannerSettings: BannerSettings = {
        title: bannerTitle,
        content: newsContent,
        backgroundColor: backgroundColor,
        textColor: textColor
      };
      
      // Use a more generic approach for the upsert operation
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
  
  if (!user) return null;
  
  const isAdmin = user.role === 'admin';
  
  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Настройки</h1>
      </div>
      
      {/* Preview current news banner */}
      <NewsBanner className="mb-6" />
      
      {isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle>Управление объявлениями</CardTitle>
            <CardDescription>
              Настройте текст объявления, который будет отображаться для всех пользователей
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="banner-title">Заголовок объявления</Label>
                <Input
                  id="banner-title"
                  value={bannerTitle}
                  onChange={(e) => setBannerTitle(e.target.value)}
                  placeholder="Заголовок объявления"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="text-color">Цвет текста</Label>
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
              <Label htmlFor="news-content">Текст объявления</Label>
              <Textarea
                id="news-content"
                value={newsContent}
                onChange={(e) => setNewsContent(e.target.value)}
                placeholder="Введите текст объявления..."
                className="min-h-[120px]"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="background-color">Цвет фона</Label>
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
                  Сохранение...
                </>
              ) : (
                "Сохранить объявление"
              )}
            </Button>
          </CardFooter>
        </Card>
      )}
      
      {!isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle>Настройки пользователя</CardTitle>
            <CardDescription>
              Эта страница находится в разработке
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Скоро здесь появятся настройки для вашего аккаунта
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
