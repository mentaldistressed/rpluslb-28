
import { AlertCircle } from "lucide-react";

export const TicketClosedNotice = () => {
  return (
    <div className="p-4 border rounded-lg bg-muted/30 text-center space-y-2">
      <div className="flex justify-center">
        <AlertCircle className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="font-medium text-lg">Тикет закрыт</h3>
      <p className="text-muted-foreground">
        Этот тикет был закрыт. Вы не можете отправлять новые сообщения.
      </p>
    </div>
  );
};
