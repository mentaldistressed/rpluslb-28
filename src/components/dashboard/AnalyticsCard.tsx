
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";

export function AnalyticsCard() {
  return (
    <Card className="card-shadow border-border/40 transition-colors duration-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          аналитика системы
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-center h-[180px] bg-secondary/30 dark:bg-secondary/20 rounded-lg transition-colors duration-200">
          <p className="text-muted-foreground">аналитика будет доступна скоро</p>
        </div>
      </CardContent>
    </Card>
  );
}
