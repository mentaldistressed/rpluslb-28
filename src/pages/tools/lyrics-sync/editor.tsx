
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider"; 
import { Music, Pause, Play, RotateCcw, Download, MinusCircle, RefreshCcw, Volume2, VolumeX, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface SyncedLine {
  text: string;
  time: number;
}

interface LyricsSyncData {
  audioUrl: string;
  artist: string;
  title: string;
  lyrics: string;
}

export default function LyricsSyncEditor() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentLine, setCurrentLine] = useState(0);
  const [syncedLines, setSyncedLines] = useState<SyncedLine[]>([]);
  const [syncData, setSyncData] = useState<LyricsSyncData | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(100);
  const [autoScroll, setAutoScroll] = useState(true);
  const [audioError, setAudioError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const linesRef = useRef<string[]>([]);
  const currentLineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const storedData = sessionStorage.getItem('lyricsSyncData');
    if (!storedData) {
      navigate('/tools/lyrics-sync');
      return;
    }

    const data = JSON.parse(storedData) as LyricsSyncData;
    setSyncData(data);
    linesRef.current = data.lyrics.split('\n').filter(line => line.trim());
  }, [navigate]);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.code === 'Space' && isPlaying && currentLine < linesRef.current.length) {
        e.preventDefault();
        const time = audioRef.current?.currentTime || 0;
        setSyncedLines(prev => [...prev, {
          text: linesRef.current[currentLine],
          time
        }]);
        setCurrentLine(prev => prev + 1);

        if (currentLine === linesRef.current.length - 1) {
          setIsPlaying(false);
          audioRef.current?.pause();
          toast({
            title: "синхронизация завершена",
            description: "теперь вы можете скачать результат"
          });
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentLine, isPlaying, toast]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    
    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
      audio.volume = volume / 100;
      setAudioError(null);
    };
    
    const handleError = (e: Event) => {
      console.error("Error playing audio:", e);
      setAudioError("не удалось воспроизвести аудио файл");
      setIsPlaying(false);
    };
    
    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('error', handleError);
    
    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('error', handleError);
    };
  }, [volume]);

  // Scroll to current line when it changes
  useEffect(() => {
    if (autoScroll && currentLineRef.current) {
      currentLineRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  }, [currentLine, autoScroll]);

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    const milliseconds = Math.floor((time % 1) * 1000);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(3, '0')}`;
  };

  const togglePlayback = () => {
    const audio = audioRef.current;
    if (!audio) return;
    
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPlaying(true);
            setAudioError(null);
          })
          .catch(error => {
            console.error("Error playing audio:", error);
            setAudioError("не удалось воспроизвести аудио файл");
            setIsPlaying(false);
            toast({
              title: "ошибка воспроизведения",
              description: "не удалось воспроизвести аудио файл",
              variant: "destructive"
            });
          });
      }
    }
  };

  const resetSync = () => {
    setCurrentLine(0);
    setSyncedLines([]);
    setIsPlaying(false);
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.pause();
    }
  };

  const resetCurrentLine = () => {
    if (currentLine > 0) {
      setCurrentLine(prev => prev - 1);
      setSyncedLines(prev => prev.slice(0, -1));
    }
  };

  const handleSliderChange = (value: number[]) => {
    if (audioRef.current) {
      audioRef.current.currentTime = value[0];
    }
  };

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume / 100;
    }
  };

  const generateLRC = () => {
    if (!syncData) return;
    
    const lrc = `[ar:${syncData.artist}]
[ti:${syncData.title}]
[length:${formatTime(duration)}]
[re:Lovable Lyrics Editor]

${syncedLines.map(line => `[${formatTime(line.time)}]${line.text}`).join('\n')}`;

    const blob = new Blob([lrc], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${syncData.artist} - ${syncData.title}.lrc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const generateTTML = () => {
    if (!syncData) return;
    
    const ttml = `<?xml version="1.0" encoding="UTF-8"?>
<tt xmlns="http://www.w3.org/ns/ttml">
  <head>
    <metadata>
      <ttm:title>${syncData.title}</ttm:title>
      <ttm:desc>Lyrics for ${syncData.artist} - ${syncData.title}</ttm:desc>
    </metadata>
  </head>
  <body>
    <div>
      ${syncedLines.map((line, index) => {
        const nextTime = syncedLines[index + 1]?.time || line.time + 5;
        return `<p begin="${line.time.toFixed(3)}s" end="${nextTime.toFixed(3)}s">${line.text}</p>`;
      }).join('\n      ')}
    </div>
  </body>
</tt>`;

    const blob = new Blob([ttml], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${syncData.artist} - ${syncData.title}.ttml`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!syncData) return null;

  const progress = (currentLine / linesRef.current.length) * 100;

  return (
    <div className="container max-w-4xl mx-auto py-6 space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Music className="h-5 w-5" />
            синхронизация текста
          </CardTitle>
          <CardDescription>
            нажимайте пробел в момент начала каждой строки текста
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Audio Element */}
          <audio 
            ref={audioRef} 
            src={syncData.audioUrl} 
            preload="auto"
            onEnded={() => setIsPlaying(false)}
          />

          {/* Error Alert */}
          {audioError && (
            <Alert variant="destructive" className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>ошибка воспроизведения</AlertTitle>
              <AlertDescription>{audioError}</AlertDescription>
            </Alert>
          )}

          {/* Time Slider */}
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
            
            <div className="relative">
              <Slider
                value={[currentTime]}
                min={0}
                max={duration || 100}
                step={0.1}
                onValueChange={handleSliderChange}
                className="w-full"
              />
            </div>

            {/* Controls Row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={togglePlayback}
                  disabled={currentLine === linesRef.current.length || !!audioError}
                >
                  {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </Button>
                <Button 
                  variant="outline"
                  onClick={resetCurrentLine}
                  className="gap-2"
                >
                  <MinusCircle className="h-4 w-4" />
                  сбросить строку
                </Button>
                <Button 
                  variant="outline"
                  onClick={resetSync}
                  className="gap-2"
                >
                  <RefreshCcw className="h-4 w-4" />
                  сбросить все
                </Button>
              </div>
              
              {/* Volume Controls */}
              <div className="flex items-center gap-4">
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={toggleMute}
                >
                  {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                </Button>
                <Slider
                  value={[volume]}
                  min={0}
                  max={100}
                  step={1}
                  onValueChange={handleVolumeChange}
                  className="w-24"
                />
                <div className="flex items-center gap-2">
                  <span className="text-sm">автопрокрутка</span>
                  <Switch 
                    checked={autoScroll}
                    onCheckedChange={setAutoScroll}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Track info and Lyrics */}
          <div className="space-y-4">
            <div className="text-lg font-medium">
              {syncData.artist} - {syncData.title}
            </div>

            <div className="space-y-0.5 max-h-80 overflow-y-auto p-2 border rounded-md">
              {linesRef.current.map((line, index) => (
                <div 
                  key={index}
                  ref={index === currentLine ? currentLineRef : undefined}
                  className={`p-2 rounded transition-colors ${
                    index === currentLine 
                      ? "bg-primary text-primary-foreground" 
                      : index < currentLine 
                        ? "text-muted-foreground"
                        : ""
                  }`}
                >
                  {syncedLines[index] ? `[${formatTime(syncedLines[index].time)}] ` : ''}{line}
                </div>
              ))}
            </div>
          </div>

          {/* Export Buttons */}
          {currentLine === linesRef.current.length && (
            <div className="flex gap-4">
              <Button 
                className="flex-1"
                onClick={generateTTML}
              >
                <Download className="h-4 w-4 mr-2" />
                скачать TTML
              </Button>
              <Button 
                className="flex-1"
                onClick={generateLRC}
              >
                <Download className="h-4 w-4 mr-2" />
                скачать LRC
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
