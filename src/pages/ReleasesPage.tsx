
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, PackageX, Bell, FileText, Lock } from "lucide-react";

export default function ReleasesPage() {
  const { user } = useAuth();
  
  if (!user) return null;
  
  const isAdmin = user.role === 'admin';
  
  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{isAdmin ? 'управление каталогом' : 'мой каталог'}</h1>
      </div>

      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-lg p-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
            <Bell className="h-5 w-5 text-blue-500" />
          </div>
          <div>
            <h3 className="font-medium text-blue-800">скоро будет доступно</h3>
            <p className="text-sm text-blue-600">работа над каталогом релизов находится в активной фазе</p>
          </div>
        </div>
      </div>

      <Card className="border-border/40 overflow-hidden">
        <CardHeader className="bg-secondary/30">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-secondary/50 rounded-full flex items-center justify-center">
                <PackageX className="h-5 w-5 text-muted-foreground" />
              </div>
              <CardTitle>функционал в разработке</CardTitle>
            </div>
            <Badge variant="outline" className="bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-200">
              скоро
            </Badge>
          </div>
          <CardDescription>
            каталог релизов находится в стадии разработки и будет доступен в ближайшем обновлении системы
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="h-12 bg-secondary/20 rounded-lg animate-pulse"></div>
            <div className="h-12 bg-secondary/20 rounded-lg animate-pulse"></div>
            <div className="h-12 bg-secondary/20 rounded-lg animate-pulse"></div>
            <div className="flex justify-center mt-6">
              {/* <p className="text-sm text-muted-foreground px-4 py-2 bg-muted/30 rounded-full">
                каталог релизов будет доступен в ближайшем обновлении системы
              </p> */}
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Stats card with blur effect */}
      {/* <Card className="border-border/40 relative overflow-hidden">
        <div className="absolute inset-0 backdrop-blur-sm bg-white/30 z-10 flex flex-col items-center justify-center">
          <Lock className="h-10 w-10 text-blue-400 mb-2" />
          <p className="text-lg font-medium text-blue-800">недоступно</p>
          <p className="text-sm text-blue-600">функционал в разработке</p>
        </div>
        <CardHeader>
          <CardTitle>
            {isAdmin ? 'управление релизами' : 'ваши релизы'}
          </CardTitle>
          <CardDescription>
            {isAdmin ? 'управление каталогом' : 'ваши релизы'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-semibold">{isAdmin ? '0' : '0'}</p>
              <p className="text-sm text-muted-foreground">всего релизов</p>
            </div>
            <FileText className="h-10 w-10 text-muted-foreground/30" />
          </div>
        </CardContent>
      </Card> */}
    </div>
  );
};
