
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTickets } from "@/contexts/TicketsContext";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TicketCard } from "@/components/TicketCard";
import { Plus, Search, Filter, SortAsc, SortDesc, Grid3X3, List, LayoutGrid } from "lucide-react";
import { Ticket } from "@/types";
import { cn } from "@/lib/utils";

export default function TicketsPage() {
  const { tickets, getUserById } = useTickets();
  const { user } = useAuth();
  const [filteredTickets, setFilteredTickets] = useState<Ticket[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("updated");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

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
    
    // Сортировка
    userTickets.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'title':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        // case 'priority':
        //   const priorityOrder = { high: 3, medium: 2, low: 1 };
        //   aValue = priorityOrder[a.priority as keyof typeof priorityOrder] || 0;
        //   bValue = priorityOrder[b.priority as keyof typeof priorityOrder] || 0;
        //   break;
        case 'created':
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
        default: // updated
          aValue = new Date(a.updatedAt).getTime();
          bValue = new Date(b.updatedAt).getTime();
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
    
    setFilteredTickets(userTickets);
  }, [tickets, user, searchQuery, statusFilter, sortBy, sortOrder]);

  if (!user) return null;

  const isAdmin = user.role === 'admin';

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            {isAdmin ? 'управление тикетами' : 'мои тикеты'}
          </h1>
          <p className="text-muted-foreground mt-1">
            {filteredTickets.length} {filteredTickets.length === 1 ? 'тикет' : 'тикетов'}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="flex items-center border rounded-lg p-1 bg-muted/30">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className={cn(
                "h-8 px-3",
                viewMode === 'grid'
              )}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className={cn(
                "h-8 px-3",
                viewMode === 'list'
              )}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <Card className="p-4 bg-card/50 backdrop-blur-sm border-border/50">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="поиск по названию или описанию тикетов..."
              className="pl-9 bg-background/50 border-border/50 focus:bg-background"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[160px] bg-background/50 border-border/50">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="все статусы" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">все статусы</SelectItem>
                <SelectItem value="open">открытые</SelectItem>
                <SelectItem value="in-progress">в обработке</SelectItem>
                <SelectItem value="closed">закрытые</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full sm:w-[160px] bg-background/50 border-border/50">
                {sortOrder === 'asc' ? <SortAsc className="h-4 w-4 mr-2" /> : <SortDesc className="h-4 w-4 mr-2" />}
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="updated">по дате изменения</SelectItem>
                <SelectItem value="created">по дате создания</SelectItem>
                <SelectItem value="title">по названию</SelectItem>
                <SelectItem value="status">по статусу</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="icon"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="bg-background/50 border-border/50"
            >
              {sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </Card>

      {/* Tickets Display */}
      {filteredTickets.length > 0 ? (
        <div className={cn(
          "gap-4",
          viewMode === 'grid' 
            ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3" 
            : "flex flex-col space-y-3"
        )}>
          {filteredTickets.map((ticket) => {
            const creator = getUserById(ticket.createdBy);
            
            return (
              <TicketCard
                key={ticket.id}
                ticket={ticket}
                creatorName={creator?.name}
                showCreator={isAdmin}
                className={viewMode === 'list' ? "hover:scale-[1.01]" : ""}
              />
            );
          })}
        </div>
      ) : (
        <Card className="p-12 text-center bg-card/30 border-dashed border-2 border-border/50">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted/50 flex items-center justify-center">
              <Search className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">тикетов не найдено</h3>
            <p className="text-muted-foreground mb-6">
              нет тикетов, соответствующих заданным критериям поиска
              попробуйте изменить фильтры или создать новый тикет
            </p>
            
            {user.role === 'sublabel' && (
              <Link to="/tickets/new">
                <Button className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary">
                  <Plus className="mr-2 h-4 w-4" />
                  создать новый тикет
                </Button>
              </Link>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
