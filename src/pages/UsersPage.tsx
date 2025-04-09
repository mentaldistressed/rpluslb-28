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
import { z } from "zod";
import { formSchema } from "@/schemas/formSchema";

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
  const [isSubmitting, setIsSubmitting] = useState(false);
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
      title: "скопировано в буфер обмена",
      description: "данные скопированы в буфер обмена",
    });
  };
  
  const handleTogglePasswordType = () => {
    if (!useGeneratedPassword) {
      generateRandomPassword();
    }
    setUseGeneratedPassword(!useGeneratedPassword);
  };

  const handleRegisterS = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (registerPassword !== registerPasswordConfirm) {
      toast({
        title: "ошибка регистрации",
        description: "пароли не совпадают",
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
          title: "ошибка регистрации",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "регистрация успешна",
          description: "теперь вы можете войти в систему",
        });
        setEmail(registerEmail);
        setPassword(registerPassword);
      }
    } catch (error) {
      console.error("Registration error:", error);
      toast({
        title: "ошибка регистрации",
        description: "произошла неизвестная ошибка при регистрации",
        variant: "destructive",
      });
    } finally {
      setIsRegistering(false);
    }
  };

  const handleCreateUser = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    
    try {
      const { data, error } = await supabase.auth.admin.createUser({
        email: values.email,
        password: values.password,
        email_confirm: true,
        user_metadata: {
          name: values.name,
          role: 'sublabel'
        }
      });
      
      if (error) {
        console.error("Error creating user:", error);
        toast({
          title: "Ошибка",
          description: error.message || "Не удалось создать пользователя",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Пользователь создан",
          description: "Новый сублейбл успешно добавлен",
        });
        form.reset();
        fetchUsers();
      }
    } catch (err) {
      console.error("Error creating user:", err);
      toast({
        title: "Ошибка",
        description: "Не удалось создать пользователя",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user || user.role !== 'admin') {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold">доступ запрещен</h2>
        <p className="text-muted-foreground mt-1">у Вас нет доступа к этой странице</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">пользователи</h1>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              новый пользователь
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>создать нового пользователя</DialogTitle>
              <DialogDescription>
                заполните информацию для создания нового пользователя
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">имя</Label>
                <Input
                  id="name"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  placeholder="название саб-лейбла или имя пользователя"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">почта</Label>
                <Input
                  id="email"
                  type="email"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  placeholder="mail@label.ru"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">пароль</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      id="password"
                      type="text"
                      value={newUserPassword}
                      onChange={(e) => setNewUserPassword(e.target.value)}
                      placeholder="пароль"
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
                    {useGeneratedPassword ? "ввести вручную" : "сгенерировать"}
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
                <Label htmlFor="role">роль</Label>
                <Select
                  value={newUserRole}
                  onValueChange={(value) => setNewUserRole(value as UserRole)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите роль" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">администратор</SelectItem>
                    <SelectItem value="sublabel">саб-лейбл</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="mt-4">
                <Button
                  type="button"
                  onClick={() => copyToClipboard(`Данные для входа в учётную запись p.rpluslb.ru\n\nEmail: ${newUserEmail}\nПароль: ${newUserPassword}`)}
                  variant="outline"
                  className="w-full"
                >
                  <Copy className="mr-2 h-4 w-4" />
                  скопировать все данные
                </Button>
              </div>
            </div>
            
            <DialogFooter>
              <Button onClick={handleCreateUser}>создать</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>список пользователей</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-4">загрузка пользователей...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>пользователь</TableHead>
                  <TableHead>почта</TableHead>
                  <TableHead>роль</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-4">
                      нет пользователей
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
                        {user.role === 'admin' ? 'администратор' : 'саб-лейбл'}
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
