
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Ticket, FileText, Landmark, CircleUserRound, Clock, ChevronRight, TrendingUp, Lock } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ActivityItem, ActivityType } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface TicketStats {
  activeCount: number;
}

interface UserStats {
  totalCount: number;
  activeCount: number;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [ticketStats, setTicketStats] = useState<TicketStats>({ activeCount: 0 });
  const [userStats, setUserStats] = useState<UserStats>({ totalCount: 0, activeCount: 0 });
  const [releaseCount, setReleaseCount] = useState<number>(0);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    if (!user) return;
    
    const fetchTicketStats = async () => {
      try {
        setIsLoading(true);
        
        // Get active tickets count (both open and in-progress)
        const query = user.role === 'admin' 
          ? supabase.from('tickets').select('id', { count: 'exact' }).in('status', ['open', 'in-progress'])
          : supabase.from('tickets').select('id', { count: 'exact' }).in('status', ['open', 'in-progress']).eq('created_by', user.id);
        
        const { count, error } = await query;
        
        if (!error) {
          setTicketStats({ activeCount: count || 0 });
        } else {
          console.error("Error fetching ticket stats:", error);
        }
        
        // Get user statistics (admin only)
        if (user.role === 'admin') {
          // Count only sublabel users
          const { count: totalUsers, error: userErr } = await supabase
            .from('profiles')
            .select('id', { count: 'exact' })
            .eq('role', 'sublabel');
          
          if (!userErr) {
            setUserStats({
              totalCount: totalUsers || 0,
              activeCount: 0 // We'll show this as unavailable
            });
          }
        }
        
        // Placeholder for release count - would normally come from database
        setReleaseCount(user.role === 'admin' ? 0 : 0);
        
        // Get recent activities
        const fetchUserActivities = async () => {
          // In a real app, you would query a dedicated activities or audit log table
          // For now, we'll get the latest tickets as a placeholder for activity
          const query = user.role === 'admin'
            ? supabase.from('tickets').select('*').order('updated_at', { ascending: false }).limit(3)
            : supabase.from('tickets').select('*').eq('created_by', user.id).order('updated_at', { ascending: false }).limit(3);
          
          const { data, error } = await query;
          
          if (!error && data) {
            const formattedActivities = data.map((ticket) => {
              // Determine activity type based on created_at and updated_at
              const isNew = new Date(ticket.created_at).getTime() === new Date(ticket.updated_at).getTime();
              const isClosed = ticket.status === 'closed';
              
              // Ensure we use the correct type literals that match ActivityType
              const type: ActivityType = isNew ? 'create' : (isClosed ? 'close' : 'update');
              const date = new Date(ticket.updated_at);
              
              // Format date for display
              const today = new Date();
              const yesterday = new Date(today);
              yesterday.setDate(yesterday.getDate() - 1);
              
              const isToday = date.toDateString() === today.toDateString();
              const isYesterday = date.toDateString() === yesterday.toDateString();
              
              const displayDate = isToday 
                ? 'сегодня' 
                : (isYesterday ? 'вчера' : date.toLocaleDateString('ru-RU'));
              
              const displayTime = date.toLocaleTimeString('ru-RU', { 
                hour: '2-digit', 
                minute: '2-digit' 
              });
              
              return {
                id: ticket.id,
                type,
                ticketId: ticket.id,
                timestamp: ticket.updated_at,
                date: displayDate,
                time: displayTime
              };
            });
            
            setActivities(formattedActivities);
          }
        };
        
        await fetchUserActivities();
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchTicketStats();
  }, [user]);
  
  if (!user) return null;
  
  const isAdmin = user.role === 'admin';
  
  const getActivityText = (activity: ActivityItem) => {
    switch (activity.type) {
      case 'create':
        return `создан новый тикет #${activity.ticketId.substring(0, 4)}`;
      case 'update':
        return `обновлен тикет #${activity.ticketId.substring(0, 4)}`;
      case 'close':
        return `закрыт тикет #${activity.ticketId.substring(0, 4)}`;
      default:
        return `действие с тикетом #${activity.ticketId.substring(0, 4)}`;
    }
  };
  
  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-2">панель управления</h1>
        <p className="text-muted-foreground">добро пожаловать, {user.name}!</p>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center my-12">
          <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="card-shadow border-border/40 transition-colors duration-200">
              <CardHeader className="pb-2">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                  <Ticket className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-lg">{isAdmin ? 'управление тикетами' : 'мои тикеты'}</CardTitle>
                <CardDescription>
                  {isAdmin ? 'все тикеты в системе' : 'ваши открытые тикеты'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-3xl font-semibold">{ticketStats.activeCount}</p>
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
            
            <Card className="card-shadow border-border/40 relative overflow-hidden transition-colors duration-200">
              <div className="absolute inset-0 backdrop-blur-sm bg-white/30 dark:bg-black/30 z-10 flex flex-col items-center justify-center">
                <Lock className="h-10 w-10 text-blue-400 dark:text-blue-300 mb-2" />
                <p className="text-lg font-medium text-blue-800 dark:text-blue-300">недоступно</p>
                <p className="text-sm text-blue-600 dark:text-blue-400">функционал в разработке</p>
              </div>
              <CardHeader className="pb-2">
                <div className="w-10 h-10 rounded-lg bg-accent/40 flex items-center justify-center mb-2">
                  <FileText className="h-5 w-5 text-accent-foreground" />
                </div>
                <CardTitle className="text-lg">{isAdmin ? 'управление релизами' : 'мои релизы'}</CardTitle>
                <CardDescription>{isAdmin ? 'управление каталогом' : 'ваши релизы'}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-3xl font-semibold">{releaseCount}</p>
                    <p className="text-sm text-muted-foreground">всего релизов</p>
                  </div>
                  <Link to="/dashboard">
                    <Button variant="ghost" size="sm" className="text-primary">
                      перейти 
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
            
            <Card className="card-shadow border-border/40 relative overflow-hidden transition-colors duration-200">
              <div className="absolute inset-0 backdrop-blur-sm bg-white/30 dark:bg-black/30 z-10 flex flex-col items-center justify-center">
                <Lock className="h-10 w-10 text-blue-400 dark:text-blue-300 mb-2" />
                <p className="text-lg font-medium text-blue-800 dark:text-blue-300">недоступно</p>
                <p className="text-sm text-blue-600 dark:text-blue-400">функционал в разработке</p>
              </div>
              <CardHeader className="pb-2">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                  <Landmark className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-lg">{isAdmin ? 'управление финансами' : 'мои финансы'}</CardTitle>
                <CardDescription>{isAdmin ? 'финансовые показатели' : 'ваши выплаты'}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-3xl font-semibold">₽0</p>
                    <p className="text-sm text-muted-foreground">к выплате</p>
                  </div>
                  <Link to="/dashboard">
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
                    <p className="text-2xl font-medium">{userStats.totalCount}</p>
                  </div>
                  <div className="bg-card dark:bg-card p-4 rounded-lg shadow-sm relative overflow-hidden transition-colors duration-200">
                    <div className="absolute inset-0 backdrop-blur-sm bg-white/30 dark:bg-black/30 z-10 flex flex-col items-center justify-center">
                      <Lock className="h-8 w-8 text-blue-400 dark:text-blue-300 mb-1" />
                      <p className="text-sm text-blue-800 dark:text-blue-300">недоступно</p>
                    </div>
                    <p className="text-muted-foreground text-sm mb-1">активных</p>
                    <p className="text-2xl font-medium">{userStats.activeCount}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="card-shadow border-border/40 transition-colors duration-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  {isAdmin ? 'последние активности' : 'ваши последние активности'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {activities.length > 0 ? (
                  <div className="space-y-3">
                    {activities.map((activity, index) => (
                      <div key={activity.id} className={cn(
                        index < activities.length - 1 ? "border-b pb-3 border-border/40" : "",
                        "transition-colors duration-200"
                      )}>
                        <Link to={`/tickets/${activity.ticketId}`} className="hover:underline">
                          <p className="text-sm font-medium">{getActivityText(activity)}</p>
                          <p className="text-xs text-muted-foreground">{activity.date}, {activity.time}</p>
                        </Link>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    нет недавних активностей
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card className="card-shadow border-border/40 relative overflow-hidden transition-colors duration-200">
              <div className="absolute inset-0 backdrop-blur-sm bg-white/30 dark:bg-black/30 z-10 flex flex-col items-center justify-center">
                <Lock className="h-10 w-10 text-blue-400 dark:text-blue-300 mb-2" />
                <p className="text-lg font-medium text-blue-800 dark:text-blue-300">недоступно</p>
                <p className="text-sm text-blue-600 dark:text-blue-400">функционал в разработке</p>
              </div>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  аналитика системы
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center h-[180px] bg-secondary/30 dark:bg-secondary/20 rounded-lg transition-colors duration-200">
                  <p className="text-muted-foreground">аналитика пока недоступна</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
