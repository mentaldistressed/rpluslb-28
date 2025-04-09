
import { RefreshCw, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export function TicketNotFound() {
  const navigate = useNavigate();
  
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="rounded-full bg-muted p-3 mb-4">
        <RefreshCw className="h-6 w-6 text-muted-foreground animate-spin" />
      </div>
      <h2 className="text-xl font-semibold">тикет не найден</h2>
      <p className="text-muted-foreground mt-1 text-center">
        запрашиваемый тикет не существует или был удалён
      </p>
      <Button 
        variant="outline" 
        className="mt-6"
        onClick={() => navigate("/tickets")}
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        вернуться к списку тикетов
      </Button>
    </div>
  );
}
