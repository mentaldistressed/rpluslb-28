import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { Ticket, Message, User } from "@/types";
import { useAuth } from "./AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface TicketsContextType {
  tickets: Ticket[];
  messages: Message[];
  getTicketById: (id: string) => Ticket | undefined;
  getTicketMessages: (ticketId: string) => Message[];
  getUserById: (id: string) => User | undefined;
  createTicket: (title: string, description: string, priority: Ticket["priority"]) => Promise<string>;
  updateTicketStatus: (ticketId: string, status: Ticket["status"]) => Promise<boolean>;
  assignTicket: (ticketId: string, userId: string) => Promise<boolean>;
  addMessage: (ticketId: string, content: string) => Promise<boolean>;
  isLoading: boolean;
  userCanAccessTicket: (ticketId: string) => boolean;
}

const TicketsContext = createContext<TicketsContextType | undefined>(undefined);

export function TicketsProvider({ children }: { children: ReactNode }) {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const sendEmailNotification = async (
    recipientEmail: string,
    subject: string,
    content: string,
    ticketId?: string,
    messageId?: string,
    userId?: string,
    ticketStatus?: string
  ) => {
    try {
      const { data, error } = await supabase.functions.invoke('send-email', {
        body: {
          to: recipientEmail,
          subject,
          body: content,
          ticketId,
          messageId,
          userId,
          ticketStatus
        }
      });

      if (error) {
        console.error("Ошибка отправки уведомления:", error);
        return false;
      }

      console.log("Уведомление успешно отправлено:", data);
      return true;
    } catch (error) {
      console.error("Ошибка вызова функции отправки уведомления:", error);
      return false;
    }
  };

  const userCanAccessTicket = (ticketId: string) => {
    if (!user) return false;
    
    if (user.role === 'admin') return true;
    
    const ticket = getTicketById(ticketId);
    if (!ticket) return false;
    
    return ticket.createdBy === user.id;
  };

  const fetchData = async () => {
    setIsLoading(true);
    
    try {
      const profilesPromise = supabase.from('profiles').select('*');
      const ticketsPromise = supabase.from('tickets').select('*').order('created_at', { ascending: false });
      const messagesPromise = supabase.from('messages').select('*').order('created_at', { ascending: true });
      
      const [profilesResponse, ticketsResponse, messagesResponse] = await Promise.all([
        profilesPromise,
        ticketsPromise,
        messagesPromise
      ]);
      
      if (profilesResponse.error) {
        console.error("Error fetching profiles:", profilesResponse.error);
      } else if (profilesResponse.data) {
        const mappedUsers = profilesResponse.data.map(profile => ({
          id: profile.id,
          email: profile.email,
          name: profile.name,
          role: profile.role as "admin" | "sublabel",
          avatar: profile.avatar
        }));
        setUsers(mappedUsers);
      }
      
      if (ticketsResponse.error) {
        console.error("Error fetching tickets:", ticketsResponse.error);
      } else if (ticketsResponse.data) {
        const mappedTickets: Ticket[] = ticketsResponse.data.map(ticket => ({
          id: ticket.id,
          title: ticket.title,
          description: ticket.description,
          status: ticket.status as "open" | "in-progress" | "closed",
          priority: ticket.priority as "low" | "medium" | "high",
          createdAt: ticket.created_at,
          updatedAt: ticket.updated_at,
          createdBy: ticket.created_by,
          assignedTo: ticket.assigned_to
        }));
        setTickets(mappedTickets);
      }
      
      if (messagesResponse.error) {
        console.error("Error fetching messages:", messagesResponse.error);
      } else if (messagesResponse.data) {
        const mappedMessages: Message[] = messagesResponse.data.map(message => ({
          id: message.id,
          ticketId: message.ticket_id,
          content: message.content,
          createdAt: message.created_at,
          userId: message.user_id
        }));
        setMessages(mappedMessages);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchData();
    
    const ticketsChannel = supabase
      .channel('tickets-channel')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'tickets' 
      }, async (payload) => {
        console.log('Ticket INSERT received:', payload);
        const newTicket = payload.new as any;
        
        setTickets(prevTickets => [
          {
            id: newTicket.id,
            title: newTicket.title,
            description: newTicket.description,
            status: newTicket.status,
            priority: newTicket.priority,
            createdAt: newTicket.created_at,
            updatedAt: newTicket.updated_at,
            createdBy: newTicket.created_by,
            assignedTo: newTicket.assigned_to
          },
          ...prevTickets
        ]);
        
        if (user && user.role !== 'admin') {
          const creator = users.find(u => u.id === newTicket.created_by);
          const admins = users.filter(u => u.role === 'admin');
          
          for (const admin of admins) {
            if (admin.email) {
              await sendEmailNotification(
                admin.email,
                `Новый тикет: ${newTicket.title}`,
                `<!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
                </head>
                <body>
                  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
                    <h2 style="color: #333; border-bottom: 1px solid #eee; padding-bottom: 10px;">Создан новый тикет</h2>
                    <p><strong>Заголовок:</strong> ${newTicket.title}</p>
                    <p><strong>Приоритет:</strong> ${
                      newTicket.priority === 'low' ? 'Низкий' : 
                      newTicket.priority === 'medium' ? 'Средний' : 'Высокий'
                    }</p>
                    <p><strong>Создан:</strong> ${creator?.name || 'Неизвестный пользователь'}</p>
                    <p><strong>Описание:</strong> ${newTicket.description}</p>
                    <div style="margin-top: 20px; text-align: center;">
                      <a href="${window.location.origin}/tickets/${newTicket.id}" 
                         style="display: inline-block; padding: 10px 20px; background-color: #4f46e5; color: white; text-decoration: none; border-radius: 5px;">
                        Перейти к тикету
                      </a>
                    </div>
                  </div>
                </body>
                </html>`,
                newTicket.id,
                undefined,
                creator?.id
              );
            }
          }
        }
      })
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'tickets' 
      }, async (payload) => {
        console.log('Ticket UPDATE received:', payload);
        const updatedTicket = payload.new as any;
        const oldTicket = payload.old as any;
        
        setTickets(prevTickets => prevTickets.map(ticket => 
          ticket.id === updatedTicket.id ? {
            ...ticket,
            title: updatedTicket.title,
            description: updatedTicket.description,
            status: updatedTicket.status,
            priority: updatedTicket.priority,
            updatedAt: updatedTicket.updated_at,
            assignedTo: updatedTicket.assigned_to
          } : ticket
        ));
        
        if (updatedTicket.status !== oldTicket.status) {
          const statusChanged = updatedTicket.status !== oldTicket.status;
          
          if (statusChanged && user) {
            const creator = users.find(u => u.id === updatedTicket.created_by);
            
            // Show notification for sublabel when their ticket is closed
            if (updatedTicket.status === 'closed' && creator && creator.role === 'sublabel') {
              // Add a special message to trigger notification
              await supabase
                .from('messages')
                .insert({
                  ticket_id: updatedTicket.id,
                  user_id: user.id,
                  content: 'RATING_REQUEST'
                });
                
              toast({
                title: "тикет закрыт",
                description: "пожалуйста, оцените качество решения вопроса",
              });
            }
            
            if (creator && creator.email && creator.role === 'sublabel') {
              await sendEmailNotification(
                creator.email,
                `Обновление статуса тикета: ${updatedTicket.title}`,
                `<!DOCTYPE html>
              <html>
              <head>
                  <meta charset="UTF-8">
                  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
              </head>
              <body>
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
                  <h2 style="color: #333; border-bottom: 1px solid #eee; padding-bottom: 10px;">Статус тикета обновлен</h2>
                  <p><strong>Заголовок:</strong> ${updatedTicket.title}</p>
                  <p><strong>Новый статус:</strong> ${
                    updatedTicket.status === 'open' ? 'Открыт' : 
                    updatedTicket.status === 'in-progress' ? 'В обработке' : 'Закрыт'
                  }</p>
                  <div style="margin-top: 20px; text-align: center;">
                    <a href="${window.location.origin}/tickets/${updatedTicket.id}" 
                       style="display: inline-block; padding: 10px 20px; background-color: #4f46e5; color: white; text-decoration: none; border-radius: 5px;">
                      Перейти к тикету
                    </a>
                  </div>
                </div>
              </body>
              </html>`,
                updatedTicket.id,
                undefined,
                undefined,
                updatedTicket.status
              );
            }
          }
        }
      })
      .on('postgres_changes', { 
        event: 'DELETE', 
        schema: 'public', 
        table: 'tickets' 
      }, (payload) => {
        console.log('Ticket DELETE received:', payload);
        const deletedTicket = payload.old as any;
        setTickets(prevTickets => prevTickets.filter(ticket => ticket.id !== deletedTicket.id));
      })
      .subscribe((status) => {
        console.log("Tickets subscription status:", status);
      });
      
    const messagesChannel = supabase
      .channel('messages-channel')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'messages' 
      }, async (payload) => {
        console.log('Message INSERT received:', payload);
        const newMessage = payload.new as any;
        
        setMessages(prevMessages => [
          ...prevMessages,
          {
            id: newMessage.id,
            ticketId: newMessage.ticket_id,
            content: newMessage.content,
            createdAt: newMessage.created_at,
            userId: newMessage.user_id
          }
        ]);
        
        const ticket = tickets.find(t => t.id === newMessage.ticket_id);
        if (!ticket) return;
        
        const sender = users.find(u => u.id === newMessage.user_id);
        if (!sender) return;
        
        if (sender.role === 'sublabel') {
          const admins = users.filter(u => u.role === 'admin');
          
          for (const admin of admins) {
            if (admin.email && admin.id !== newMessage.user_id) {
              await sendEmailNotification(
                admin.email,
                `Новое сообщение в тикете: ${ticket.title}`,
                `<!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
                </head>
                <body>
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
                      <h2 style="color: #333; border-bottom: 1px solid #eee; padding-bottom: 10px;">Новое сообщение в тикете</h2>
                      <p><strong>Тикет:</strong> ${ticket.title}</p>
                      <p><strong>От:</strong> ${sender.name}</p>
                      <p><strong>Сообщение:</strong> ${newMessage.content}</p>
                      <div style="margin-top: 20px; text-align: center;">
                        <a href="${window.location.origin}/tickets/${ticket.id}" 
                           style="display: inline-block; padding: 10px 20px; background-color: #4f46e5; color: white; text-decoration: none; border-radius: 5px;">
                          Перейти к тикету
                        </a>
                      </div>
                    </div>
                </body>
                </html>`,
                ticket.id,
                newMessage.id,
                sender.id
              );
            }
          }
        }
        
        if (sender.role === 'admin') {
          const creator = users.find(u => u.id === ticket.createdBy);
          
          if (creator && creator.email && creator.role === 'sublabel') {
            await sendEmailNotification(
              creator.email,
              `Новое сообщение в вашем тикете: ${ticket.title}`,
              `<!DOCTYPE html>
              <html>
              <head>
                  <meta charset="UTF-8">
                  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
              </head>
              <body>
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
                  <h2 style="color: #333; border-bottom: 1px solid #eee; padding-bottom: 10px;">Новое сообщение в вашем тикете</h2>
                  <p><strong>Тикет:</strong> ${ticket.title}</p>
                  <p><strong>От:</strong> ${sender.name} (Менеджер)</p>
                  <p><strong>Сообщение:</strong> ${newMessage.content}</p>
                  <div style="margin-top: 20px; text-align: center;">
                    <a href="${window.location.origin}/tickets/${ticket.id}" 
                       style="display: inline-block; padding: 10px 20px; background-color: #4f46e5; color: white; text-decoration: none; border-radius: 5px;">
                      Перейти к тикету
                    </a>
                  </div>
                </div>
              </body>
              </html>`,
              ticket.id,
              newMessage.id,
              sender.id
            );
          }
        }
        
        const audio = new Audio('/message.mp3');
        audio.volume = 0.5;
        audio.play().catch(e => console.log('Error playing sound:', e));
      })
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'messages' 
      }, (payload) => {
        console.log('Message UPDATE received:', payload);
        const updatedMessage = payload.new as any;
        setMessages(prevMessages => prevMessages.map(message => 
          message.id === updatedMessage.id ? {
            ...message,
            content: updatedMessage.content,
            createdAt: updatedMessage.created_at
          } : message
        ));
      })
      .on('postgres_changes', { 
        event: 'DELETE', 
        schema: 'public', 
        table: 'messages' 
      }, (payload) => {
        console.log('Message DELETE received:', payload);
        const deletedMessage = payload.old as any;
        setMessages(prevMessages => prevMessages.filter(message => message.id !== deletedMessage.id));
      })
      .subscribe((status) => {
        console.log("Messages subscription status:", status);
      });
      
    const profilesChannel = supabase
      .channel('profiles-channel')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'profiles' 
      }, (payload) => {
        console.log('Profiles change received:', payload);
        
        if (payload.eventType === 'INSERT') {
          const newProfile = payload.new as any;
          setUsers(prevUsers => [
            ...prevUsers,
            {
              id: newProfile.id,
              email: newProfile.email,
              name: newProfile.name,
              role: newProfile.role as "admin" | "sublabel",
              avatar: newProfile.avatar
            }
          ]);
        } else if (payload.eventType === 'UPDATE') {
          const updatedProfile = payload.new as any;
          setUsers(prevUsers => prevUsers.map(user => 
            user.id === updatedProfile.id ? {
              ...user,
              email: updatedProfile.email,
              name: updatedProfile.name,
              role: updatedProfile.role as "admin" | "sublabel",
              avatar: updatedProfile.avatar
            } : user
          ));
        } else if (payload.eventType === 'DELETE') {
          const deletedProfile = payload.old as any;
          setUsers(prevUsers => prevUsers.filter(user => user.id !== deletedProfile.id));
        }
      })
      .subscribe((status) => {
        console.log("Profiles subscription status:", status);
      });
      
    return () => {
      console.log("Cleaning up Supabase channels");
      supabase.removeChannel(ticketsChannel);
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(profilesChannel);
    };
  }, [user]);

  const getTicketById = (id: string) => {
    return tickets.find(ticket => ticket.id === id);
  };

  const getTicketMessages = (ticketId: string) => {
    return messages.filter(message => message.ticketId === ticketId);
  };

  const getUserById = (id: string) => {
    return users.find(user => user.id === id);
  };

  const createTicket = async (title: string, description: string, priority: Ticket["priority"]): Promise<string> => {
    if (!user) return Promise.reject("User not authenticated");
    
    setIsLoading(true);
    
    try {
      const { data: newTicket, error: ticketError } = await supabase
        .from('tickets')
        .insert({
          title,
          description,
          status: 'open',
          priority,
          created_by: user.id
        })
        .select()
        .single();
        
      if (ticketError) {
        throw ticketError;
      }
      
      const { error: messageError } = await supabase
        .from('messages')
        .insert({
          ticket_id: newTicket.id,
          content: description,
          user_id: user.id
        });
        
      if (messageError) {
        console.error("Error creating initial message:", messageError);
      }
      
      toast({
        title: "Тикет создан",
        description: "Ваш тикет был успешно создан",
      });
      
      setIsLoading(false);
      return newTicket.id;
    } catch (error) {
      console.error("Error creating ticket:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось создать тикет",
        variant: "destructive",
      });
      setIsLoading(false);
      throw error;
    }
  };

  const updateTicketStatus = async (ticketId: string, status: Ticket["status"]): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      const { error } = await supabase
        .from('tickets')
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', ticketId);
        
      if (error) {
        throw error;
      }
      
      toast({
        title: "статус обновлен",
        description: `статус тикета изменен на "${
          status === 'open' ? 'открыт' : 
          status === 'in-progress' ? 'в обработке' : 'закрыт'
        }"`,
      });
      
      setIsLoading(false);
      return true;
    } catch (error) {
      console.error("Error updating ticket status:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось обновить статус тикета",
        variant: "destructive",
      });
      setIsLoading(false);
      return false;
    }
  };

  const assignTicket = async (ticketId: string, userId: string): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      const { error } = await supabase
        .from('tickets')
        .update({ 
          assigned_to: userId,
          updated_at: new Date().toISOString()
        })
        .eq('id', ticketId);
        
      if (error) {
        throw error;
      }
      
      const assignedUser = users.find(u => u.id === userId);
      
      toast({
        title: "Тикет назначен",
        description: `Тикет назначен на ${assignedUser?.name || "пользователя"}`,
      });
      
      setIsLoading(false);
      return true;
    } catch (error) {
      console.error("Error assigning ticket:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось назначить тикет",
        variant: "destructive",
      });
      setIsLoading(false);
      return false;
    }
  };

  const addMessage = async (ticketId: string, content: string): Promise<boolean> => {
    if (!user) return Promise.reject("User not authenticated");
    
    setIsLoading(true);
    
    try {
      const { error: messageError } = await supabase
        .from('messages')
        .insert({
          ticket_id: ticketId,
          content,
          user_id: user.id
        });
        
      if (messageError) {
        throw messageError;
      }
      
      const { error: ticketError } = await supabase
        .from('tickets')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', ticketId);
        
      if (ticketError) {
        console.error("Error updating ticket timestamp:", ticketError);
      }
      
      setIsLoading(false);
      return true;
    } catch (error) {
      console.error("Error adding message:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось отправить сообщение",
        variant: "destructive",
      });
      setIsLoading(false);
      return false;
    }
  };

  return (
    <TicketsContext.Provider value={{
      tickets,
      messages,
      getTicketById,
      getTicketMessages,
      getUserById,
      createTicket,
      updateTicketStatus,
      assignTicket,
      addMessage,
      isLoading,
      userCanAccessTicket
    }}>
      {children}
    </TicketsContext.Provider>
  );
}

export function useTickets() {
  const context = useContext(TicketsContext);
  if (context === undefined) {
    throw new Error("useTickets must be used within a TicketsProvider");
  }
  return context;
}
