
import { useState, useEffect } from "react";
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
import { ArrowLeft } from "lucide-react";
import { TicketStatus } from "@/types";

export default function TicketDetailPage() {
  const { ticketId } = useParams<{ ticketId: string }>();
  const navigate = useNavigate();
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
  
  // Get ticket and messages
  const ticket = ticketId ? getTicketById(ticketId) : undefined;
  const messages = ticketId ? getTicketMessages(ticketId) : [];
  
  useEffect(() => {
    if (ticket) {
      setCurrentStatus(ticket.status);
    }
  }, [ticket]);
  
  if (!user) return null;
  if (!ticket) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold">тикет не найден</h2>
        <p className="text-muted-foreground mt-1">запрашиваемый тикет не существует или был удалён</p>
        <Button 
          variant="outline" 
          className="mt-4"
          onClick={() => navigate("/tickets")}
        >
          вернуться к списку тикетов
        </Button>
      </div>
    );
  }
  
  const creator = getUserById(ticket.createdBy);
  const assignee = ticket.assignedTo ? getUserById(ticket.assignedTo) : undefined;
  const isAdmin = user.role === 'admin';
  const canChangeStatus = isAdmin;
  
  const handleStatusChange = async (newStatus: TicketStatus) => {
    if (canChangeStatus && newStatus !== ticket.status) {
      await updateTicketStatus(ticket.id, newStatus);
      setCurrentStatus(newStatus);
    }
  };
  
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim()) return;
    
    await addMessage(ticket.id, newMessage);
    setNewMessage("");
  };

  return (
    <div>
      <div className="mb-6">
        <Button 
          variant="ghost" 
          size="sm" 
          className="font-normal gap-1 text-muted-foreground"
          onClick={() => navigate("/tickets")}
        >
          <ArrowLeft className="h-4 w-4" />
          назад к тикетам
        </Button>
      </div>
      
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">{ticket.title}</h1>
            <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
              <span>создан: {format(new Date(ticket.createdAt), "dd.MM.yyyy HH:mm")}</span>
              <span>•</span>
              <span>тикет #{ticket.id}</span>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-2 md:justify-end">
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
          {/* Ticket details */}
          <div className="flex-1 order-2 md:order-1">
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>описание</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-line">{ticket.description}</p>
              </CardContent>
            </Card>
            
            {/* Messages */}
            <div className="space-y-4">
              {messages.map((message) => {
                const messageUser = getUserById(message.userId);
                if (!messageUser) return null;
                
                const isCreator = messageUser.id === creator?.id;
                const isCurrentUser = messageUser.id === user.id;
                
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
                            {messageUser.role === 'admin' && !isCreator && (
                              <span className="bg-primary/10 text-primary text-xs px-1.5 py-0.5 rounded mr-1">
                                Менеджер
                              </span>
                            )}
                            {messageUser.name}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {format(new Date(message.createdAt), "dd.MM HH:mm")}
                          </div>
                        </div>
                        <div 
                          className={`p-3 rounded-lg ${
                            isCurrentUser 
                              ? 'bg-primary text-primary-foreground' 
                              : 'bg-muted border'
                          }`}
                        >
                          <p className="whitespace-pre-line">{message.content}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              
              {messages.length === 0 && (
                <div className="text-center py-8 bg-muted/20 border rounded-lg">
                  <p className="text-muted-foreground">пока нет сообщений в этом тикете</p>
                </div>
              )}
            </div>
            
            {/* Reply form */}
            <div className="mt-6">
              <form onSubmit={handleSendMessage}>
                <Textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="введите Ваше сообщение..."
                  className="mb-2"
                  rows={3}
                />
                <div className="flex justify-end">
                  <Button type="submit" disabled={isLoading || !newMessage.trim()}>
                    {isLoading ? "отправка..." : "отправить"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
          
          {/* Sidebar - Ticket Info */}
          <div className="w-full md:w-64 order-1 md:order-2">
            <Card>
              <CardHeader>
                <CardTitle>информация</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="text-sm font-medium mb-1">отправитель</div>
                  {creator && (
                    <div className="flex items-center gap-2">
                      <UserAvatar user={creator} size="sm" />
                      <div>{creator.name}</div>
                    </div>
                  )}
                </div>
                
                {assignee && (
                  <div>
                    <div className="text-sm font-medium mb-1">назначен</div>
                    <div className="flex items-center gap-2">
                      <UserAvatar user={assignee} size="sm" />
                      <div>{assignee.name}</div>
                    </div>
                  </div>
                )}
                
                <div>
                  <div className="text-sm font-medium mb-1">создан</div>
                  <div className="text-sm">{format(new Date(ticket.createdAt), "dd.MM.yyyy HH:mm")}</div>
                </div>
                
                <div>
                  <div className="text-sm font-medium mb-1">обновлен</div>
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
