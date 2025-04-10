
import { useState, useEffect } from 'react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { InfoIcon, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface NewsBannerProps {
  className?: string;
}

export const NewsBanner = ({ className }: NewsBannerProps) => {
  const [isOpen, setIsOpen] = useState(true);
  const [newsContent, setNewsContent] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchNewsContent = async () => {
      // Use a more generic approach to query the table without relying on type checking
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .eq('key', 'news_banner')
        .single();
        
      if (data && !error) {
        setNewsContent(data.value);
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
          // Type assertion to access the value property
          setNewsContent((payload.new as any).value);
        }
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);
  
  if (!newsContent) return null;
  
  return (
    <Collapsible 
      open={isOpen} 
      onOpenChange={setIsOpen}
      className={`border rounded-lg overflow-hidden bg-primary/5 ${className}`}
    >
      <div className="flex items-center p-3 border-b bg-primary/10">
        <InfoIcon className="h-4 w-4 text-primary mr-2" />
        <span className="font-medium text-sm flex-1">Объявление</span>
        <CollapsibleTrigger asChild>
          <button className="p-1 rounded-full hover:bg-primary/10 transition-colors">
            {isOpen ? 
              <ChevronUp className="h-4 w-4 text-primary" /> : 
              <ChevronDown className="h-4 w-4 text-primary" />
            }
          </button>
        </CollapsibleTrigger>
      </div>
      <CollapsibleContent>
        <div className="p-3 text-sm whitespace-pre-line">
          {newsContent}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};
