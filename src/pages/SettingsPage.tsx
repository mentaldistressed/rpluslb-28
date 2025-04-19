import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"

export default function SettingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [changelog, setChangelog] = useState([]);
  const [changelogVersion, setChangelogVersion] = useState("");
  const [changelogDescription, setChangelogDescription] = useState("");

  useEffect(() => {
    fetchChangelog();
  }, []);

  const fetchChangelog = async () => {
    try {
      const { data, error } = await supabase
        .from('changelog_entries')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Error fetching changelog:", error);
        return;
      }

      setChangelog(data);
    } catch (error) {
      console.error("Error fetching changelog:", error);
    }
  };

  // Modified handleAddChangelogEntry function to fix the array type issue
  const handleAddChangelogEntry = async () => {
    if (!changelogVersion || !changelogDescription) return;
  
    try {
      // Convert description string to object with proper typing
      const formattedDescription = changelogDescription; // This is already a string
      
      await supabase
        .from('changelog_entries')
        .insert({
          version: changelogVersion,
          description: formattedDescription
        });
        
      toast({
        title: "Changelog added",
        description: "The changelog entry has been added successfully.",
      });
      
      setChangelogVersion("");
      setChangelogDescription("");
      fetchChangelog();
    } catch (error) {
      console.error("Error adding changelog entry:", error);
      toast({
        title: "Error",
        description: "Failed to add changelog entry.",
        variant: "destructive",
      });
    }
  };

  if (user?.role !== 'admin') {
    return (
      <div className="animate-fade-in flex h-screen items-center justify-center">
        <h1 className="text-2xl font-bold">доступ запрещен</h1>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">настройки</h1>
      </div>

      <div className="grid gap-4">
        <h2 className="text-xl font-semibold">добавить запись в changelog</h2>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="version" className="text-right">
            версия
          </Label>
          <Input
            type="text"
            id="version"
            value={changelogVersion}
            onChange={(e) => setChangelogVersion(e.target.value)}
            className="col-span-3"
          />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="description" className="text-right">
            описание
          </Label>
          <Textarea
            id="description"
            value={changelogDescription}
            onChange={(e) => setChangelogDescription(e.target.value)}
            className="col-span-3"
          />
        </div>
        <Button onClick={handleAddChangelogEntry} className="col-start-2 col-span-3 w-fit">
          добавить
        </Button>
      </div>

      <div>
        <h2 className="text-xl font-semibold">Changelog</h2>
        <div className="rounded-md border">
          <Table>
            <TableCaption>список всех обновлений приложения.</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">версия</TableHead>
                <TableHead>описание</TableHead>
                <TableHead>дата</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {changelog.map((entry: any) => (
                <TableRow key={entry.id}>
                  <TableCell className="font-medium">{entry.version}</TableCell>
                  <TableCell>{entry.description}</TableCell>
                  <TableCell>{new Date(entry.created_at).toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
