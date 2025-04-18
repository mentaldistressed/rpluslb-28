
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { RefreshCw } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Clock, PackageX, Bell, FileText, Lock } from "lucide-react";

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
        <h1 className="text-2xl font-bold">{isAdmin ? 'казино' : 'казино'}</h1>
      </div>

        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Bell className="h-5 w-5 text-blue-500" />
            </div>
            <div>
                <h3 className="font-medium text-blue-800">скоро тут будет ебучая летучая гремучая имба</h3>
                <p className="text-sm text-blue-600">в следующих обновах запилю тут крутое казино на деньги (ВЗлом СЬебербанк andoreed.ru Ipa Apk)</p>
            </div>
            </div>
        </div>

      {/* <Card className="border-border/40 overflow-hidden">
        <CardHeader className="bg-secondary/30">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-secondary/50 rounded-full flex items-center justify-center">
                <PackageX className="h-5 w-5 text-muted-foreground" />
              </div>
              <CardTitle>казино в разработке</CardTitle>
            </div>
            <Badge variant="outline" className="bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-200">
              скоро
            </Badge>
          </div>
          <CardDescription>
            казино
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="h-12 bg-secondary/20 rounded-lg animate-pulse"></div>
            <div className="h-12 bg-secondary/20 rounded-lg animate-pulse"></div>
            <div className="h-12 bg-secondary/20 rounded-lg animate-pulse"></div>
            <div className="flex justify-center mt-6">
              <p className="text-sm text-muted-foreground px-4 py-2 bg-muted/30 rounded-full">
                каталог релизов будет доступен в ближайшем обновлении системы
              </p>
            </div>
          </div>
        </CardContent>
      </Card> */}
    </div>
  );
};
