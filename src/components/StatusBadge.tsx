
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
        return { label: "открыт", className: "bg-green-100 text-green-800 hover:bg-green-200" };
      case "in-progress":
        return { label: "в обработке", className: "bg-yellow-100 text-yellow-800 hover:bg-yellow-200" };
      case "closed":
        return { label: "закрыт", className: "bg-gray-200 text-gray-800 hover:bg-gray-300" };
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
        return { label: "низкий", className: "bg-slate-100 text-slate-800 hover:bg-slate-100" };
      case "medium":
        return { label: "средний", className: "bg-amber-100 text-amber-800 hover:bg-amber-100" };
      case "high":
        return { label: "высокий", className: "bg-red-100 text-red-800 hover:bg-red-100" };
    }
  };

  const config = getPriorityConfig(priority);

  return (
    <Badge className={cn("font-medium", config.className, className)} variant="outline">
      {config.label}
    </Badge>
  );
}
