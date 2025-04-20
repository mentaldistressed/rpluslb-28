
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTickets } from "@/contexts/TicketsContext";
import { useAuth } from "@/contexts/AuthContext";
import { StatusBadge, PriorityBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { Plus, Search } from "lucide-react";
import { Ticket } from "@/types";

export default function TicketsPage() {
  const { tickets, getUserById } = useTickets();
  const { user } = useAuth();
  const [filteredTickets, setFilteredTickets] = useState<Ticket[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    if (!user) return;
    
    let userTickets = user.role === 'admin' 
      ? [...tickets]
      : tickets.filter(ticket => ticket.createdBy === user.id);
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      userTickets = userTickets.filter(ticket => 
        ticket.title.toLowerCase().includes(query) || 
        ticket.description.toLowerCase().includes(query)
      );
    }
    
    if (statusFilter !== "all") {
      userTickets = userTickets.filter(ticket => ticket.status === statusFilter);
    }
    
    userTickets.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    
    setFilteredTickets(userTickets);
  }, [tickets, user, searchQuery, statusFilter]);

  if (!user) return null;

  const isAdmin = user.role === 'admin';

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex justify-between items-center">
      <h1 className="text-2xl font-bold">{isAdmin ? 'управление тикетами' : 'мои тикеты'}</h1>
        {/* {user.role === 'sublabel' && (
          <Link to="/tickets/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              новый тикет
            </Button>
          </Link>
        )} */}
      </div>
      
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="поиск тикетов..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <Select
          value={statusFilter}
          onValueChange={setStatusFilter}
        >
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Все статусы" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">все статусы</SelectItem>
            <SelectItem value="open">открытые</SelectItem>
            <SelectItem value="in-progress">в обработке</SelectItem>
            <SelectItem value="closed">закрытые</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      {filteredTickets.length > 0 ? (
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>тикет</TableHead>
                <TableHead>статус</TableHead>
                <TableHead>приоритет</TableHead>
                <TableHead>последнее обновление</TableHead>
                {user.role === 'admin' && <TableHead>отправитель</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTickets.map((ticket) => {
                const creator = getUserById(ticket.createdBy);
                
                return (
                  <TableRow key={ticket.id} className="hover:bg-muted/40">
                    <TableCell>
                      <Link to={`/tickets/${ticket.id}`} className="hover:underline font-medium">
                        {ticket.title}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={ticket.status} />
                    </TableCell>
                    <TableCell>
                      <PriorityBadge priority={ticket.priority} />
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(ticket.updatedAt), "dd.MM.yyyy HH:mm")}
                    </TableCell>
                    {user.role === 'admin' && (
                      <TableCell>
                        {creator?.name}
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center border rounded-lg p-8 bg-muted/20">
          <h3 className="text-lg font-medium">тикетов не найдено</h3>
          <p className="text-muted-foreground mt-1">нет тикетов, соответствующих заданным критериям</p>
          
          {/* {user.role === 'sublabel' && (
            <Link to="/tickets/new" className="mt-4">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                создать новый тикет
              </Button>
            </Link>
          )} */}
        </div>
      )}
    </div>
  );
}
