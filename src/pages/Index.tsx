
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LogIn, ArrowRight } from "lucide-react";

const Index = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    if (user) {
      navigate("/tickets");
    }
  }, [user, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-background/50 p-4">
      <div className="max-w-xl w-full text-center space-y-8">
        <div className="mx-auto w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center">
          <LogIn className="h-10 w-10 text-primary" />
        </div>
        
        <div>
          <h1 className="text-4xl font-bold mb-4">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70">
              rplus
            </span>
          </h1>
          <p className="text-xl text-muted-foreground">
            личный кабинет правообладателя
          </p>
        </div>
        
        <Card className="card-shadow border-0">
          <CardContent className="p-8 flex flex-col items-center">
            <p className="mb-6 text-foreground">
              для доступа к личному кабинету необходимо авторизоваться в системе
            </p>
            <Button onClick={() => navigate("/login")} className="gap-2">
              <span>войти в систему</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
        
        <p className="text-sm text-muted-foreground pt-4">
          © {new Date().getFullYear()} rplus. все права защищены
        </p>
      </div>
    </div>
  );
};

export default Index;
