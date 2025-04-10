
import { useState, useEffect } from 'react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { InfoIcon, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface NewsBannerProps {
  className?: string;
}

interface BannerSettings {
  title: string;
  content: string;
  backgroundColor: string;
  textColor: string;
  enabled: boolean;
}

export const NewsBanner = ({ className }: NewsBannerProps) => {
  const [isOpen, setIsOpen] = useState(true);
  const [bannerSettings, setBannerSettings] = useState<BannerSettings | null>(null);
  
  useEffect(() => {
    const fetchNewsContent = async () => {
      // Use a more generic approach to query the table without relying on type checking
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .eq('key', 'news_banner')
        .single();
        
      if (data && !error) {
        try {
          // Parse the JSON value
          const parsedSettings = JSON.parse(data.value) as BannerSettings;
          setBannerSettings(parsedSettings);
        } catch (e) {
          // If parsing fails, use the string value as content with default settings
          setBannerSettings({
            title: 'Объявление',
            content: data.value,
            backgroundColor: '#F2FCE2',
            textColor: '#1A1F2C',
            enabled: true
          });
        }
      }
    };
    
    fetchNewsContent();
    
    // Set up realtime subscription
    const channel = supabase
      .channel('system_settings_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'system_settings',
        filter: 'key=eq.news_banner'
      }, (payload) => {
        if (payload.new) {
          try {
            // Try to parse the new value as JSON
            const newSettings = JSON.parse((payload.new as any).value) as BannerSettings;
            setBannerSettings(newSettings);
          } catch (e) {
            // If parsing fails, use the string value as content with default settings
            setBannerSettings({
              title: 'Объявление',
              content: (payload.new as any).value,
              backgroundColor: '#F2FCE2',
              textColor: '#1A1F2C',
              enabled: true
            });
          }
        }
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);
  
  if (!bannerSettings || !bannerSettings.enabled || !bannerSettings.content) return null;
  
  return (
    <Collapsible 
      open={isOpen} 
      onOpenChange={setIsOpen}
      className={`border rounded-lg overflow-hidden ${className}`}
      style={{ 
        backgroundColor: `${bannerSettings.backgroundColor}20`, 
        borderColor: `${bannerSettings.backgroundColor}40` 
      }}
    >
      <div className="flex items-center p-3 border-b" 
           style={{ 
             backgroundColor: `${bannerSettings.backgroundColor}30`,
             borderColor: `${bannerSettings.backgroundColor}40`,
             color: bannerSettings.textColor
           }}>
        <InfoIcon className="h-4 w-4 mr-2" />
        <span className="font-medium text-sm flex-1">{bannerSettings.title}</span>
        <CollapsibleTrigger asChild>
          <button className="p-1 rounded-full hover:bg-white/20 transition-colors">
            {isOpen ? 
              <ChevronUp className="h-4 w-4" /> : 
              <ChevronDown className="h-4 w-4" />
            }
          </button>
        </CollapsibleTrigger>
      </div>
      <CollapsibleContent>
        <div className="p-3 text-sm whitespace-pre-line" style={{ color: bannerSettings.textColor }}>
          {bannerSettings.content}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};
