
import { ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Toaster } from "@/components/ui/toaster";
import Header from "./Header";
import Sidebar from "./Sidebar";
import { NewsBanner } from "@/components/NewsBanner";

interface MainLayoutProps {
  children: ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        {children}
        <Toaster />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <div className="flex flex-col flex-1">
        {/* <div className="w-full px-6 pt-6">
          <NewsBanner />
        </div> */}
        <div className="flex flex-1">
        <Sidebar />
         <main className="flex-1 p-6">
           <div className="mb-4">
             <NewsBanner />
           </div>
           {children}
         </main>
        </div>
      </div>
      <Toaster />
    </div>
  );
}
