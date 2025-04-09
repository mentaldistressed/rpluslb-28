
import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { useTickets } from "@/contexts/TicketsContext";
import { useAuth } from "@/contexts/AuthContext";
import { TicketStatus, User } from "@/types";
import { useToast } from "@/hooks/use-toast";

// Components
import { TicketHeader } from "@/components/tickets/TicketHeader";
import { TicketSummary } from "@/components/tickets/TicketSummary";
import { TicketMessages } from "@/components/tickets/TicketMessages";
import { TicketInfoSidebar } from "@/components/tickets/TicketInfoSidebar";
import { TicketNotFound } from "@/components/tickets/TicketNotFound";

// Utils
import { extractSummary } from "@/utils/ticketUtils";

export default function TicketDetailPage() {
  const { ticketId } = useParams<{ ticketId: string }>();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  
  const { 
    getTicketById, 
    getTicketMessages, 
    getUserById,
    updateTicketStatus,
    assignTicket,
    addMessage,
    isLoading 
  } = useTickets();
  
  const { user } = useAuth();
  const [newMessage, setNewMessage] = useState("");
  const [currentStatus, setCurrentStatus] = useState<TicketStatus>();
  const [isSending, setIsSending] = useState(false);
  const [showKeyboardHint, setShowKeyboardHint] = useState(true);
  const [adminUsers, setAdminUsers] = useState<User[]>([]);
  
  // Get ticket and messages
  const ticket = ticketId ? getTicketById(ticketId) : undefined;
  const messages = ticketId ? getTicketMessages(ticketId) : [];
  
  // Extract key information from the first message for the description
  const firstMessage = messages.length > 0 ? messages[0] : null;
  const ticketSummary = firstMessage ? extractSummary(firstMessage.content) : '';
  
  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  // Set initial status from ticket
  useEffect(() => {
    if (ticket) {
      setCurrentStatus(ticket.status);
    }
  }, [ticket]);
  
  // Auto-focus textarea when page loads
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);
  
  // Collect admin users
  useEffect(() => {
    // Function to collect all admin users
    const collectAdminUsers = () => {
      const admins: User[] = [];
      
      // This is a workaround since getUserById is a function, not a collection
      // We use a known range of IDs to simulate iteration
      // In a real app, you would have a proper getAllUsers() function
      for (let i = 0; i < 100; i++) {
        const testId = `user-${i}`;
        const testUser = getUserById(testId);
        
        if (testUser && testUser.role === 'admin') {
          admins.push(testUser);
        }
      }
      
      // Also check all users from the messages
      messages.forEach(message => {
        const messageUser = getUserById(message.userId);
        if (messageUser && messageUser.role === 'admin' && !admins.some(admin => admin.id === messageUser.id)) {
          admins.push(messageUser);
        }
      });
      
      // Add the current user if they're an admin
      if (user && user.role === 'admin' && !admins.some(admin => admin.id === user.id)) {
        admins.push(user);
      }
      
      // Add the assignee if they're an admin
      if (ticket && ticket.assignedTo) {
        const assigneeUser = getUserById(ticket.assignedTo);
        if (assigneeUser && assigneeUser.role === 'admin' && !admins.some(admin => admin.id === assigneeUser.id)) {
          admins.push(assigneeUser);
        }
      }
      
      return admins;
    };
    
    setAdminUsers(collectAdminUsers());
  }, [getUserById, messages, user, ticket]);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  
  if (!user) return null;
  
  if (!ticket) {
    return <TicketNotFound />;
  }
  
  const creator = getUserById(ticket.createdBy);
  const assignee = ticket.assignedTo ? getUserById(ticket.assignedTo) : undefined;
  const isAdmin = user.role === 'admin';
  const canChangeStatus = isAdmin;
  
  const getStatusLabel = (status: TicketStatus) => {
    switch(status) {
      case 'open': return 'открыт';
      case 'in-progress': return 'в обработке';
      case 'closed': return 'закрыт';
      default: return status;
    }
  };
  
  const handleStatusChange = async (newStatus: TicketStatus) => {
    if (canChangeStatus && newStatus !== ticket.status) {
      setCurrentStatus(newStatus);
      const success = await updateTicketStatus(ticket.id, newStatus);
      
      if (success) {
        // Add system message about status change
        const statusMessage = `Статус тикета изменен на "${getStatusLabel(newStatus)}"`;
        toast({
          title: "Статус изменен",
          description: statusMessage,
        });
      }
    }
  };
  
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (!newMessage.trim() || isSending) return;
    
    setIsSending(true);
    
    try {
      const success = await addMessage(ticket.id, newMessage);
      if (success) {
        setNewMessage("");
        // Focus textarea again after sending
        setTimeout(() => {
          if (textareaRef.current) {
            textareaRef.current.focus();
          }
        }, 0);
      }
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsSending(false);
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Hide keyboard hint when user starts typing
    if (showKeyboardHint && newMessage.length > 0) {
      setShowKeyboardHint(false);
    }
    
    // Send message on Enter (without Shift)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="animate-fade-in">
      <TicketHeader 
        ticket={ticket}
        canChangeStatus={canChangeStatus}
        currentStatus={currentStatus as string}
        handleStatusChange={handleStatusChange}
        isLoading={isLoading}
      />
      
      <div className="flex flex-col md:flex-row gap-6">
        {/* Ticket details and messages */}
        <div className="flex-1 order-2 md:order-1">
          <TicketSummary 
            firstMessage={firstMessage} 
            ticketSummary={ticketSummary}
            scrollToBottom={scrollToBottom}
          />
          
          <TicketMessages 
            messages={messages}
            newMessage={newMessage}
            setNewMessage={setNewMessage}
            handleSendMessage={handleSendMessage}
            handleKeyDown={handleKeyDown}
            isLoading={isLoading}
            isSending={isSending}
            showKeyboardHint={showKeyboardHint}
            setShowKeyboardHint={setShowKeyboardHint}
            getUserById={getUserById}
            currentUser={user}
            creator={creator}
            messagesEndRef={messagesEndRef}
            textareaRef={textareaRef}
          />
        </div>
        
        {/* Sidebar - Ticket Info */}
        <div className="w-full md:w-72 order-1 md:order-2">
          <TicketInfoSidebar 
            ticket={ticket}
            creator={creator}
            assignee={assignee}
            isAdmin={isAdmin}
            adminUsers={adminUsers}
            assignTicket={assignTicket}
            isLoading={isLoading}
          />
        </div>
      </div>
    </div>
  );
}
