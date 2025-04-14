
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
  
  if (!user) return null;
  
  const isAdmin = user.role === 'admin';
  
  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">каталог</h1>
      </div>
      <pre className="text-sm text-gray-500 font-mono leading-tight">
        {String.raw`
            ______
            |      |
            |  ___ |
            | | o ||   ← большой палец
            | |___||
            |   |     
            |   |       ← указательный
            |   |       ← средний
            |  / \      
            /__/ \_\     ← кулак
        
        хуй тебе а не каталог!`}
        </pre>
      {/* <p className="text-muted-foreground mt-1">
          страница в разработке
        </p> */}
      <p className="text-xl text-gray-600"></p>
        {/* <Card>
          <CardHeader>
            <CardTitle>нет доступных релизов</CardTitle>
            
            <CardDescription>
              но скоро, наверное, появятся (не обещаем)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              здесь будут отображаться ваши релизы
            </p>
          </CardContent>
        </Card> */}
    </div>
  );
};
