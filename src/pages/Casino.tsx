import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, BadgeDollarSign, Ban, Crown, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";

interface Outcome {
  id: string;
  name: string;
  description: string;
  icon: React.FC<React.SVGProps<SVGSVGElement>>;
  possible: boolean;
}

const outcomes: Outcome[] = [
  {
    id: 'royalty',
    name: 'роялти 100%',
    description: 'получить 100% роялти',
    icon: Crown,
    possible: false
  },
  {
    id: 'fine',
    name: 'штраф 5000₽',
    description: 'штраф 5000 рублей',
    icon: BadgeDollarSign,
    possible: true
  },
  {
    id: 'bonus',
    name: '1000₽',
    description: 'бонус 1000 рублей',
    icon: Bell,
    possible: false
  },
  {
    id: 'deactivation',
    name: 'отключение',
    description: 'отключение саб-кабинета',
    icon: Ban,
    possible: true
  }
];

export default function CasinoPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSpinning, setIsSpinning] = useState(false);
  const [cooldownEnds, setCooldownEnds] = useState<Date | null>(null);
  const [timeLeft, setTimeLeft] = useState<string>("");
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    const getLastSpin = async () => {
      if (!user || isAdmin) return;
      
      try {
        const { data } = await supabase
          .from('casino_spins')
          .select('created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
        
        if (data) {
          const lastSpinDate = new Date(data.created_at);
          const cooldownEndDate = new Date(lastSpinDate.getTime() + 24 * 60 * 60 * 1000);
          if (cooldownEndDate > new Date()) {
            setCooldownEnds(cooldownEndDate);
          }
        }
      } catch (error) {
        console.error("Error fetching last spin:", error);
      }
    };
    
    getLastSpin();
  }, [user, isAdmin]);

  useEffect(() => {
    if (!cooldownEnds) return;
    
    const timer = setInterval(() => {
      const now = new Date();
      const diff = cooldownEnds.getTime() - now.getTime();
      
      if (diff <= 0) {
        setCooldownEnds(null);
        setTimeLeft("");
        clearInterval(timer);
        return;
      }
      
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      setTimeLeft(`${hours}ч ${minutes}м ${seconds}с`);
    }, 1000);
    
    return () => clearInterval(timer);
  }, [cooldownEnds]);

  if (!user) return null;

  const spin = async () => {
    if (cooldownEnds && !isAdmin) return;
    setIsSpinning(true);
    
    // Only allow fine and deactivation outcomes
    const possibleOutcomes = outcomes.filter(o => o.possible);
    const result = possibleOutcomes[Math.floor(Math.random() * possibleOutcomes.length)];
    
    // Record the spin
    if (!isAdmin) {
      try {
        await supabase
          .from('casino_spins')
          .insert([{
            user_id: user.id,
            outcome_id: result.id
          }]);
        
        // Set cooldown for non-admins
        const now = new Date();
        setCooldownEnds(new Date(now.getTime() + 24 * 60 * 60 * 1000));
      } catch (error) {
        console.error("Error recording spin:", error);
      }
    }
    
    setTimeout(() => {
      setIsSpinning(false);
      toast({
        title: result.name,
        description: result.description,
        variant: "destructive"
      });
    }, 3000);
  };

  return (
    <div className="animate-fade-in space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">казино</h1>
      </div>

      <div className="relative max-w-3xl mx-auto">
        <Carousel
          opts={{
            align: "center",
            loop: true,
          }}
          className="w-full"
        >
          <CarouselContent className="py-4">
            {outcomes.map((outcome) => (
              <CarouselItem key={outcome.id} className="basis-1/3 md:basis-1/4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      {React.createElement(outcome.icon, { strokeWidth: 1.5 })}
                      {outcome.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{outcome.description}</p>
                  </CardContent>
                </Card>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      </div>

      <div className="flex flex-col items-center gap-4 mt-8">
        {!isAdmin && timeLeft && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>следующий спин доступен через: {timeLeft}</span>
          </div>
        )}
        
        <Button 
          size="lg"
          onClick={spin}
          disabled={isSpinning || (!isAdmin && !!cooldownEnds)}
          className="font-semibold min-w-[200px]"
        >
          {isSpinning ? "крутим..." : "испытать удачу"}
        </Button>
      </div>
    </div>
  );
}
