
import { TicketStatus, TicketPriority } from "@/types";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: TicketStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const getStatusConfig = (status: TicketStatus) => {
    switch (status) {
      case "open":
        return { label: "Открыт", className: "bg-blue-100 text-blue-800 hover:bg-blue-100" };
      case "in-progress":
        return { label: "В работе", className: "bg-amber-100 text-amber-800 hover:bg-amber-100" };
      case "closed":
        return { label: "Закрыт", className: "bg-green-100 text-green-800 hover:bg-green-100" };
    }
  };

  const config = getStatusConfig(status);

  return (
    <Badge className={cn("font-medium", config.className, className)} variant="outline">
      {config.label}
    </Badge>
  );
}

interface PriorityBadgeProps {
  priority: TicketPriority;
  className?: string;
}

export function PriorityBadge({ priority, className }: PriorityBadgeProps) {
  const getPriorityConfig = (priority: TicketPriority) => {
    switch (priority) {
      case "low":
        return { label: "Низкий", className: "bg-slate-100 text-slate-800 hover:bg-slate-100" };
      case "medium":
        return { label: "Средний", className: "bg-amber-100 text-amber-800 hover:bg-amber-100" };
      case "high":
        return { label: "Высокий", className: "bg-red-100 text-red-800 hover:bg-red-100" };
    }
  };

  const config = getPriorityConfig(priority);

  return (
    <Badge className={cn("font-medium", config.className, className)} variant="outline">
      {config.label}
    </Badge>
  );
}
