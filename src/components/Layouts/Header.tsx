
import { useAuth } from "@/contexts/AuthContext";
import { UserAvatar } from "@/components/UserAvatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, UserCircle2, Bell, Menu } from "lucide-react";

export default function Header() {
  const { user, logout } = useAuth();

  if (!user) return null;

  return (
    <header className="border-b border-border/40 bg-white/80 backdrop-blur-md sticky top-0 z-50">
      <div className="h-16 flex items-center justify-between px-6">
        <div className="flex items-center space-x-2">
          <div className="text-xl font-medium">
            <span className="font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70">rplus</span>
            <span className="text-muted-foreground ml-2 text-base font-normal">ЛКПО</span>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="text-muted-foreground">
            <Bell className="h-5 w-5" />
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2 h-9 px-2 rounded-full">
                <UserAvatar user={user} size="sm" />
                <span className="font-medium text-sm hidden sm:inline-block">{user.name}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user.name}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user.email}
                  </p>
                  <p className="text-xs font-medium text-muted-foreground mt-1">
                    {user.role === 'admin' ? 'администратор' : 'саб-лейбл'}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout} className="text-destructive cursor-pointer">
                <LogOut className="mr-2 h-4 w-4" />
                <span>выйти</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
