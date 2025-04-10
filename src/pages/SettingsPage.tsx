
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { NewsBanner } from "@/components/NewsBanner";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { RefreshCw } from "lucide-react";

export default function SettingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [newsContent, setNewsContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Fetch current news banner content
  useState(() => {
    const fetchNewsContent = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('system_settings')
        .select('value')
        .eq('key', 'news_banner')
        .single();
        
      if (!error && data) {
        setNewsContent(data.value);
      }
      setIsLoading(false);
    };
    
    fetchNewsContent();
  });
  
  const handleSaveNewsBanner = async () => {
    if (!user || user.role !== 'admin') return;
    
    setIsSaving(true);
    
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .upsert(
          { key: 'news_banner', value: newsContent },
          { onConflict: 'key' }
        );
        
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
          <CardContent>
            <Textarea
              value={newsContent}
              onChange={(e) => setNewsContent(e.target.value)}
              placeholder="Введите текст объявления..."
              className="min-h-[120px]"
            />
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
}
