
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [name, setName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerPasswordConfirm, setRegisterPasswordConfirm] = useState("");
  const { login, isLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

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

  const handleRegisterA = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (registerPassword !== registerPasswordConfirm) {
      toast({
        title: "Ошибка регистрации",
        description: "Пароли не совпадают",
        variant: "destructive",
      });
      return;
    }

    setIsRegistering(true);
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email: registerEmail,
        password: registerPassword,
        options: {
          data: {
            name: name,
            role: "admin",
          },
        },
      });
      
      if (error) {
        toast({
          title: "Ошибка регистрации",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Регистрация успешна",
          description: "Теперь вы можете войти в систему",
        });
        setEmail(registerEmail);
        setPassword(registerPassword);
      }
    } catch (error) {
      console.error("Registration error:", error);
      toast({
        title: "Ошибка регистрации",
        description: "Произошла неизвестная ошибка при регистрации",
        variant: "destructive",
      });
    } finally {
      setIsRegistering(false);
    }
  };

  const handleRegisterS = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (registerPassword !== registerPasswordConfirm) {
      toast({
        title: "Ошибка регистрации",
        description: "Пароли не совпадают",
        variant: "destructive",
      });
      return;
    }

    setIsRegistering(true);
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email: registerEmail,
        password: registerPassword,
        options: {
          data: {
            name: name,
            role: "sublabel",
          },
        },
      });
      
      if (error) {
        toast({
          title: "Ошибка регистрации",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Регистрация успешна",
          description: "Теперь вы можете войти в систему",
        });
        setEmail(registerEmail);
        setPassword(registerPassword);
      }
    } catch (error) {
      console.error("Registration error:", error);
      toast({
        title: "Ошибка регистрации",
        description: "Произошла неизвестная ошибка при регистрации",
        variant: "destructive",
      });
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-muted/30">
      <div className="w-full max-w-md px-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">
            {/* <span className="font-extrabold">r</span> */}
            <span className="font-light">rplus</span>
          </h1>
          <p className="text-muted-foreground">личный кабинет правообладателя</p>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>авторизация в системе</CardTitle>
            <CardDescription>
              введите данные для входа в личный кабинет
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">почта</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="mail@label.ru"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">пароль</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-2">
              <Button className="w-full" type="submit" disabled={isLoading}>
                {isLoading ? "авторизация..." : "авторизоваться"}
              </Button>
            </CardFooter>
          </form>
        </Card>
        
        <div className="mt-6 text-center">
                    <Dialog>
            <DialogTrigger asChild>
              {/* <Button variant="link" className="text-sm text-muted-foreground hover:text-primary">
                Создать аккаунт администратора
              </Button> */}
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Регистрация администратора</DialogTitle>
                <DialogDescription>
                  Создайте аккаунт администратора для управления системой
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleRegisterA} className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Имя</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-email">Email</Label>
                  <Input
                    id="register-email"
                    type="email"
                    value={registerEmail}
                    onChange={(e) => setRegisterEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-password">Пароль</Label>
                  <Input
                    id="register-password"
                    type="password"
                    value={registerPassword}
                    onChange={(e) => setRegisterPassword(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-password-confirm">Подтверждение пароля</Label>
                  <Input
                    id="register-password-confirm"
                    type="password"
                    value={registerPasswordConfirm}
                    onChange={(e) => setRegisterPasswordConfirm(e.target.value)}
                    required
                  />
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={isRegistering}>
                    {isRegistering ? "Регистрация..." : "Зарегистрироваться"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
          <Dialog>
            <DialogTrigger asChild>
              {/* <Button variant="link" className="text-sm text-muted-foreground hover:text-primary">
                Создать аккаунт администратора
              </Button> */}
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Регистрация администратора</DialogTitle>
                <DialogDescription>
                  Создайте аккаунт администратора для управления системой
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleRegisterA} className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Имя</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-email">Email</Label>
                  <Input
                    id="register-email"
                    type="email"
                    value={registerEmail}
                    onChange={(e) => setRegisterEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-password">Пароль</Label>
                  <Input
                    id="register-password"
                    type="password"
                    value={registerPassword}
                    onChange={(e) => setRegisterPassword(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-password-confirm">Подтверждение пароля</Label>
                  <Input
                    id="register-password-confirm"
                    type="password"
                    value={registerPasswordConfirm}
                    onChange={(e) => setRegisterPasswordConfirm(e.target.value)}
                    required
                  />
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={isRegistering}>
                    {isRegistering ? "Регистрация..." : "Зарегистрироваться"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
          
          <p className="text-sm text-muted-foreground mt-2">
            данные для авторизации в системе можно получить у @amirknyazev
          </p>
          <p className="text-sm text-muted-foreground mt-2">
          © {new Date().getFullYear()} rplus
          </p>
        </div>
      </div>
    </div>
  );
}
