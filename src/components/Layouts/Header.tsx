
import { useAuth } from "@/contexts/AuthContext";
import { UserAvatar } from "@/components/UserAvatar";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { NotificationsMenu } from "@/components/NotificationsMenu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";

export default function Header() {
  const { user, logout } = useAuth();
  const { theme } = useTheme();

  if (!user) return null;

  return (
    <header className={cn(
      "border-b border-border/40 backdrop-blur-md sticky top-0 z-50 transition-colors duration-200",
      theme === "dark" ? "bg-background/70" : "bg-background/80"
    )}>
      <div className="h-16 flex items-center justify-between px-6">
        <div className="flex items-center space-x-3">
          <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
          <div className="text-xl font-medium">
            <span className="font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70">rplus</span>
            <span className="text-muted-foreground ml-2 text-base font-normal">» ЛКПО</span>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <NotificationsMenu />
          
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
