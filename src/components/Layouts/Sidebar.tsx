
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Ticket, Users, Plus, MessageSquare, Settings } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

export default function Sidebar() {
  const { user } = useAuth();
  const location = useLocation();
  
  if (!user) return null;

  const isAdmin = user.role === 'admin';
  const isUser = user.role === 'sublabel';
  
  const navItems = [
    {
      name: "тикеты",
      href: "/tickets",
      icon: Ticket,
      active: location.pathname.startsWith('/tickets')
    },
    ...(isAdmin ? [
      {
        name: "пользователи",
        href: "/users",
        icon: Users,
        active: location.pathname.startsWith('/users')
      }
    ] : []),
    {
      name: "настройки",
      href: "/settings",
      icon: Settings,
      active: location.pathname.startsWith('/settings')
    },
    // {
    //   name: "сообщения",
    //   href: "/messages",
    //   icon: MessageSquare,
    //   active: location.pathname.startsWith('/messages')
    // },
  ];

  return (
    <div className="w-64 bg-white border-r min-h-[calc(100vh-4rem)] flex flex-col p-4">
      <div className="flex-1 space-y-2">
        {isUser && (
          <Link to="/tickets/new">
            <Button className="w-full justify-start" variant="default">
              <Plus className="mr-2 h-4 w-4" />
              <span>создать новый тикет</span>
            </Button>
          </Link>
        )}
        
        <nav className="space-y-1 mt-6">
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
