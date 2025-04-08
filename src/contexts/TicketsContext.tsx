
import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { Ticket, Message, User } from "@/types";
import { tickets as initialTickets, messages as initialMessages, users } from "@/lib/mock-data";
import { useAuth } from "./AuthContext";
import { useToast } from "@/components/ui/use-toast";

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
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    // Initialize with mock data
    // In a real app, you would fetch this from your API
    setTickets(initialTickets);
    setMessages(initialMessages);
    setIsLoading(false);
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
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const newTicket: Ticket = {
      id: `ticket-${Date.now()}`,
      title,
      description,
      status: "open",
      priority,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: user.id
    };
    
    const newMessage: Message = {
      id: `message-${Date.now()}`,
      ticketId: newTicket.id,
      content: description,
      createdAt: new Date().toISOString(),
      userId: user.id
    };
    
    setTickets(prev => [...prev, newTicket]);
    setMessages(prev => [...prev, newMessage]);
    
    toast({
      title: "Тикет создан",
      description: "Ваш тикет был успешно создан",
    });
    
    setIsLoading(false);
    return newTicket.id;
  };

  const updateTicketStatus = async (ticketId: string, status: Ticket["status"]): Promise<boolean> => {
    setIsLoading(true);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    setTickets(prev => 
      prev.map(ticket => 
        ticket.id === ticketId 
          ? { ...ticket, status, updatedAt: new Date().toISOString() } 
          : ticket
      )
    );
    
    toast({
      title: "Статус обновлен",
      description: `Статус тикета изменен на "${
        status === 'open' ? 'Открыт' : 
        status === 'in-progress' ? 'В работе' : 'Закрыт'
      }"`,
    });
    
    setIsLoading(false);
    return true;
  };

  const assignTicket = async (ticketId: string, userId: string): Promise<boolean> => {
    setIsLoading(true);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    setTickets(prev => 
      prev.map(ticket => 
        ticket.id === ticketId 
          ? { ...ticket, assignedTo: userId, updatedAt: new Date().toISOString() } 
          : ticket
      )
    );
    
    const assignedUser = users.find(u => u.id === userId);
    
    toast({
      title: "Тикет назначен",
      description: `Тикет назначен на ${assignedUser?.name || "пользователя"}`,
    });
    
    setIsLoading(false);
    return true;
  };

  const addMessage = async (ticketId: string, content: string): Promise<boolean> => {
    if (!user) return Promise.reject("User not authenticated");
    
    setIsLoading(true);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const newMessage: Message = {
      id: `message-${Date.now()}`,
      ticketId,
      content,
      createdAt: new Date().toISOString(),
      userId: user.id
    };
    
    setMessages(prev => [...prev, newMessage]);
    
    // Update the ticket's updatedAt time
    setTickets(prev => 
      prev.map(ticket => 
        ticket.id === ticketId 
          ? { ...ticket, updatedAt: new Date().toISOString() } 
          : ticket
      )
    );
    
    setIsLoading(false);
    return true;
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
