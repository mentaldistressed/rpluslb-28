
import { AlertCircle } from "lucide-react";

export const TicketClosedNotice = () => {
  return (
    <div className="p-4 border rounded-lg bg-muted/30 text-center space-y-2">
      <div className="flex justify-center">
        <AlertCircle className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="font-medium text-lg">тикет закрыт</h3>
      <p className="text-muted-foreground">
        этот тикет был закрыт. больше Вы не можете отправлять в него новые сообщения
      </p>
    </div>
  );
};
