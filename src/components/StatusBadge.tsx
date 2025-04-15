
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
        return { label: "открыт", className: "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200" };
      case "in-progress":
        return { label: "в обработке", className: "bg-amber-50 text-amber-700 hover:bg-amber-100 border-amber-200" };
      case "closed":
        return { label: "закрыт", className: "bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200" };
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
        return { label: "низкий", className: "bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200" };
      case "medium":
        return { label: "средний", className: "bg-amber-50 text-amber-700 hover:bg-amber-100 border-amber-200" };
      case "high":
        return { label: "высокий", className: "bg-rose-50 text-rose-700 hover:bg-rose-100 border-rose-200" };
    }
  };

  const config = getPriorityConfig(priority);

  return (
    <Badge className={cn("font-medium", config.className, className)} variant="outline">
      {config.label}
    </Badge>
  );
}
