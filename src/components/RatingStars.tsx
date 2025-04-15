
import { useState } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface RatingStarsProps {
  onChange?: (rating: number) => void;
  disabled?: boolean;
  initialRating?: number;
  size?: "sm" | "md" | "lg";
  readOnly?: boolean;
  className?: string;
}

export const RatingStars = ({ 
  onChange, 
  disabled = false, 
  initialRating = 0,
  size = "md",
  readOnly = false,
  className
}: RatingStarsProps) => {
  const [rating, setRating] = useState(initialRating);
  const [hover, setHover] = useState(0);

  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8"
  };

  const handleClick = (value: number) => {
    if (disabled || readOnly) return;
    setRating(value);
    onChange?.(value);
  };

  return (
    <div className={cn("flex gap-1", className)}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => handleClick(star)}
          onMouseEnter={() => !disabled && !readOnly && setHover(star)}
          onMouseLeave={() => !disabled && !readOnly && setHover(0)}
          className={cn(
            "transition-colors duration-200",
            disabled || readOnly ? "cursor-default" : "cursor-pointer hover:scale-110"
          )}
          disabled={disabled || readOnly}
          aria-label={`Rate ${star} out of 5 stars`}
        >
          <Star
            className={cn(
              sizeClasses[size],
              "transition-all duration-200",
              (hover || rating) >= star
                ? "fill-yellow-400 text-yellow-400"
                : "fill-none text-muted-foreground/40"
            )}
          />
        </button>
      ))}
    </div>
  );
};
