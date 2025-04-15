
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Ticket, FileText, Landmark, CircleUserRound, Clock, ChevronRight, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";

export default function DashboardPage() {
  const { user } = useAuth();
  
  if (!user) return null;
  
  const isAdmin = user.role === 'admin';
  
  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-2">панель управления</h1>
        <p className="text-muted-foreground">добро пожаловать, {user.name}!</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="card-shadow border-border/40">
          <CardHeader className="pb-2">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
              <Ticket className="h-5 w-5 text-primary" />
            </div>
            <CardTitle className="text-lg">тикеты</CardTitle>
            <CardDescription>управление тикетами</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-3xl font-semibold">12</p>
                <p className="text-sm text-muted-foreground">активных тикетов</p>
              </div>
              <Link to="/tickets">
                <Button variant="ghost" size="sm" className="text-primary">
                  перейти 
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
        
        <Card className="card-shadow border-border/40">
          <CardHeader className="pb-2">
            <div className="w-10 h-10 rounded-lg bg-accent/40 flex items-center justify-center mb-2">
              <FileText className="h-5 w-5 text-accent-foreground" />
            </div>
            <CardTitle className="text-lg">релизы</CardTitle>
            <CardDescription>каталог релизов</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-3xl font-semibold">35</p>
                <p className="text-sm text-muted-foreground">всего релизов</p>
              </div>
              <Link to="/releases">
                <Button variant="ghost" size="sm" className="text-primary">
                  перейти 
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
        
        <Card className="card-shadow border-border/40">
          <CardHeader className="pb-2">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
              <Landmark className="h-5 w-5 text-primary" />
            </div>
            <CardTitle className="text-lg">финансы</CardTitle>
            <CardDescription>финансовые показатели</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-3xl font-semibold">₽0</p>
                <p className="text-sm text-muted-foreground">к выплате</p>
              </div>
              <Link to="/finances">
                <Button variant="ghost" size="sm" className="text-primary">
                  перейти 
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {isAdmin && (
        <Card className="card-shadow border-border/40 bg-secondary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CircleUserRound className="h-5 w-5" />
              статистика пользователей
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <p className="text-muted-foreground text-sm mb-1">всего пользователей</p>
                <p className="text-2xl font-medium">42</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <p className="text-muted-foreground text-sm mb-1">активных</p>
                <p className="text-2xl font-medium">28</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <p className="text-muted-foreground text-sm mb-1">новых за месяц</p>
                <p className="text-2xl font-medium">5</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="card-shadow border-border/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              последние активности
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="border-b pb-3 border-border/40">
                <p className="text-sm font-medium">Обновлен тикет #1234</p>
                <p className="text-xs text-muted-foreground">Сегодня, 10:32</p>
              </div>
              <div className="border-b pb-3 border-border/40">
                <p className="text-sm font-medium">Создан новый тикет #1235</p>
                <p className="text-xs text-muted-foreground">Сегодня, 09:15</p>
              </div>
              <div>
                <p className="text-sm font-medium">Закрыт тикет #1230</p>
                <p className="text-xs text-muted-foreground">Вчера, 18:45</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="card-shadow border-border/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              аналитика системы
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-[180px] bg-secondary/30 rounded-lg">
              <p className="text-muted-foreground">аналитика будет доступна скоро</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
