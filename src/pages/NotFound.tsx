
import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-background to-background/50">
      <div className="bg-primary/5 p-6 rounded-full mb-6">
        <AlertTriangle className="h-12 w-12 text-primary/70" />
      </div>
      <h1 className="text-5xl font-bold mb-2 text-primary">404</h1>
      <p className="text-xl text-muted-foreground mb-6">страница не найдена</p>
      <a href="/" className="inline-flex items-center text-primary hover:underline font-medium">
        вернуться на главную
      </a>
    </div>
  );
};

export default NotFound;
