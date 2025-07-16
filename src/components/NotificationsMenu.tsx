import { Bell, CheckCircle, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
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
import { toast } from "sonner";

interface Notification {
  id: string;
  ticketId: string;
  content: string;
  createdAt: string;
  read: boolean;
  ticketTitle?: string;
  type: 'rating_request' | 'status_change' | 'new_message' | 'new_ticket';
}

export function NotificationsMenu() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { user } = useAuth();
  
  const markAsRead = async (notificationId: string) => {
    try {
      // Since we don't have a notifications table yet, we're creating notifications
      // dynamically. In a real implementation, we would update a real table.
      // For now we'll just update our local state
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
      
      toast.success('уведомление помечено как прочитанное');
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast.error('не удалось пометить уведомление как прочитанное');
    }
  };
  
  const markAllAsRead = async () => {
    try {
      // Since we don't have a notifications table yet, we're updating our local state
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      toast.success('все уведомления помечены как прочитанные');
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      toast.error('не удалось пометить уведомления как прочитанные');
    }
  };

  useEffect(() => {
    if (!user) return;
    
    const fetchNotifications = async () => {
      const tempNotifications: Notification[] = [];
      
      if (user.role === 'sublabel') {
        // Get user's tickets for sublabel notifications
        const { data: userTickets } = await supabase
          .from('tickets')
          .select('id, title, status, updated_at')
          .eq('created_by', user.id);
          
        if (!userTickets) return;
        
        // Get unread messages in user's tickets
        const { data: messages } = await supabase
          .from('messages')
          .select('*')
          .in('ticket_id', userTickets.map(t => t.id))
          .neq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(10);
          
        // Get closed tickets needing rating
        const closedTickets = userTickets.filter(t => t.status === 'closed');
        if (closedTickets.length > 0) {
          const { data: ratedTickets } = await supabase
            .from('messages')
            .select('ticket_id')
            .in('ticket_id', closedTickets.map(t => t.id))
            .eq('user_id', user.id)
            .ilike('content', 'RATING:%');
            
          const ratedTicketIds = new Set(ratedTickets?.map(rt => rt.ticket_id) || []);
          const unratedTickets = closedTickets.filter(t => !ratedTicketIds.has(t.id));
          
          const ratingNotifications: Notification[] = unratedTickets.map(ticket => ({
            id: `rating-${ticket.id}`,
            ticketId: ticket.id,
            ticketTitle: ticket.title,
            content: "тикет закрыт. пожалуйста, оцените качество решения вопроса",
            createdAt: ticket.updated_at,
            read: false,
            type: 'rating_request'
          }));
          
          tempNotifications.push(...ratingNotifications);
        }
        
        // Add message notifications
        if (messages) {
          const messageNotifications: Notification[] = messages.map(message => ({
            id: message.id,
            ticketId: message.ticket_id,
            content: "новое сообщение в вашем тикете",
            createdAt: message.created_at,
            read: false,
            type: 'new_message'
          }));
          
          tempNotifications.push(...messageNotifications);
        }
      } else if (user.role === 'admin') {
        // Get recent unread messages for admin
        const { data: messages } = await supabase
          .from('messages')
          .select('*, tickets(title)')
          .order('created_at', { ascending: false })
          .limit(10);
          
        // Get recent tickets for admin
        const { data: recentTickets } = await supabase
          .from('tickets')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(5);
          
        if (messages) {
          const messageNotifications: Notification[] = messages
            .filter(message => message.user_id !== user.id)
            .map(message => ({
              id: message.id,
              ticketId: message.ticket_id,
              ticketTitle: message.tickets?.title,
              content: "новое сообщение в тикете",
              createdAt: message.created_at,
              read: false,
              type: 'new_message'
            }));
            
          tempNotifications.push(...messageNotifications);
        }
        
        if (recentTickets) {
          const ticketNotifications: Notification[] = recentTickets.map(ticket => ({
            id: `new-ticket-${ticket.id}`,
            ticketId: ticket.id,
            ticketTitle: ticket.title,
            content: "создан новый тикет",
            createdAt: ticket.created_at,
            read: false,
            type: 'new_ticket'
          }));
          
          tempNotifications.push(...ticketNotifications);
        }
      }
      
      // Retrieve read state from localStorage as a temporary storage
      // In a real application, this would come from the database
      const storedReadStates = localStorage.getItem('notificationReadStates');
      const readStates = storedReadStates ? JSON.parse(storedReadStates) : {};
      
      // Apply read states to notifications
      const notificationsWithReadState = tempNotifications.map(notification => ({
        ...notification,
        read: readStates[notification.id] === true
      }));
      
      setNotifications(notificationsWithReadState);
    };
    
    fetchNotifications();
    
    // Subscribe to realtime updates
    const channel = supabase
      .channel('notifications')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages'
      }, (payload) => {
        const newMessage = payload.new as any;
        
        if (user.role === 'sublabel') {
          // Only add notification if message is in user's ticket
          if (newMessage.user_id !== user.id) {
            setNotifications(prev => [{
              id: newMessage.id,
              ticketId: newMessage.ticket_id,
              content: "новое сообщение в вашем тикете",
              createdAt: newMessage.created_at,
              read: false,
              type: 'new_message'
            }, ...prev]);
          }
        } else if (user.role === 'admin' && newMessage.user_id !== user.id) {
          setNotifications(prev => [{
            id: newMessage.id,
            ticketId: newMessage.ticket_id,
            content: "новое сообщение в тикете",
            createdAt: newMessage.created_at,
            read: false,
            type: 'new_message'
          }, ...prev]);
        }
      })
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'tickets'
      }, (payload) => {
        const newTicket = payload.new as any;
        
        if (user.role === 'admin') {
          setNotifications(prev => [{
            id: `new-ticket-${newTicket.id}`,
            ticketId: newTicket.id,
            ticketTitle: newTicket.title,
            content: "создан новый тикет",
            createdAt: newTicket.created_at,
            read: false,
            type: 'new_ticket'
          }, ...prev]);
        }
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'tickets'
      }, (payload) => {
        const updatedTicket = payload.new as any;
        const oldTicket = payload.old as any;
        
        if (user.role === 'sublabel' && updatedTicket.created_by === user.id) {
          if (updatedTicket.status !== oldTicket.status) {
            setNotifications(prev => [{
              id: `status-${updatedTicket.id}-${Date.now()}`,
              ticketId: updatedTicket.id,
              ticketTitle: updatedTicket.title,
              content: `статус тикета изменен на: ${
                updatedTicket.status === 'open' ? 'открыт' :
                updatedTicket.status === 'in-progress' ? 'в обработке' : 'закрыт'
              }`,
              createdAt: updatedTicket.updated_at,
              read: false,
              type: 'status_change'
            }, ...prev]);
          }
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Override markAsRead to save read states to localStorage
  const handleMarkAsRead = async (notificationId: string) => {
    // Store read state in localStorage
    const storedReadStates = localStorage.getItem('notificationReadStates');
    const readStates = storedReadStates ? JSON.parse(storedReadStates) : {};
    readStates[notificationId] = true;
    localStorage.setItem('notificationReadStates', JSON.stringify(readStates));
    
    // Update state
    markAsRead(notificationId);
  };
  
  // Override markAllAsRead to save all read states to localStorage
  const handleMarkAllAsRead = async () => {
    // Store read states in localStorage
    const readStates = notifications.reduce((acc, notification) => {
      acc[notification.id] = true;
      return acc;
    }, {} as Record<string, boolean>);
    localStorage.setItem('notificationReadStates', JSON.stringify(readStates));
    
    // Update state
    markAllAsRead();
  };

  const hasUnread = notifications.some(n => !n.read);
  
  return (
    <DropdownMenu>
      {/* <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {hasUnread && (
            <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-primary" />
          )}
        </Button>
      </DropdownMenuTrigger> */}
      <DropdownMenuContent className="w-96" align="end" forceMount>
        <div className="flex items-center justify-between px-4 py-2">
          <DropdownMenuLabel className="text-base font-semibold">
            уведомления
          </DropdownMenuLabel>
          {notifications.length > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={markAllAsRead}
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
            >
              <CheckCircle className="h-4 w-4" />
              все прочитаны
            </Button>
          )}
        </div>
        <DropdownMenuSeparator />
        <ScrollArea className="h-[300px] w-full">
          <DropdownMenuGroup className="p-2">
            {notifications.length === 0 ? (
              <div className="p-4 text-sm text-center text-muted-foreground">
                нет новых уведомлений
              </div>
            ) : (
              notifications
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .map((notification) => (
                  <div 
                    key={notification.id} 
                    className="flex items-center gap-2 hover:bg-accent/50 rounded-md transition-colors"
                  >
                    <DropdownMenuItem asChild className="flex-1 w-full">
                      <Link 
                        to={`/tickets/${notification.ticketId}`}
                        className="cursor-pointer flex justify-between items-center w-full"
                      >
                        <div className="flex flex-col gap-1 w-full p-2">
                          <p className="text-sm font-medium">
                            {notification.ticketTitle || 'Тикет'}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {notification.content}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(notification.createdAt), "dd.MM.yyyy HH:mm")}
                          </p>
                        </div>
                        {!notification.read && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 opacity-50 hover:opacity-100"
                            onClick={(e) => {
                              e.preventDefault();
                              markAsRead(notification.id);
                            }}
                          >
                            <CheckCircle className="h-4 w-4" />
                            <span className="sr-only">пометить как прочитанное</span>
                          </Button>
                        )}
                      </Link>
                    </DropdownMenuItem>
                  </div>
                ))
            )}
          </DropdownMenuGroup>
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
