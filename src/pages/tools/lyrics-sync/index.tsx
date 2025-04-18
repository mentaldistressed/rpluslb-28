
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Music, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface LyricsSyncData {
  audioFile: File | null;
  artist: string;
  title: string;
  lyrics: string;
}

export default function LyricsSyncPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [formData, setFormData] = useState<LyricsSyncData>({
    audioFile: null,
    artist: "",
    title: "",
    lyrics: ""
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('audio/')) {
        toast({
          title: "ошибка",
          description: "пожалуйста, загрузите аудио файл",
          variant: "destructive"
        });
        return;
      }
      setFormData(prev => ({ ...prev, audioFile: file }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.audioFile) {
      toast({
        title: "ошибка",
        description: "пожалуйста, загрузите аудио файл",
        variant: "destructive"
      });
      return;
    }

    if (!formData.artist.trim() || !formData.title.trim() || !formData.lyrics.trim()) {
      toast({
        title: "ошибка",
        description: "пожалуйста, заполните все поля",
        variant: "destructive"
      });
      return;
    }

    // Store data in sessionStorage for the next page
    sessionStorage.setItem('lyricsSyncData', JSON.stringify({
      audioUrl: URL.createObjectURL(formData.audioFile),
      artist: formData.artist,
      title: formData.title,
      lyrics: formData.lyrics
    }));

    navigate('/tools/lyrics-sync/editor');
  };

  return (
    <div className="container max-w-2xl mx-auto py-6 space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Music className="h-5 w-5" />
            синхронизация текста трека
          </CardTitle>
          <CardDescription>
            загрузите аудио файл и введите информацию о треке для синхронизации текста
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label>аудио файл</Label>
              <div className="flex items-center gap-4">
                <Button 
                  type="button" 
                  variant="secondary" 
                  className="w-full h-24"
                  onClick={() => document.getElementById('audio-upload')?.click()}
                >
                  <div className="flex flex-col items-center gap-2">
                    <Upload className="h-6 w-6" />
                    <span>
                      {formData.audioFile ? formData.audioFile.name : "нажмите чтобы загрузить"}
                    </span>
                  </div>
                </Button>
                <input
                  id="audio-upload"
                  type="file"
                  accept="audio/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>исполнитель</Label>
              <Input
                placeholder="введите имя исполнителя"
                value={formData.artist}
                onChange={e => setFormData(prev => ({ ...prev, artist: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>название трека</Label>
              <Input
                placeholder="введите название трека"
                value={formData.title}
                onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>текст трека</Label>
              <Textarea
                placeholder="введите текст трека, каждая строка с новой строки"
                value={formData.lyrics}
                onChange={e => setFormData(prev => ({ ...prev, lyrics: e.target.value }))}
                rows={10}
              />
            </div>

            <Button type="submit" className="w-full">
              продолжить
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
