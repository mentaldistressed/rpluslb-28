
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center p-4">
      <h1 className="text-4xl font-bold mb-2">404</h1>
      <h2 className="text-2xl font-semibold mb-4">страница не найдена</h2>
      <p className="text-muted-foreground mb-8 max-w-md">
        запрашиваемая страница не существует или была перемещена.
      </p>
      <Link to="/">
        <Button>вернуться на главную</Button>
      </Link>
    </div>
  );
}
