
import { useState, useEffect } from "react";
import { AlertCircle } from "lucide-react";
import { RatingStars } from "./RatingStars";
import { Button } from "./ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const TicketClosedNotice = ({ ticketId }: { ticketId: string }) => {
  const [rating, setRating] = useState<number | null>(null);
  const [hasRated, setHasRated] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  // Check if user has already rated this ticket
  useEffect(() => {
    if (!user || user.role !== 'sublabel') return;

    const checkExistingRating = async () => {
      const { data } = await supabase
        .from('messages')
        .select('content')
        .eq('ticket_id', ticketId)
        .eq('user_id', user.id)
        .ilike('content', '%RATING:%')
        .single();

      if (data) {
        setHasRated(true);
      }
    };

    checkExistingRating();
  }, [ticketId, user]);

  const handleSubmitRating = async (rating: number) => {
    if (!user) return;
    
    try {
      // Store rating as a special message in the ticket
      const { error } = await supabase
        .from('messages')
        .insert({
          ticket_id: ticketId,
          user_id: user.id,
          content: `RATING: ${rating}`
        });

      if (error) throw error;

      setHasRated(true);
      toast({
        title: "спасибо за оценку",
        description: "ваш отзыв важен для нас"
      });
    } catch (error) {
      console.error("Error submitting rating:", error);
      toast({
        title: "ошибка",
        description: "не удалось сохранить оценку",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="p-6 rounded-xl bg-secondary/70 text-center space-y-4 border border-border/50 card-shadow">
      <div className="flex justify-center">
        <div className="bg-secondary/90 h-12 w-12 rounded-full flex items-center justify-center">
          <AlertCircle className="h-6 w-6 text-muted-foreground" />
        </div>
      </div>
      <h3 className="font-medium text-lg">тикет закрыт</h3>
      <p className="text-muted-foreground max-w-md mx-auto">
        этот тикет был закрыт. больше Вы не можете отправлять в него новые сообщения
      </p>
      
      {!hasRated && user?.role === 'sublabel' && (
        <div className="pt-2 space-y-3 max-w-sm mx-auto">
          <div className="h-px bg-border/50" />
          <p className="text-sm text-muted-foreground">оцените, пожалуйста, качество решения вопроса</p>
          <div className="flex justify-center">
            <RatingStars
              size="lg"
              onChange={setRating}
            />
          </div>
          <Button 
            variant="secondary" 
            className="w-full"
            disabled={!rating}
            onClick={() => rating && handleSubmitRating(rating)}
          >
            отправить оценку
          </Button>
        </div>
      )}
      
      {hasRated && (
        <div className="pt-2 space-y-2">
          <div className="h-px bg-border/50" />
          <p className="text-sm text-primary">спасибо за вашу оценку!</p>
        </div>
      )}
    </div>
  );
};
