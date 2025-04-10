
import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTickets } from "@/contexts/TicketsContext";
import { useAuth } from "@/contexts/AuthContext";
import { StatusBadge, PriorityBadge } from "@/components/StatusBadge";
import { UserAvatar } from "@/components/UserAvatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { ArrowLeft, Send, RefreshCw, Clock, MessageSquare, ChevronDown, ChevronUp } from "lucide-react";
import { TicketStatus } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { TicketClosedNotice } from "@/components/TicketClosedNotice";
import { NewsBanner } from "@/components/NewsBanner";

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
  const [showKeyboardHint, setShowKeyboardHint] = useState(true);
  
  // Get ticket and messages
  const ticket = ticketId ? getTicketById(ticketId) : undefined;
  const messages = ticketId ? getTicketMessages(ticketId) : [];
  
  // Extract key information from the first message for the description
  const firstMessage = messages.length > 0 ? messages[0] : null;
  const ticketSummary = firstMessage ? extractSummary(firstMessage.content) : '';
  
  // Function to extract a summary from the message content
  function extractSummary(content: string) {
    // Get first paragraph or first 150 characters, whichever is shorter
    const firstParagraph = content.split('\n')[0];
    return firstParagraph.length > 150 ? firstParagraph.substring(0, 147) + '...' : firstParagraph;
  }
  
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
    if (textareaRef.current && ticket?.status !== 'closed') {
      textareaRef.current.focus();
    }
  }, [ticket]);
  
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
  const isTicketClosed = ticket.status === 'closed';
  const isSublabel = user.role === 'sublabel';
  
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
    
    if (!newMessage.trim() || isSending || isTicketClosed) return;
    
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
      
      {/* News Banner */}
      <div className="mb-6">
        <NewsBanner />
      </div>
      
      <div className="space-y-6">
        {/* Header with ticket title and top-level details */}
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
            {/* Ticket summary card */}
            <Card className="mb-6">
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <CardTitle className="text-lg">описание</CardTitle>
                {firstMessage && (
                  <div className="text-xs text-muted-foreground">
                    {format(new Date(firstMessage.createdAt), "dd.MM.yyyy")}
                  </div>
                )}
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-line">{ticketSummary || ticket.description}</p>
                {firstMessage && firstMessage.content.length > ticketSummary.length && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="mt-2 text-xs text-muted-foreground hover:text-primary"
                    onClick={() => scrollToBottom()}
                  >
                    <ChevronDown className="h-3 w-3 mr-1" />
                    показать полное сообщение
                  </Button>
                )}
              </CardContent>
            </Card>
            
            {/* Messages */}
            <div className="border rounded-lg bg-card shadow-sm overflow-hidden">
              <div className="p-4 border-b bg-muted/30 flex items-center">
                <MessageSquare className="h-4 w-4 mr-2 text-muted-foreground" />
                <h3 className="font-medium">сообщения</h3>
                {messages.length > 0 && (
                  <span className="ml-2 text-xs bg-primary/10 text-primary py-0.5 px-1.5 rounded-full">
                    {messages.length}
                  </span>
                )}
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
              
              {/* Reply form with improved keyboard hint OR closed notice */}
              <div className="p-3 border-t">
                {isTicketClosed && isSublabel ? (
                  <TicketClosedNotice />
                ) : (
                  <form onSubmit={handleSendMessage} className="relative">
                    <Textarea
                      ref={textareaRef}
                      value={newMessage}
                      onChange={(e) => {
                        setNewMessage(e.target.value);
                        if (e.target.value.length > 0) {
                          setShowKeyboardHint(false);
                        } else {
                          setShowKeyboardHint(true);
                        }
                      }}
                      onKeyDown={handleKeyDown}
                      onFocus={() => setShowKeyboardHint(true)}
                      onBlur={() => setShowKeyboardHint(false)}
                      placeholder="введите Ваше сообщение..."
                      className="mb-2 resize-none min-h-[100px]"
                      rows={3}
                    />
                    
                    {/* New keyboard hint styling */}
                    {showKeyboardHint && (
                      <div className="absolute bottom-[60px] right-0 bg-background border shadow-sm rounded-md py-1 px-2 text-xs text-muted-foreground flex items-center gap-1 mr-3">
                        <kbd className="px-1.5 py-0.5 rounded bg-muted border text-[10px] font-medium">Shift</kbd>
                        <span>+</span>
                        <kbd className="px-1.5 py-0.5 rounded bg-muted border text-[10px] font-medium">Enter</kbd>
                        <span className="mx-1">для новой строки</span>
                        <kbd className="px-1.5 py-0.5 rounded bg-muted border text-[10px] font-medium ml-1">Enter</kbd>
                        <span className="mx-1">для отправки</span>
                      </div>
                    )}
                    
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
                )}
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
                    <StatusBadge status={ticket.status} />
                  </div>
                </div>
                
                <div className="space-y-2 pb-3 border-b">
                  <div className="text-sm font-medium">приоритет</div>
                  <div>
                    <PriorityBadge priority={ticket.priority} />
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
