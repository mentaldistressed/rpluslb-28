
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock } from "lucide-react";
import { ActivityItem } from "@/types";
import { cn } from "@/lib/utils";

interface ActivityListProps {
  activities: ActivityItem[];
  isAdmin: boolean;
}

export function ActivityList({ activities, isAdmin }: ActivityListProps) {
  const getActivityText = (activity: ActivityItem) => {
    switch (activity.type) {
      case 'create':
        return `Создан новый тикет #${activity.ticketId.substring(0, 4)}`;
      case 'update':
        return `Обновлен тикет #${activity.ticketId.substring(0, 4)}`;
      case 'close':
        return `Закрыт тикет #${activity.ticketId.substring(0, 4)}`;
      default:
        return `Действие с тикетом #${activity.ticketId.substring(0, 4)}`;
    }
  };

  return (
    <Card className="card-shadow border-border/40 transition-colors duration-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          {isAdmin ? 'последние активности' : 'ваши последние активности'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {activities.length > 0 ? (
          <div className="space-y-3">
            {activities.map((activity, index) => (
              <div key={activity.id} className={cn(
                index < activities.length - 1 ? "border-b pb-3 border-border/40" : "",
                "transition-colors duration-200"
              )}>
                <Link to={`/tickets/${activity.ticketId}`} className="hover:underline">
                  <p className="text-sm font-medium">{getActivityText(activity)}</p>
                  <p className="text-xs text-muted-foreground">{activity.date}, {activity.time}</p>
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-4 text-muted-foreground">
            нет недавних активностей
          </div>
        )}
      </CardContent>
    </Card>
  );
}
