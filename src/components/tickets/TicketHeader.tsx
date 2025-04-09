
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { ArrowLeft, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge, PriorityBadge } from "@/components/StatusBadge";
import { Ticket } from "@/types";

interface TicketHeaderProps {
  ticket: Ticket;
  canChangeStatus: boolean;
  currentStatus: string;
  handleStatusChange: (status: string) => void;
  isLoading: boolean;
}

export function TicketHeader({ 
  ticket, 
  canChangeStatus, 
  currentStatus, 
  handleStatusChange,
  isLoading 
}: TicketHeaderProps) {
  const navigate = useNavigate();

  return (
    <>
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
              onValueChange={(value) => handleStatusChange(value as any)}
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
    </>
  );
}

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
