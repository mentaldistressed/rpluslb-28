
import { Link } from "react-router-dom";
import { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  value: number | string;
  valueLabel: string;
  link: string;
  isLocked?: boolean;
  className?: string;
}

export function StatsCard({
  icon: Icon,
  title,
  description,
  value,
  valueLabel,
  link,
  isLocked,
  className
}: StatsCardProps) {
  const CardWrapper = ({ children }: { children: React.ReactNode }) => (
    <Card className={cn("card-shadow border-border/40 transition-colors duration-200", className)}>
      {children}
    </Card>
  );

  if (isLocked) {
    return (
      <CardWrapper>
        <div className="absolute inset-0 backdrop-blur-sm bg-white/30 dark:bg-black/30 z-10 flex flex-col items-center justify-center">
          <Lock className="h-10 w-10 text-blue-400 dark:text-blue-300 mb-2" />
          <p className="text-lg font-medium text-blue-800 dark:text-blue-300">недоступно</p>
          <p className="text-sm text-blue-600 dark:text-blue-400">функционал в разработке</p>
        </div>
        {/* Regular card content */}
        <CardHeader className="pb-2">
          <div className="w-10 h-10 rounded-lg bg-accent/40 flex items-center justify-center mb-2">
            <Icon className="h-5 w-5 text-accent-foreground" />
          </div>
          <CardTitle className="text-lg">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-3xl font-semibold">{value}</p>
              <p className="text-sm text-muted-foreground">{valueLabel}</p>
            </div>
            <Link to={link}>
              <Button variant="ghost" size="sm" className="text-primary">
                перейти 
                <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </CardWrapper>
    );
  }

  return (
    <CardWrapper>
      <CardHeader className="pb-2">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-end justify-between">
          <div>
            <p className="text-3xl font-semibold">{value}</p>
            <p className="text-sm text-muted-foreground">{valueLabel}</p>
          </div>
          <Link to={link}>
            <Button variant="ghost" size="sm" className="text-primary">
              перейти 
              <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </CardWrapper>
  );
}
