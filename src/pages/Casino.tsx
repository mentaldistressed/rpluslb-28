
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, BadgeDollarSign, Ban, Crown, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Outcome {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType;
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

  if (!user) return null;

  const spin = () => {
    setIsSpinning(true);
    
    // Only allow fine and deactivation outcomes
    const possibleOutcomes = outcomes.filter(o => o.possible);
    const result = possibleOutcomes[Math.floor(Math.random() * possibleOutcomes.length)];
    
    setTimeout(() => {
      setIsSpinning(false);
      toast({
        title: result.name,
        description: result.description,
        variant: "destructive"
      });
    }, 2000);
  };

  return (
    <div className="animate-fade-in space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">казино</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {outcomes.map((outcome) => (
          <Card key={outcome.id} className={`border-border/40 ${!outcome.possible ? 'opacity-50' : ''}`}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <outcome.icon className="h-5 w-5" />
                {outcome.name}
                {!outcome.possible && <Lock className="h-4 w-4 ml-auto text-muted-foreground" />}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{outcome.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex justify-center mt-8">
        <Button 
          size="lg"
          onClick={spin}
          disabled={isSpinning}
          className="font-semibold min-w-[200px]"
        >
          {isSpinning ? "крутим..." : "испытать удачу"}
        </Button>
      </div>
    </div>
  );
}
