
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Lock, Mail, LogIn } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login, isLoading, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  useEffect(() => {
    if (user) {
      navigate("/tickets");
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const success = await login(email, password);
      if (success) {
        navigate("/tickets");
      }
    } catch (error) {
      console.error("Login error:", error);
      toast({
        title: "Ошибка входа",
        description: "Произошла неизвестная ошибка при входе",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-background to-background/50 px-4 py-8">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-md space-y-10">
        <div>
          <div className="flex items-center justify-center">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-5">
              <LogIn className="w-8 h-8 text-primary" />
            </div>
          </div>
          <h1 className="text-center text-3xl font-bold tracking-tight mb-1">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70">rplus</span>
          </h1>
          <p className="text-center text-muted-foreground">личный кабинет правообладателя</p>
        </div>
        
        <Card className="card-shadow border-0 overflow-hidden">
          <CardHeader className="bg-secondary/50 pb-4 border-b">
            <CardTitle className="text-xl font-medium">авторизация</CardTitle>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-5 pt-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">электронная почта</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground/70" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="example@domain.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="pl-10 h-10 border-input/80"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">пароль</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground/70" />
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="pl-10 h-10 border-input/80"
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col pb-6">
              <Button className="w-full" type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    авторизация...
                  </>
                ) : (
                  "войти в систему"
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
        
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            данные для авторизации в системе можно получить у @amirknyazev
          </p>
          <p className="text-xs text-muted-foreground/70 mt-2">
            © {new Date().getFullYear()} rplus. все права защищены
          </p>
        </div>
      </div>
    </div>
  );
};

