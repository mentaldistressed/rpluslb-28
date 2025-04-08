
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTickets } from "@/contexts/TicketsContext";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TicketPriority } from "@/types";
import { ArrowLeft } from "lucide-react";

export default function NewTicketPage() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TicketPriority>("medium");
  const { createTicket, isLoading } = useTickets();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  if (!user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !description.trim()) return;
    
    const ticketId = await createTicket(title, description, priority);
    navigate(`/tickets/${ticketId}`);
  };

  return (
    <div>
      <div className="mb-6">
        <Button 
          variant="ghost" 
          size="sm" 
          className="font-normal gap-1 text-muted-foreground"
          onClick={() => navigate("/tickets")}
        >
          <ArrowLeft className="h-4 w-4" />
          назад к тикетам
        </Button>
      </div>
      
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>создание нового тикета</CardTitle>
          <CardDescription>
            заполните информацию для создания нового тикета
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">заголовок</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="краткое описание проблемы"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">описание</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="подробное описание проблемы или запроса"
                rows={5}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="priority">приоритет</Label>
              <Select
                value={priority}
                onValueChange={(value) => setPriority(value as TicketPriority)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="выберите приоритет" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">низкий</SelectItem>
                  <SelectItem value="medium">средний</SelectItem>
                  <SelectItem value="high">высокий</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "создание..." : "создать тикет"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
