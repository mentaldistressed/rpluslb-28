
import { useAuth } from "@/contexts/AuthContext";
import { useTickets } from "@/contexts/TicketsContext";
import { Button } from "@/components/ui/button";
import { Ticket, Users, Plus, Settings, Landmark } from "lucide-react";
import { Link, useLocation, useParams } from "react-router-dom";
import { cn } from "@/lib/utils";

export default function Sidebar() {
  const { user } = useAuth();
  const { userCanAccessTicket } = useTickets();
  const location = useLocation();
  const { ticketId } = useParams<{ ticketId: string }>();
  
  if (!user) return null;

  const isAdmin = user.role === 'admin';
  const isUser = user.role === 'sublabel';
  
  // Проверяем доступ к текущему тикету, если мы находимся на странице тикета
  const hasTicketAccess = !ticketId || userCanAccessTicket(ticketId);
  
  const navItems = [
    ...(isUser ? [
      {
        name: "мои тикеты",
        href: "/tickets",
        icon: Ticket,
        active: location.pathname.startsWith('/tickets')
      },
      {
        name: "мои финансы",
        href: "/finances",
        icon: Landmark,
        active: location.pathname.startsWith('/finances')
      }
    ] : []),
    ...(isAdmin ? [
      {
        name: "управление тикетами",
        href: "/tickets",
        icon: Ticket,
        active: location.pathname.startsWith('/tickets')
      },
      {
        name: "управление пользователями",
        href: "/users",
        icon: Users,
        active: location.pathname.startsWith('/users')
      },
      {
        name: "управление финансами",
        href: "/finances",
        icon: Landmark,
        active: location.pathname.startsWith('/finances')
      },
      {
        name: "настройки",
        href: "/settings",
        icon: Settings,
        active: location.pathname.startsWith('/settings')
      }
    ] : []),
  ];

  return (
    <div className="w-64 bg-white border-r min-h-[calc(100vh-4rem)] flex flex-col p-4">
      <div className="flex-1 space-y-4">
        {isUser && (
          <Link to="/tickets/new">
            <Button className="w-full justify-start" variant="default">
              <Plus className="mr-2 h-4 w-4" />
              <span>создать новый тикет</span>
            </Button>
          </Link>
        )}
        
        <nav className="space-y-1 mt-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                item.active
                  ? "bg-primary text-primary-foreground"
                  : "text-foreground hover:bg-muted"
              )}
            >
              <item.icon className="mr-3 h-5 w-5" />
              {item.name}
            </Link>
          ))}
        </nav>
      </div>
      
      <div className="mt-auto pt-4 border-t text-xs text-muted-foreground px-3">
        <p>© {new Date().getFullYear()} rplus</p>
        <p>ЛКПО, разработано @amirknyazev</p>
      </div>
    </div>
  );
}
