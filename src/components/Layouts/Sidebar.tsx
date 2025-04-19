
import { useAuth } from "@/contexts/AuthContext";
import { useTickets } from "@/contexts/TicketsContext";
import { Button } from "@/components/ui/button";
import { Ticket, Users, Plus, Settings, Landmark, Home, Hammer, Coins } from "lucide-react";
import { Link, useLocation, useParams } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";
import { Badge } from "@/components/ui/badge";

export default function Sidebar() {
  const { user } = useAuth();
  const { userCanAccessTicket } = useTickets();
  const { theme } = useTheme();
  const location = useLocation();
  const { ticketId } = useParams<{ ticketId: string }>();
  
  if (!user) return null;

  const isAdmin = user.role === 'admin';
  const isUser = user.role === 'sublabel';
  
  const hasTicketAccess = !ticketId || userCanAccessTicket(ticketId);
  
  const navItems = [
    ...(isUser ? [
      {
        name: "главная",
        href: "/dashboard",
        icon: Home,
        active: location.pathname === '/dashboard'
      },
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
      },
      {
        name: "инструменты",
        href: "/tools",
        icon: Hammer,
        active: location.pathname.startsWith('/tools')
      }
    ] : []),
    ...(isAdmin ? [
      {
        name: "панель управления",
        href: "/dashboard",
        icon: Home,
        active: location.pathname === '/dashboard'
      },
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
        name: "инструменты",
        href: "/tools",
        icon: Hammer,
        active: location.pathname.startsWith('/tools')
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
    <div className="w-64 bg-card border-r border-border/40 shadow-sm min-h-[calc(100vh-4rem)] flex flex-col p-4 transition-colors duration-200">
      <div className="flex-1 space-y-6">
        {isUser && (
          <Link to="/tickets/new">
            <Button className="w-full justify-start font-medium shadow-sm group" variant="default">
              <Plus className="mr-2 h-4 w-4 transition-transform duration-200 group-hover:rotate-90" />
              <span>создать новый тикет</span>
            </Button>
          </Link>
        )}
        
        <nav className="space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors duration-200",
                item.active
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-foreground/80 hover:bg-secondary hover:text-foreground"
              )}
            >
              <item.icon className="mr-2.5 h-4 w-4" />
              {item.name}
            </Link>
          ))}
        </nav>
      </div>
      
      <div className="mt-auto pt-4 border-t border-border/50 text-xs text-muted-foreground px-3">
        <p>v1.1.2.1</p>
        <p>последнее обновление системы: 2025-04-18 18:08</p>
      </div>
    </div>
  );
}
