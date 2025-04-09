
import { useState } from "react";
import { format } from "date-fns";
import { User } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge, PriorityBadge } from "@/components/StatusBadge";
import { UserAvatar } from "@/components/UserAvatar";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { User as UserType, Ticket } from "@/types";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TicketInfoSidebarProps {
  ticket: Ticket;
  creator?: UserType;
  assignee?: UserType;
  isAdmin: boolean;
  adminUsers: UserType[];
  assignTicket: (ticketId: string, userId: string) => Promise<boolean>;
  isLoading: boolean;
}

export function TicketInfoSidebar({ 
  ticket, 
  creator, 
  assignee, 
  isAdmin,
  adminUsers,
  assignTicket,
  isLoading
}: TicketInfoSidebarProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isAssigning, setIsAssigning] = useState(false);
  
  const handleAssignTicket = async (userId: string) => {
    if (!user) return;
    
    setIsAssigning(true);
    try {
      const success = await assignTicket(ticket.id, userId);
      
      if (success) {
        const assignedUser = adminUsers.find(u => u.id === userId);
        toast({
          title: "Тикет назначен",
          description: `Тикет назначен на ${assignedUser?.name || "пользователя"}`,
        });
      }
    } catch (error) {
      console.error("Error assigning ticket:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось назначить тикет",
        variant: "destructive",
      });
    } finally {
      setIsAssigning(false);
    }
  };
  
  const handleAssignToSelf = async () => {
    if (!user) return;
    await handleAssignTicket(user.id);
  };

  return (
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
        
        <div className="space-y-2 pb-3 border-b">
          <div className="text-sm font-medium">назначен</div>
          {assignee ? (
            <div className="flex items-center gap-2">
              <UserAvatar user={assignee} size="sm" />
              <div>{assignee.name}</div>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">Не назначен</div>
          )}

          {isAdmin && (
            <div className="mt-2 space-y-2">
              <Separator className="my-2" />
              
              {!assignee && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full flex items-center justify-center gap-1"
                  onClick={handleAssignToSelf}
                  disabled={isAssigning || isLoading}
                >
                  <User className="h-4 w-4" />
                  Взять в работу
                </Button>
              )}
              
              <Select
                value={ticket.assignedTo || ""}
                onValueChange={handleAssignTicket}
                disabled={isAssigning || isLoading}
              >
                <SelectTrigger className="w-full text-sm">
                  <SelectValue placeholder="Назначить на..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Не назначено</SelectItem>
                  {adminUsers.map(admin => (
                    <SelectItem key={admin.id} value={admin.id}>
                      {admin.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        
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
  );
}
