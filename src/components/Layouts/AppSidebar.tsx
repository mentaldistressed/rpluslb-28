import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Ticket, Users, Plus, Settings, Landmark, 
  Home, Hammer, FileText, Music, ChevronRight, User, LogOut
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
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

export default function AppSidebar() {
  const { user, logout } = useAuth();
  const { state } = useSidebar();
  const location = useLocation();
  const collapsed = state === 'collapsed';
  
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
  const currentPath = location.pathname;

  const isActive = (path: string) => currentPath === path || currentPath.startsWith(path + '/');

  const userNavItems = [
    {
      title: "мои тикеты",
      url: "/tickets",
      icon: Ticket,
    },
    {
      title: "синхронизация текста",
      url: "/tools/sync",
      icon: Music,
    }
  ];

  const adminNavItems = [
    {
      title: "панель управления",
      url: "/dashboard",
      icon: Home,
    },
    {
      title: "управление тикетами",
      url: "/tickets",
      icon: Ticket,
    },
    {
      title: "управление пользователями",
      url: "/users",
      icon: Users,
    },
    {
      title: "инструменты",
      url: "/tools",
      icon: Hammer,
    },
    {
      title: "настройки",
      url: "/settings",
      icon: Settings,
    }
  ];

  const navItems = isAdmin ? adminNavItems : userNavItems;

  const formattedLastUpdate = lastUpdate ? 
    format(parseISO(lastUpdate), "dd.MM.yyyy, HH:mm") : 
    "Не определено";

  return (
    <>
      <Sidebar
        className={cn(
          "border-r border-border/40 bg-gradient-to-b from-background/95 to-background/50 backdrop-blur-sm",
          collapsed ? "w-14" : "w-72"
        )}
        collapsible="icon"
      >
        <SidebarHeader className="p-4">
          {!collapsed && (
            <div className="flex items-center gap-3 px-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2 h-10 px-2 rounded-full"><User className="w-4 h-4 text-primary" /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="center" forceMount>
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user.name}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout} className="text-destructive cursor-pointer">
                <LogOut className="mr-2 h-4 w-4" />
                <span>выйти</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-foreground truncate">
                  {user.name}
                </span>
                <span className="text-xs text-muted-foreground">
                  {user.role === 'admin' ? 'администратор' : 'партнер'}
                </span>
              </div>
            </div>
          )}
        </SidebarHeader>

        <SidebarContent className="px-2">
          {isUser && (
            <SidebarGroup>
              <SidebarGroupContent>
                <div className="px-10">
                  <Link to="/tickets/new">
                    <Button 
                      className={cn(
                        "justify-start font-medium transition-all duration-200 group bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-primary-foreground shadow-lg hover:shadow-xl",
                        collapsed ? "px-2" : "px-4"
                      )} 
                      size={collapsed ? "icon" : "default"}
                    >
                      <Plus className="h-4 w-4 transition-transform duration-200 group-hover:rotate-90" />
                      {!collapsed && <span className="ml-2">создать тикет</span>}
                    </Button>
                  </Link>
                </div>
              </SidebarGroupContent>
            </SidebarGroup>
          )}
          
          <SidebarGroup>
            <SidebarGroupLabel className={cn("px-2 text-xs font-semibold tracking-wider", collapsed && "sr-only")}>
              {isAdmin ? "управление" : "навигация"}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {navItems.map((item) => (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton asChild>
                      <Link
                        to={item.url}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 group relative",
                          isActive(item.url)
                            ? "bg-primary/10 text-primary border border-primary/20 shadow-sm"
                            : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                        )}
                      >
                        <item.icon className={cn(
                          "h-4 w-4 transition-colors duration-200",
                          isActive(item.url) ? "text-primary" : "group-hover:text-foreground"
                        )} />
                        {!collapsed && (
                          <>
                            <span className="truncate">{item.title}</span>
                            {isActive(item.url) && (
                              <ChevronRight className="h-3 w-3 ml-auto text-primary opacity-60" />
                            )}
                          </>
                        )}
                        {isActive(item.url) && (
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full" />
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="p-4 mt-auto border-t border-border/50">
          {!collapsed && (
            <button
              onClick={() => setShowChangelog(true)}
              className="w-full text-left px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors duration-200 flex items-center gap-3 rounded-lg hover:bg-accent/50"
            >
              <FileText className="h-4 w-4" />
              <div className="flex flex-col items-start">
                <span className="text-xs font-medium">v{systemVersion || "1.0.0"}</span>
                <span className="text-xs opacity-60">обновление системы: {formattedLastUpdate}</span>
              </div>
            </button>
          )}
          {collapsed && (
            <button
              onClick={() => setShowChangelog(true)}
              className="w-full flex justify-center p-2 text-muted-foreground hover:text-foreground transition-colors duration-200 rounded-lg hover:bg-accent/50"
            >
              <FileText className="h-4 w-4" />
            </button>
          )}
        </SidebarFooter>
      </Sidebar>

      <Sheet open={showChangelog} onOpenChange={setShowChangelog}>
        <SheetContent side="left" className="w-[400px] sm:w-[540px] bg-gradient-to-b from-background/95 to-background/80 backdrop-blur-sm">
          <SheetHeader>
            <SheetTitle className="text-lg font-semibold flex items-center gap-2">
              <FileText className="h-5 w-5" />
              журнал изменений
            </SheetTitle>
          </SheetHeader>
          <ScrollArea className="h-[calc(100vh-100px)] mt-6">
            <div className="space-y-6 pr-6">
              {changelogEntries.length > 0 ? (
                changelogEntries.map((entry) => (
                  <div key={entry.id} className="space-y-3 p-4 rounded-lg border border-border/50 bg-card/30">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                        v{entry.version}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {format(parseISO(entry.created_at), "dd.MM.yyyy, HH:mm")}
                      </span>
                    </div>
                    {Array.isArray(entry.description) ? (
                      <div className="text-sm space-y-2">
                        {entry.description.map((change, index) => (
                          <div key={index} className="flex items-start gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-primary/60 mt-2 flex-shrink-0" />
                            <span className="text-foreground leading-relaxed">{change}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-sm">
                        <div className="flex items-start gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary/60 mt-2 flex-shrink-0" />
                          <span className="text-foreground leading-relaxed">{entry.description}</span>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">История изменений пока пуста</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </>
  );
}