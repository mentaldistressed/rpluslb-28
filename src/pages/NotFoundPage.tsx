
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center p-4 bg-gradient-to-b from-background to-background/50">
      <div className="bg-primary/5 p-6 rounded-full mb-6">
        <AlertTriangle className="h-12 w-12 text-primary/70" />
      </div>
      <h1 className="text-5xl font-bold mb-2 text-primary">404</h1>
      <h2 className="text-2xl font-medium mb-6">страница не найдена</h2>
      <p className="text-muted-foreground mb-8 max-w-md">
        запрашиваемая страница не существует или была перемещена
      </p>
      <Link to="/">
        <Button>вернуться на главную</Button>
      </Link>
    </div>
  );
}
