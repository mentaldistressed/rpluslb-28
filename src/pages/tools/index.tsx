
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Music } from "lucide-react";
import { Link } from "react-router-dom";

export default function ToolsPage() {
  return (
    <div className="container max-w-4xl mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">инструменты</h1>
      
      <div className="grid gap-6">
        <Link to="/tools/sync">
          <Card className="transition-all duration-200 hover:shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Music className="h-5 w-5" />
                синхронизация текста
              </CardTitle>
              <CardDescription>
                создание файлов синхронизации текста для треков в форматах TTML и LRC
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>
      </div>
    </div>
  );
}
