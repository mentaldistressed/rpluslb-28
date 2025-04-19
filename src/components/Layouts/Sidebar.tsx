import { useAuth } from "@/contexts/AuthContext";
import { useTickets } from "@/contexts/TicketsContext";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Ticket, Users, Plus, Settings, Landmark, 
  Home, Hammer, Coins, FileText 
} from "lucide-react";
import { Link, useLocation, useParams } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format, parseISO } from "date-fns";
import { ChangelogEntry } from "@/types";

interface SystemSetting {
  key: string;
  value: string | null;
  created_at: string;
  updated_at: string;
}

export default function Sidebar() {
  const { user } = useAuth();
  const { userCanAccessTicket } = useTickets();
  const { theme } = useTheme();
  const location = useLocation();
  const { ticketId } = useParams<{ ticketId: string }>();
  
  const [showChangelog, setShowChangelog] = useState(false);
  const [systemVersion, setSystemVersion] = useState("");
  const [lastUpdate, setLastUpdate] = useState("");
  const [changelogEntries, setChangelogEntries] = useState<ChangelogEntry[]>([]);

  useEffect(() => {
    const fetchSystemInfo = async () => {
      try {
        const { data: settings, error: settingsError } = await supabase
          .from('system_settings')
          .select('*') as { data: SystemSetting[] | null; error: any };
          
        if (settingsError) {
          console.error("Error fetching system settings:", settingsError);
          return;
        }

        if (settings) {
          settings.forEach((setting) => {
            if (setting.key === 'system_version') {
              setSystemVersion(setting.value ?? '');
            } else if (setting.key === 'last_update') {
              setLastUpdate(setting.value ?? '');
            }
          });
        }
        
        const { data: changelogData, error: changelogError } = await supabase
          .from('changelog_entries')
          .select('*')
          .order('created_at', { ascending: false });
          
        if (changelogError) {
          console.error("Error fetching changelog entries:", changelogError);
          return;
        }

        if (changelogData) {
          setChangelogEntries(changelogData as ChangelogEntry[]);
        }
      } catch (error) {
        console.error("Error fetching system info:", error);
      }
    };
    
    fetchSystemInfo();
    
    const systemSettingsSubscription = supabase
      .channel('system_settings_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'system_settings'
      }, () => {
        fetchSystemInfo();
      })
      .subscribe();
      
    const changelogSubscription = supabase
      .channel('changelog_entries_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'changelog_entries'
      }, () => {
        fetchSystemInfo();
      })
      .subscribe();
      
    return () => {
      systemSettingsSubscription.unsubscribe();
      changelogSubscription.unsubscribe();
    };
  }, []);
  
  if (!user) return null;

  const isAdmin = user.role === 'admin';
  const isUser = user.role === 'sublabel';
  
  const hasTicketAccess = !ticketId || userCanAccessTicket(ticketId);
  
  const navItems = [
    ...(isUser ? [
      {
        name: "главная",
        href: "/dashboard",
        icon: Home,
        active: location.pathname === '/dashboard'
      },
      {
        name: "мои тикеты",
        href: "/tickets",
        icon: Ticket,
        active: location.pathname.startsWith('/tickets')
      },
      {
        name: "мои финансы",
        href: "/finances",
        icon: Landmark,
        active: location.pathname.startsWith('/finances')
      },
      {
        name: "инструменты",
        href: "/tools",
        icon: Hammer,
        active: location.pathname.startsWith('/tools')
      }
    ] : []),
    ...(isAdmin ? [
      {
        name: "панель управления",
        href: "/dashboard",
        icon: Home,
        active: location.pathname === '/dashboard'
      },
      {
        name: "управление тикетами",
        href: "/tickets",
        icon: Ticket,
        active: location.pathname.startsWith('/tickets')
      },
      {
        name: "управление пользователями",
        href: "/users",
        icon: Users,
        active: location.pathname.startsWith('/users')
      },
      {
        name: "управление финансами",
        href: "/finances",
        icon: Landmark,
        active: location.pathname.startsWith('/finances')
      },
      {
        name: "инструменты",
        href: "/tools",
        icon: Hammer,
        active: location.pathname.startsWith('/tools')
      },
      {
        name: "настройки",
        href: "/settings",
        icon: Settings,
        active: location.pathname.startsWith('/settings')
      }
    ] : []),
  ];

  const formattedLastUpdate = lastUpdate ? 
    format(parseISO(lastUpdate), "dd.MM.yyyy, HH:mm") : 
    "N/A";

  return (
    <div className="w-64 bg-card border-r border-border/40 shadow-sm min-h-[calc(100vh-4rem)] flex flex-col p-4 transition-colors duration-200">
      <div className="flex-1 space-y-6">
        {isUser && (
          <Link to="/tickets/new">
            <Button className="w-full justify-start font-medium shadow-sm group" variant="default">
              <Plus className="mr-2 h-4 w-4 transition-transform duration-200 group-hover:rotate-90" />
              <span>создать новый тикет</span>
            </Button>
          </Link>
        )}
        
        <nav className="space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors duration-200",
                item.active
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-foreground/80 hover:bg-secondary hover:text-foreground"
              )}
            >
              <item.icon className="mr-2.5 h-4 w-4" />
              {item.name}
            </Link>
          ))}
        </nav>
      </div>
      
      <div className="mt-auto pt-4 border-t border-border/50">
        <button
          onClick={() => setShowChangelog(true)}
          className="w-full text-left px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2"
        >
          <FileText className="h-4 w-4" />
          <span>v{systemVersion || "1.0.0"}</span>
        </button>
        <p className="text-xs text-muted-foreground px-3">
          последнее обновление: {formattedLastUpdate}
        </p>
      </div>
      
      <Sheet open={showChangelog} onOpenChange={setShowChangelog}>
        <SheetContent side="left" className="w-[400px] sm:w-[540px]">
          <SheetHeader>
            <SheetTitle>журнал изменений</SheetTitle>
          </SheetHeader>
          <ScrollArea className="h-[calc(100vh-100px)] mt-4">
            <div className="space-y-6 pr-6">
              {changelogEntries.length > 0 ? (
                changelogEntries.map((entry) => (
                  <div key={entry.id} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">v{entry.version}</Badge>
                      <span className="text-xs text-muted-foreground">
                        {format(parseISO(entry.created_at), "dd.MM.yyyy, HH:mm")}
                      </span>
                    </div>
                    {Array.isArray(entry.description) ? (
                      <div className="text-sm space-y-1">
                        {entry.description.map((change, index) => (
                          <div key={index} className="flex items-start">
                            <span className="mr-2 text-muted-foreground">•</span>
                            <span className="text-foreground">{change}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-sm space-y-1">
                        <div className="flex items-start">
                          <span className="mr-2 text-muted-foreground">•</span>
                          <span className="text-foreground">{entry.description}</span>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">История изменений пока пуста.</p>
              )}
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </div>
  );
}
