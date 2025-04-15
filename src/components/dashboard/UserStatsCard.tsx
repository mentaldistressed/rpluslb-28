
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CircleUserRound, Lock } from "lucide-react";

interface UserStatsCardProps {
  totalCount: number;
  activeCount: number;
}

export function UserStatsCard({ totalCount, activeCount }: UserStatsCardProps) {
  return (
    <Card className="card-shadow border-border/40 bg-secondary/20 transition-colors duration-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CircleUserRound className="h-5 w-5" />
          статистика пользователей
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-card dark:bg-card p-4 rounded-lg shadow-sm transition-colors duration-200">
            <p className="text-muted-foreground text-sm mb-1">всего пользователей</p>
            <p className="text-2xl font-medium">{totalCount}</p>
          </div>
          <div className="bg-card dark:bg-card p-4 rounded-lg shadow-sm relative overflow-hidden transition-colors duration-200">
            <div className="absolute inset-0 backdrop-blur-sm bg-white/30 dark:bg-black/30 z-10 flex flex-col items-center justify-center">
              <Lock className="h-8 w-8 text-blue-400 dark:text-blue-300 mb-1" />
              <p className="text-sm text-blue-800 dark:text-blue-300">Недоступно</p>
            </div>
            <p className="text-muted-foreground text-sm mb-1">активных</p>
            <p className="text-2xl font-medium">{activeCount}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
