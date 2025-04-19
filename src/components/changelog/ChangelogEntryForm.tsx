
import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2 } from "lucide-react";

interface ChangelogEntryFormProps {
  entries: string[];
  onChange: (entries: string[]) => void;
}

export function ChangelogEntryForm({ entries, onChange }: ChangelogEntryFormProps) {
  const handleAdd = () => {
    onChange([...entries, '']);
  };

  const handleChange = (index: number, value: string) => {
    const newEntries = [...entries];
    newEntries[index] = value;
    onChange(newEntries);
  };

  const handleRemove = (index: number) => {
    onChange(entries.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      {entries.map((entry, index) => (
        <div key={index} className="flex gap-2">
          <Input
            value={entry}
            onChange={(e) => handleChange(index, e.target.value)}
            placeholder={`изменение ${index + 1}`}
            className="flex-1"
          />
          {entries.length > 1 && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-10 w-10 shrink-0 text-destructive"
              onClick={() => handleRemove(index)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-full"
        onClick={handleAdd}
      >
        <Plus className="h-4 w-4 mr-2" />
        добавить изменение
      </Button>
    </div>
  );
}
