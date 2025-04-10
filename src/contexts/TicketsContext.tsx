
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
}

const TicketsContext = createContext<TicketsContextType | undefined>(undefined);

export function TicketsProvider({ children }: { children: ReactNode }) {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  // Function to fetch all data from the database
  const fetchData = async () => {
    setIsLoading(true);
    
    try {
      // Fetch users (profiles) in parallel
      const profilesPromise = supabase.from('profiles').select('*');
      const ticketsPromise = supabase.from('tickets').select('*').order('created_at', { ascending: false });
      const messagesPromise = supabase.from('messages').select('*').order('created_at', { ascending: true });
      
      const [profilesResponse, ticketsResponse, messagesResponse] = await Promise.all([
        profilesPromise,
        ticketsPromise,
        messagesPromise
      ]);
      
      // Handle profiles
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
      
      // Handle tickets
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
      
      // Handle messages
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
  
  // Initialize data and set up realtime subscriptions
  useEffect(() => {
    // Fetch initial data
    fetchData();
    
    // Set up realtime subscriptions
    const ticketsChannel = supabase
      .channel('tickets-changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'tickets' 
      }, (payload) => {
        console.log('Tickets change received:', payload);
        
        // Real-time update logic
        if (payload.eventType === 'INSERT') {
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
        } else if (payload.eventType === 'UPDATE') {
          const updatedTicket = payload.new as any;
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
        } else if (payload.eventType === 'DELETE') {
          const deletedTicket = payload.old as any;
          setTickets(prevTickets => prevTickets.filter(ticket => ticket.id !== deletedTicket.id));
        }
      })
      .subscribe();
      
    // Set up realtime subscription for messages
    const messagesChannel = supabase
      .channel('messages-changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'messages' 
      }, (payload) => {
        console.log('Messages change received:', payload);
        
        // Real-time update logic
        if (payload.eventType === 'INSERT') {
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
          
          // Play a sound for new messages
          const audio = new Audio('/message.mp3');
          audio.volume = 0.5;
          audio.play().catch(e => console.log('Error playing sound:', e));
        } else if (payload.eventType === 'UPDATE') {
          const updatedMessage = payload.new as any;
          setMessages(prevMessages => prevMessages.map(message => 
            message.id === updatedMessage.id ? {
              ...message,
              content: updatedMessage.content,
              createdAt: updatedMessage.created_at
            } : message
          ));
        } else if (payload.eventType === 'DELETE') {
          const deletedMessage = payload.old as any;
          setMessages(prevMessages => prevMessages.filter(message => message.id !== deletedMessage.id));
        }
      })
      .subscribe();
      
    // Set up realtime subscription for profiles
    const profilesChannel = supabase
      .channel('profiles-changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'profiles' 
      }, (payload) => {
        console.log('Profiles change received:', payload);
        
        // Real-time update logic
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
      .subscribe();
      
    return () => {
      supabase.removeChannel(ticketsChannel);
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(profilesChannel);
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
