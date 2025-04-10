
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { RefreshCw } from "lucide-react";
import { Label } from "@/components/ui/label";

interface BannerSettings {
  title: string;
  content: string;
  backgroundColor: string;
  textColor: string;
  enabled: boolean;
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
          setIsEnabled(parsedSettings.enabled !== false); // Default to true if not specified
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
        textColor: textColor,
        enabled: isEnabled
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
        <h1 className="text-2xl font-bold">финансы</h1>
      </div>

        <Card>
          <CardHeader>
            <CardTitle>денег нет, но вы держитесь...</CardTitle>
            <CardDescription>
              но скоро, наверное, появятся (не обещаем)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              страница находится в разработке
            </p>
          </CardContent>
        </Card>
    </div>
  );
};
