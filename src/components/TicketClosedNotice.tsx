
import { AlertCircle } from "lucide-react";

export const TicketClosedNotice = () => {
  return (
    <div className="p-6 rounded-xl bg-secondary/70 text-center space-y-3 border border-border/50 card-shadow">
      <div className="flex justify-center">
        <div className="bg-secondary/90 h-12 w-12 rounded-full flex items-center justify-center">
          <AlertCircle className="h-6 w-6 text-muted-foreground" />
        </div>
      </div>
      <h3 className="font-medium text-lg">тикет закрыт</h3>
      <p className="text-muted-foreground max-w-md mx-auto">
        этот тикет был закрыт. больше Вы не можете отправлять в него новые сообщения
      </p>
    </div>
  );
};
