
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";

interface Notification {
  id: string;
  ticketId: string;
  content: string;
  createdAt: string;
  read: boolean;
}

export function NotificationsMenu() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { user } = useAuth();
  
  useEffect(() => {
    if (!user) return;
    
    const fetchNotifications = async () => {
      const { data: messages } = await supabase
        .from('messages')
        .select('*')
        .eq('content', 'RATING_REQUEST')
        .order('created_at', { ascending: false })
        .limit(5);
        
      if (messages) {
        setNotifications(
          messages.map(msg => ({
            id: msg.id,
            ticketId: msg.ticket_id,
            content: "Тикет закрыт. Пожалуйста, оцените качество решения вопроса",
            createdAt: msg.created_at,
            read: false
          }))
        );
      }
    };
    
    fetchNotifications();
    
    const channel = supabase
      .channel('notifications')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: 'content=eq.RATING_REQUEST'
      }, (payload) => {
        const newMessage = payload.new as any;
        setNotifications(prev => [{
          id: newMessage.id,
          ticketId: newMessage.ticket_id,
          content: "Тикет закрыт. Пожалуйста, оцените качество решения вопроса",
          createdAt: newMessage.created_at,
          read: false
        }, ...prev]);
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const hasUnread = notifications.some(n => !n.read);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {hasUnread && (
            <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-primary" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80" align="end" forceMount>
        <DropdownMenuLabel>уведомления</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          {notifications.length === 0 ? (
            <div className="p-4 text-sm text-center text-muted-foreground">
              нет новых уведомлений
            </div>
          ) : (
            notifications.map((notification) => (
              <DropdownMenuItem key={notification.id} asChild>
                <Link 
                  to={`/tickets/${notification.ticketId}`}
                  className="cursor-pointer"
                >
                  <div className="flex flex-col gap-1">
                    <p className="text-sm">{notification.content}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(notification.createdAt).toLocaleString('ru-RU')}
                    </p>
                  </div>
                </Link>
              </DropdownMenuItem>
            ))
          )}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
