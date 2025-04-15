
import { AlertCircle } from "lucide-react";

export const TicketClosedNotice = () => {
  return (
    <div className="p-6 border rounded-lg bg-muted/50 text-center space-y-3 shadow-sm">
      <div className="flex justify-center">
        <AlertCircle className="h-8 w-8 text-slate-400" />
      </div>
      <h3 className="font-medium text-lg">тикет закрыт</h3>
      <p className="text-muted-foreground max-w-md mx-auto">
        этот тикет был закрыт. больше Вы не можете отправлять в него новые сообщения
      </p>
    </div>
  );
};
