
import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTickets } from "@/contexts/TicketsContext";
import { useAuth } from "@/contexts/AuthContext";
import { StatusBadge, PriorityBadge } from "@/components/StatusBadge";
import { UserAvatar } from "@/components/UserAvatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { ArrowLeft, Send, PaperPlaneIcon, ArrowUpIcon, RefreshCw, Clock } from "lucide-react";
import { TicketStatus } from "@/types";
import { useToast } from "@/hooks/use-toast";

export default function TicketDetailPage() {
  const { ticketId } = useParams<{ ticketId: string }>();
  const navigate = useNavigate();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  
  const { 
    getTicketById, 
    getTicketMessages, 
    getUserById,
    updateTicketStatus,
    addMessage,
    isLoading 
  } = useTickets();
  
  const { user } = useAuth();
  const [newMessage, setNewMessage] = useState("");
  const [currentStatus, setCurrentStatus] = useState<TicketStatus>();
  const [isSending, setIsSending] = useState(false);
  
  // Get ticket and messages
  const ticket = ticketId ? getTicketById(ticketId) : undefined;
  const messages = ticketId ? getTicketMessages(ticketId) : [];
  
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
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  
  if (!user) return null;
  
  if (!ticket) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4">
        <div className="rounded-full bg-muted p-3 mb-4">
          <RefreshCw className="h-6 w-6 text-muted-foreground animate-spin" />
        </div>
        <h2 className="text-xl font-semibold">тикет не найден</h2>
        <p className="text-muted-foreground mt-1 text-center">
          запрашиваемый тикет не существует или был удалён
        </p>
        <Button 
          variant="outline" 
          className="mt-6"
          onClick={() => navigate("/tickets")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          вернуться к списку тикетов
        </Button>
      </div>
    );
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
    // Send message on Enter (without Shift)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <Button 
          variant="ghost" 
          size="sm" 
          className="font-normal gap-1 text-muted-foreground hover:text-foreground transition-colors"
          onClick={() => navigate("/tickets")}
        >
          <ArrowLeft className="h-4 w-4" />
          назад к тикетам
        </Button>
      </div>
      
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 bg-card border rounded-lg p-4 shadow-sm">
          <div>
            <h1 className="text-2xl font-bold">{ticket.title}</h1>
            <div className="flex flex-wrap items-center gap-2 mt-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                <span>создан: {format(new Date(ticket.createdAt), "dd.MM.yyyy HH:mm")}</span>
              </div>
              <span className="text-muted-foreground/50">•</span>
              <span>тикет #{ticket.id.substring(0, 8)}</span>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-2 md:justify-end mt-2 md:mt-0">
            <PriorityBadge priority={ticket.priority} />
            
            {canChangeStatus ? (
              <Select
                value={currentStatus}
                onValueChange={(value) => handleStatusChange(value as TicketStatus)}
                disabled={isLoading}
              >
                <SelectTrigger className="w-[130px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">открыт</SelectItem>
                  <SelectItem value="in-progress">в обработке</SelectItem>
                  <SelectItem value="closed">закрыт</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <StatusBadge status={ticket.status} />
            )}
          </div>
        </div>
        
        <div className="flex flex-col md:flex-row gap-6">
          {/* Ticket details and messages */}
          <div className="flex-1 order-2 md:order-1">
            <Card className="mb-6">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">описание</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-line">{ticket.description}</p>
              </CardContent>
            </Card>
            
            {/* Messages */}
            <div className="border rounded-lg bg-card shadow-sm overflow-hidden">
              <div className="p-4 border-b bg-muted/30">
                <h3 className="font-medium">сообщения</h3>
              </div>
              
              <div className="p-4 space-y-4 max-h-[500px] overflow-y-auto">
                {messages.length === 0 ? (
                  <div className="text-center py-12 bg-muted/20 rounded-lg">
                    <p className="text-muted-foreground">пока нет сообщений в этом тикете</p>
                    <p className="text-xs text-muted-foreground/70 mt-1">отправьте первое сообщение ниже</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((message) => {
                      const messageUser = getUserById(message.userId);
                      if (!messageUser) return null;
                      
                      const isCreator = messageUser.id === creator?.id;
                      const isCurrentUser = messageUser.id === user.id;
                      const messageTime = format(new Date(message.createdAt), "dd.MM HH:mm");
                      
                      return (
                        <div 
                          key={message.id} 
                          className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className={`flex gap-3 max-w-[85%] ${isCurrentUser ? 'flex-row-reverse' : ''}`}>
                            <div className="flex-shrink-0 pt-1">
                              <UserAvatar user={messageUser} />
                            </div>
                            <div>
                              <div className={`mb-1 flex items-center gap-2 ${isCurrentUser ? 'justify-end' : ''}`}>
                                <div className="font-medium text-sm">
                                  {messageUser.role === 'admin' && (
                                    <span className="bg-primary/10 text-primary text-xs px-1.5 py-0.5 rounded mr-1">
                                      Менеджер
                                    </span>
                                  )}
                                  {messageUser.name}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {messageTime}
                                </div>
                              </div>
                              <div 
                                className={`p-3 rounded-lg ${
                                  isCurrentUser 
                                    ? 'bg-primary text-primary-foreground' 
                                    : 'bg-muted'
                                }`}
                              >
                                <p className="whitespace-pre-line">{message.content}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>
              
              {/* Reply form */}
              <div className="p-3 border-t">
                <form onSubmit={handleSendMessage} className="relative">
                  <Textarea
                    ref={textareaRef}
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="введите Ваше сообщение..."
                    className="mb-2 pr-10 resize-none"
                    rows={3}
                  />
                  <div className="absolute right-3 bottom-4 text-xs text-muted-foreground">
                    Shift+Enter для новой строки, Enter для отправки
                  </div>
                  <div className="flex justify-end">
                    <Button 
                      type="submit" 
                      disabled={isLoading || isSending || !newMessage.trim()}
                      className="gap-2"
                    >
                      {isLoading || isSending ? (
                        <>
                          <RefreshCw className="h-4 w-4 animate-spin" />
                          отправка...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4" />
                          отправить
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </div>
          
          {/* Sidebar - Ticket Info */}
          <div className="w-full md:w-72 order-1 md:order-2">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">информация</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 pb-3 border-b">
                  <div className="text-sm font-medium">статус</div>
                  <div>
                    <StatusBadge status={ticket.status} size="lg" />
                  </div>
                </div>
                
                <div className="space-y-2 pb-3 border-b">
                  <div className="text-sm font-medium">приоритет</div>
                  <div>
                    <PriorityBadge priority={ticket.priority} size="lg" />
                  </div>
                </div>
                
                <div className="space-y-2 pb-3 border-b">
                  <div className="text-sm font-medium">отправитель</div>
                  {creator && (
                    <div className="flex items-center gap-2">
                      <UserAvatar user={creator} size="sm" />
                      <div>{creator.name}</div>
                    </div>
                  )}
                </div>
                
                {assignee && (
                  <div className="space-y-2 pb-3 border-b">
                    <div className="text-sm font-medium">назначен</div>
                    <div className="flex items-center gap-2">
                      <UserAvatar user={assignee} size="sm" />
                      <div>{assignee.name}</div>
                    </div>
                  </div>
                )}
                
                <div className="space-y-2 pb-3 border-b">
                  <div className="text-sm font-medium">создан</div>
                  <div className="text-sm">{format(new Date(ticket.createdAt), "dd.MM.yyyy HH:mm")}</div>
                </div>
                
                <div className="space-y-2">
                  <div className="text-sm font-medium">обновлен</div>
                  <div className="text-sm">{format(new Date(ticket.updatedAt), "dd.MM.yyyy HH:mm")}</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
