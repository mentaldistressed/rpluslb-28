
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { UserAvatar } from "@/components/UserAvatar";
import { UserRole } from "@/types";
import { Copy, Plus, RefreshCw } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@/types";

export default function UsersPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newUserName, setNewUserName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserRole, setNewUserRole] = useState<UserRole>("sublabel");
  const [useGeneratedPassword, setUseGeneratedPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [name, setName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerPasswordConfirm, setRegisterPasswordConfirm] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*');
        
        if (error) {
          console.error("Error fetching users:", error);
          return;
        }
        
        if (data) {
          const formattedUsers = data.map(profile => ({
            id: profile.id,
            name: profile.name,
            email: profile.email,
            role: profile.role as UserRole,
            avatar: profile.avatar
          }));
          
          setUsers(formattedUsers);
        }
      } catch (error) {
        console.error("Error fetching users:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (user && user.role === 'admin') {
      fetchUsers();
    }
  }, [user]);
  
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
  
  const generateRandomPassword = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
    let password = "";
    for (let i = 0; i < 10; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewUserPassword(password);
    return password;
  };
  
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Скопировано в буфер обмена",
      description: "Данные скопированы в буфер обмена",
    });
  };
  
  const handleTogglePasswordType = () => {
    if (!useGeneratedPassword) {
      generateRandomPassword();
    }
    setUseGeneratedPassword(!useGeneratedPassword);
  };

  if (!user || user.role !== 'admin') {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold">Доступ запрещен</h2>
        <p className="text-muted-foreground mt-1">У вас нет доступа к этой странице</p>
      </div>
    );
  }

  const handleCreateUser = async () => {
    // Simple validation
    if (!newUserName.trim() || !newUserEmail.trim() || !newUserPassword.trim()) {
      toast({
        title: "Ошибка",
        description: "Пожалуйста, заполните все поля",
        variant: "destructive",
      });
      return;
    }
    
    try {
      // Create the user in Supabase Auth
      const { data, error } = await supabase.auth.admin.createUser({
        email: newUserEmail,
        password: newUserPassword,
        email_confirm: true,
        user_metadata: {
          name: newUserName,
          role: newUserRole
        }
      });
      
      if (error) {
        console.error("Error creating user:", error);
        toast({
          title: "Ошибка",
          description: error.message,
          variant: "destructive",
        });
        return;
      }
      
      if (data.user) {
        // The profile should be created automatically by the trigger
        toast({
          title: "Пользователь создан",
          description: `Пользователь ${newUserName} успешно создан`,
        });
        
        // Add the new user to the state
        const newUser = {
          id: data.user.id,
          name: newUserName,
          email: newUserEmail,
          role: newUserRole,
          avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${newUserName}&backgroundColor=000000&textColor=ffffff`
        };
        
        setUsers([...users, newUser]);
        
        // Reset form and close dialog
        setNewUserName("");
        setNewUserEmail("");
        setNewUserPassword("");
        setNewUserRole("sublabel");
        setUseGeneratedPassword(false);
        setIsDialogOpen(false);
      }
    } catch (error) {
      console.error("Error creating user:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось создать пользователя",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Пользователи</h1>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Новый пользователь
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Создать нового пользователя</DialogTitle>
              <DialogDescription>
                Заполните информацию для создания нового пользователя
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Имя</Label>
                <Input
                  id="name"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  placeholder="Название саб-лейбла или имя пользователя"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  placeholder="example@domain.com"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Пароль</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      id="password"
                      type="text"
                      value={newUserPassword}
                      onChange={(e) => setNewUserPassword(e.target.value)}
                      placeholder="Пароль"
                      readOnly={useGeneratedPassword}
                      className="pr-10"
                    />
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="icon"
                      className="absolute right-0 top-0 h-full"
                      onClick={() => copyToClipboard(newUserPassword)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleTogglePasswordType}
                  >
                    {useGeneratedPassword ? "Ввести вручную" : "Сгенерировать"}
                  </Button>
                  {useGeneratedPassword && (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={generateRandomPassword}
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="role">Роль</Label>
                <Select
                  value={newUserRole}
                  onValueChange={(value) => setNewUserRole(value as UserRole)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите роль" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Администратор</SelectItem>
                    <SelectItem value="sublabel">Саб-лейбл</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="mt-4">
                <Button
                  type="button"
                  onClick={() => copyToClipboard(`Email: ${newUserEmail}\nПароль: ${newUserPassword}`)}
                  variant="outline"
                  className="w-full"
                >
                  <Copy className="mr-2 h-4 w-4" />
                  Скопировать все данные
                </Button>
              </div>
            </div>
            
            <DialogFooter>
              <Button onClick={handleCreateUser}>Создать</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <Dialog>
            <DialogTrigger asChild>
              <Button variant="link" className="text-sm text-muted-foreground hover:text-primary">
                Создать аккаунт саб-лейбла
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Регистрация саб-лейбла</DialogTitle>
                <DialogDescription>
                  Создайте аккаунт саб-лейбла
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleRegisterS} className="space-y-4 py-4">
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
      <Card>
        <CardHeader>
          <CardTitle>Список пользователей</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-4">Загрузка пользователей...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Пользователь</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Роль</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-4">
                      Нет пользователей
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <UserAvatar user={user} size="sm" />
                          <div className="font-medium">{user.name}</div>
                        </div>
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        {user.role === 'admin' ? 'Администратор' : 'Саб-лейбл'}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
