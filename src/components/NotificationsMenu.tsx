
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
import { format } from "date-fns";

interface Notification {
  id: string;
  ticketId: string;
  content: string;
  createdAt: string;
  read: boolean;
  ticketTitle?: string;
}

export function NotificationsMenu() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { user } = useAuth();
  
  useEffect(() => {
    if (!user || user.role !== 'sublabel') return;
    
    const fetchNotifications = async () => {
      // Get tickets that belong to the current user and are closed
      const { data: tickets } = await supabase
        .from('tickets')
        .select('id, title, status, updated_at')
        .eq('created_by', user.id)
        .eq('status', 'closed')
        .order('updated_at', { ascending: false })
        .limit(5);
        
      if (tickets && tickets.length > 0) {
        // Check if there are any RATING messages already for these tickets
        const { data: ratedTickets } = await supabase
          .from('messages')
          .select('ticket_id')
          .in('ticket_id', tickets.map(t => t.id))
          .eq('user_id', user.id)
          .ilike('content', 'RATING:%');
          
        const ratedTicketIds = new Set(ratedTickets?.map(rt => rt.ticket_id) || []);
        
        // Filter out tickets that have already been rated
        const unratedTickets = tickets.filter(t => !ratedTicketIds.has(t.id));
        
        setNotifications(
          unratedTickets.map(ticket => ({
            id: ticket.id,
            ticketId: ticket.id,
            ticketTitle: ticket.title,
            content: "Тикет закрыт. Пожалуйста, оцените качество решения вопроса",
            createdAt: ticket.updated_at,
            read: false
          }))
        );
      }
    };
    
    fetchNotifications();
    
    // Listen for ticket status changes to 'closed'
    const channel = supabase
      .channel('tickets-changes')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'tickets',
        filter: `created_by=eq.${user.id}`
      }, (payload) => {
        const updatedTicket = payload.new as any;
        const oldTicket = payload.old as any;
        
        // Check if the ticket status was changed to 'closed'
        if (updatedTicket.status === 'closed' && oldTicket.status !== 'closed') {
          // Add a new notification
          setNotifications(prev => {
            // Don't add duplicate notifications
            if (prev.some(n => n.ticketId === updatedTicket.id)) return prev;
            
            return [{
              id: updatedTicket.id,
              ticketId: updatedTicket.id,
              ticketTitle: updatedTicket.title,
              content: "Тикет закрыт. Пожалуйста, оцените качество решения вопроса",
              createdAt: updatedTicket.updated_at,
              read: false
            }, ...prev];
          });
        }
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const hasUnread = notifications.length > 0;
  
  const markAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.filter(n => n.id !== notificationId)
    );
  };

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
        <DropdownMenuGroup className="max-h-[300px] overflow-y-auto">
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
                  onClick={() => markAsRead(notification.id)}
                >
                  <div className="flex flex-col gap-1 w-full p-1">
                    <p className="text-sm font-medium">{notification.ticketTitle || 'Тикет'}</p>
                    <p className="text-sm">{notification.content}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(notification.createdAt), "dd.MM.yyyy HH:mm")}
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
