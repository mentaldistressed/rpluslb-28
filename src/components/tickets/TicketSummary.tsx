
import { format } from "date-fns";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Message } from "@/types";

interface TicketSummaryProps {
  firstMessage: Message | null;
  ticketSummary: string;
  scrollToBottom: () => void;
}

export function TicketSummary({ firstMessage, ticketSummary, scrollToBottom }: TicketSummaryProps) {
  if (!firstMessage) return null;
  
  return (
    <Card className="mb-6">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <CardTitle className="text-lg">описание</CardTitle>
        <div className="text-xs text-muted-foreground">
          {format(new Date(firstMessage.createdAt), "dd.MM.yyyy")}
        </div>
      </CardHeader>
      <CardContent>
        <p className="whitespace-pre-line">{ticketSummary}</p>
        {firstMessage && firstMessage.content.length > ticketSummary.length && (
          <Button 
            variant="ghost" 
            size="sm" 
            className="mt-2 text-xs text-muted-foreground hover:text-primary"
            onClick={scrollToBottom}
          >
            <ChevronDown className="h-3 w-3 mr-1" />
            показать полное сообщение
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
