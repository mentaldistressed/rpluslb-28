
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/contexts/ThemeContext";
import { cn } from "@/lib/utils";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      className={cn(
        "relative h-9 w-9 rounded-full transition-all duration-300",
        "border-border/50 bg-background hover:bg-secondary",
        "dark:hover:bg-secondary dark:border-border/30 dark:hover:border-border/50",
        "overflow-hidden"
      )}
      aria-label="Переключить тему"
    >
      <span className="sr-only">Переключить тему</span>
      <span 
        className={cn(
          "absolute inset-0 flex items-center justify-center transition-all duration-500 transform",
          theme === "dark" ? "translate-y-full opacity-0" : "translate-y-0 opacity-100"
        )}
      >
        <Sun className="h-5 w-5 text-amber-500" />
      </span>
      <span 
        className={cn(
          "absolute inset-0 flex items-center justify-center transition-all duration-500 transform",
          theme === "light" ? "-translate-y-full opacity-0" : "translate-y-0 opacity-100"
        )}
      >
        <Moon className="h-5 w-5 text-blue-400" />
      </span>
    </Button>
  );
}
