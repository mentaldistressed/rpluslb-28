
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Clock } from "lucide-react";

export default function ReleasesPage() {
  const { user } = useAuth();
  
  if (!user) return null;
  
  const isAdmin = user.role === 'admin';
  
  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{isAdmin ? 'управление каталогом' : 'мой каталог'}</h1>
      </div>

      <Card className="border-border/40 overflow-hidden">
        <CardHeader className="bg-secondary/30">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-10 w-10 bg-secondary/50 rounded-full flex items-center justify-center">
              <Clock className="h-5 w-5 text-muted-foreground" />
            </div>
            <CardTitle>функционал в разработке</CardTitle>
          </div>
          <CardDescription>
            Каталог релизов находится в стадии разработки и будет доступен в ближайшее время
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="h-12 bg-secondary/20 rounded-lg animate-pulse"></div>
            <div className="h-12 bg-secondary/20 rounded-lg animate-pulse"></div>
            <div className="h-12 bg-secondary/20 rounded-lg animate-pulse"></div>
            <div className="flex justify-center mt-4">
              <p className="text-sm text-muted-foreground">
                Каталог релизов будет доступен в ближайшем обновлении системы
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
