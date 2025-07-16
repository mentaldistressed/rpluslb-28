import { Link } from "react-router-dom";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { Ticket } from "@/types";
import { StatusBadge } from "@/components/StatusBadge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, User, MessageSquare, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

interface TicketCardProps {
  ticket: Ticket;
  creatorName?: string;
  showCreator?: boolean;
  className?: string;
}

export function TicketCard({ ticket, creatorName, showCreator = false, className }: TicketCardProps) {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300';
      case 'medium':
        return 'border-yellow-200 bg-yellow-50 text-yellow-700 dark:border-yellow-800 dark:bg-yellow-950 dark:text-yellow-300';
      case 'low':
        return 'border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-300';
      default:
        return 'border-gray-200 bg-gray-50 text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'высокий';
      case 'medium':
        return 'средний';
      case 'low':
        return 'низкий';
      default:
        return priority;
    }
  };

  return (
    <Card className={cn(
      "group hover:shadow-lg transition-all duration-200 border-border/50 bg-card/50 backdrop-blur-sm hover:bg-card/80 hover:border-primary/20",
      className
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <Link 
              to={`/tickets/${ticket.id}`}
              className="group-hover:text-primary transition-colors duration-200"
            >
              <h3 className="font-semibold text-sm leading-tight mb-2 line-clamp-2 group-hover:text-primary">
                {ticket.title}
              </h3>
            </Link>
            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
              {ticket.description}
            </p>
          </div>
          <div className="flex flex-col gap-2 items-end flex-shrink-0">
            <StatusBadge status={ticket.status} />
            {/* <Badge className={cn("text-xs px-2 py-1", getPriorityColor(ticket.priority))}>
              {getPriorityLabel(ticket.priority)}
            </Badge> */}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>{format(new Date(ticket.createdAt), "dd MMM", { locale: ru })}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>{format(new Date(ticket.updatedAt), "HH:mm")}</span>
            </div>
            {showCreator && creatorName && (
              <div className="flex items-center gap-1">
                <User className="h-3 w-3" />
                <span className="truncate max-w-20">{creatorName}</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-1 text-primary/60">
            <MessageSquare className="h-3 w-3" />
            <span>#{ticket.id.slice(-6)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}