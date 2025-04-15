
import { User } from "@/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface UserAvatarProps {
  user: User;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function UserAvatar({ user, size = "md", className }: UserAvatarProps) {
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-12 w-12"
  };

  const getInitials = (name: string) => {
    return name.split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase();
  };

  const getFallbackColor = (name: string) => {
    // Simple hashing of name to get a consistent color
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    // Use hue-rotate to get different colors
    const hue = hash % 360;
    return `hue-rotate-[${hue}deg]`;
  };

  return (
    <Avatar className={cn(sizeClasses[size], className)}>
      <AvatarImage src={user.avatar} alt={user.name} />
      <AvatarFallback className={cn("bg-accent text-accent-foreground font-medium", getFallbackColor(user.name))}>
        {getInitials(user.name)}
      </AvatarFallback>
    </Avatar>
  );
}
