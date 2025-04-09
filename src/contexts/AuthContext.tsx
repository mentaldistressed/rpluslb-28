
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { User } from "@/types";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        console.log("Auth state changed:", event);
        setSession(currentSession);
        
        if (currentSession?.user) {
          // Don't make Supabase calls inside the callback to prevent deadlocks
          setTimeout(async () => {
            // Get the user profile from the profiles table
            const { data: profile, error } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', currentSession.user.id)
              .single();

            if (profile) {
              setUser({
                id: currentSession.user.id,
                email: profile.email,
                name: profile.name,
                role: profile.role as "admin" | "sublabel",
                avatar: profile.avatar
              });
              setIsLoading(false);
            } else if (error) {
              console.error("Error fetching profile:", error);
              setIsLoading(false);
            }
          }, 0);
        } else {
          setUser(null);
          setIsLoading(false);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session: existingSession } }) => {
      console.log("Existing session:", existingSession);
      setSession(existingSession);
      
      if (existingSession?.user) {
        supabase
          .from('profiles')
          .select('*')
          .eq('id', existingSession.user.id)
          .single()
          .then(({ data: profile, error }) => {
            if (profile) {
              setUser({
                id: existingSession.user.id,
                email: profile.email,
                name: profile.name,
                role: profile.role as "admin" | "sublabel",
                avatar: profile.avatar
              });
            }
            
            if (error) {
              console.error("Error fetching profile:", error);
            }
            
            setIsLoading(false);
          });
      } else {
        setIsLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      console.log("Attempting login for:", email);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        console.error("Login error:", error);
        toast({
          title: "ошибка входа",
          description: error.message === "Invalid login credentials" 
            ? "неверный email или пароль" 
            : error.message,
          variant: "destructive",
        });
        setIsLoading(false);
        return false;
      }
      
      toast({
        title: "авторизация успешна",
        description: "вы успешно вошли в систему",
      });
      
      return true;
    } catch (error: any) {
      console.error("Unexpected login error:", error);
      toast({
        title: "ошибка входа",
        description: "произошла непредвиденная ошибка при входе",
        variant: "destructive",
      });
      setIsLoading(false);
      return false;
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    toast({
      title: "выход выполнен",
      description: "Вы успешно вышли из системы",
    });
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
