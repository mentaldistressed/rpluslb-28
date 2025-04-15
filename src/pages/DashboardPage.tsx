
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Ticket, FileText, Landmark } from "lucide-react";
import { ActivityItem } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { ActivityList } from "@/components/dashboard/ActivityList";
import { AnalyticsCard } from "@/components/dashboard/AnalyticsCard";
import { UserStatsCard } from "@/components/dashboard/UserStatsCard";

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
          const { count: totalUsers, error: userErr } = await supabase
            .from('profiles')
            .select('id', { count: 'exact' })
            .eq('role', 'sublabel');
          
          if (!userErr) {
            setUserStats({
              totalCount: totalUsers || 0,
              activeCount: 0
            });
          }
        }
        
        // Placeholder for release count
        setReleaseCount(0);
        
        // Get recent activities
        const fetchUserActivities = async () => {
          const query = user.role === 'admin'
            ? supabase.from('tickets').select('*').order('updated_at', { ascending: false }).limit(3)
            : supabase.from('tickets').select('*').eq('created_by', user.id).order('updated_at', { ascending: false }).limit(3);
          
          const { data, error } = await query;
          
          if (!error && data) {
            const formattedActivities = data.map((ticket) => {
              const isNew = new Date(ticket.created_at).getTime() === new Date(ticket.updated_at).getTime();
              const isClosed = ticket.status === 'closed';
              const type: ActivityType = isNew ? 'create' : (isClosed ? 'close' : 'update');
              const date = new Date(ticket.updated_at);
              
              const today = new Date();
              const yesterday = new Date(today);
              yesterday.setDate(yesterday.getDate() - 1);
              
              const isToday = date.toDateString() === today.toDateString();
              const isYesterday = date.toDateString() === yesterday.toDateString();
              
              const displayDate = isToday 
                ? 'Сегодня' 
                : (isYesterday ? 'Вчера' : date.toLocaleDateString('ru-RU'));
              
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
            <StatsCard
              icon={Ticket}
              title={isAdmin ? 'управление тикетами' : 'мои тикеты'}
              description={isAdmin ? 'все тикеты в системе' : 'ваши открытые тикеты'}
              value={ticketStats.activeCount}
              valueLabel="активных тикетов"
              link="/tickets"
            />
            <StatsCard
              icon={FileText}
              title={isAdmin ? 'управление релизами' : 'мои релизы'}
              description={isAdmin ? 'управление каталогом' : 'ваши релизы'}
              value={releaseCount}
              valueLabel="всего релизов"
              link="/releases"
              isLocked
            />
            <StatsCard
              icon={Landmark}
              title={isAdmin ? 'управление финансами' : 'мои финансы'}
              description={isAdmin ? 'финансовые показатели' : 'ваши выплаты'}
              value="₽0"
              valueLabel="к выплате"
              link="/finances"
            />
          </div>
          
          {isAdmin && <UserStatsCard totalCount={userStats.totalCount} activeCount={userStats.activeCount} />}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ActivityList activities={activities} isAdmin={isAdmin} />
            <AnalyticsCard />
          </div>
        </>
      )}
    </div>
  );
}
