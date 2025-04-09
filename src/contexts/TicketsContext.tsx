
import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { Ticket, Message, User } from "@/types";
import { useAuth } from "./AuthContext";
import { useToast } from "@/components/ui/use-toast";
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
}

const TicketsContext = createContext<TicketsContextType | undefined>(undefined);

export function TicketsProvider({ children }: { children: ReactNode }) {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const fetchInitialData = async () => {
      setIsLoading(true);
      
      // Fetch users (profiles)
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*');
        
      if (profilesError) {
        console.error("Error fetching profiles:", profilesError);
      } else if (profiles) {
        const mappedUsers = profiles.map(profile => ({
          id: profile.id,
          email: profile.email,
          name: profile.name,
          role: profile.role as "admin" | "sublabel",
          avatar: profile.avatar
        }));
        setUsers(mappedUsers);
      }
      
      // Fetch tickets
      const { data: fetchedTickets, error: ticketsError } = await supabase
        .from('tickets')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (ticketsError) {
        console.error("Error fetching tickets:", ticketsError);
      } else if (fetchedTickets) {
        const mappedTickets: Ticket[] = fetchedTickets.map(ticket => ({
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
      
      // Fetch messages
      const { data: fetchedMessages, error: messagesError } = await supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: true });
        
      if (messagesError) {
        console.error("Error fetching messages:", messagesError);
      } else if (fetchedMessages) {
        const mappedMessages: Message[] = fetchedMessages.map(message => ({
          id: message.id,
          ticketId: message.ticket_id,
          content: message.content,
          createdAt: message.created_at,
          userId: message.user_id
        }));
        setMessages(mappedMessages);
      }
      
      setIsLoading(false);
    };
    
    fetchInitialData();
    
    // Set up realtime subscription for tickets
    const ticketsSubscription = supabase
      .channel('public:tickets')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'tickets' 
      }, payload => {
        console.log('Tickets change received:', payload);
        fetchInitialData();
      })
      .subscribe();
      
    // Set up realtime subscription for messages
    const messagesSubscription = supabase
      .channel('public:messages')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'messages' 
      }, payload => {
        console.log('Messages change received:', payload);
        fetchInitialData();
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(ticketsSubscription);
      supabase.removeChannel(messagesSubscription);
    };
  }, []);

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
      // Insert ticket into database
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
      
      // Insert initial message (description)
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
          status === 'in-progress' ? 'в работе' : 'закрыт'
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
      // Add message to database
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
      
      // Update ticket's updated_at time
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
      isLoading
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
