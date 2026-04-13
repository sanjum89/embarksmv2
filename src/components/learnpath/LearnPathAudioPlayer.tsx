import { useState, useRef, useCallback } from "react";
import { Play, Pause, Volume2, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";

const TTS_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/elevenlabs-tts`;
const VOICE_ID = "JBFqnCBsd6RMkjVDRZzb"; // George

interface Props {
  text: string;
}

export function EmbarkAudioPlayer({ text }: Props) {
  const [status, setStatus] = useState<"idle" | "loading" | "playing" | "paused" | "error">("idle");
  const [progress, setProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const seekingRef = useRef(false);

  const cleanup = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (audioRef.current) {
      audioRef.current.pause();
      URL.revokeObjectURL(audioRef.current.src);
      audioRef.current = null;
    }
  }, []);

  const handlePlay = useCallback(async () => {
    if (status === "playing") {
      audioRef.current?.pause();
      setStatus("paused");
      return;
    }
    if (status === "paused" && audioRef.current) {
      audioRef.current.play();
      setStatus("playing");
      return;
    }

    setStatus("loading");
    setErrorMsg("");
    cleanup();

    try {
      // Try ElevenLabs first
      const resp = await fetch(TTS_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ text: text.slice(0, 4500), voiceId: VOICE_ID }),
      });

      if (!resp.ok) {
        throw new Error("TTS unavailable");
      }

      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioRef.current = audio;

      audio.onended = () => {
        setStatus("idle");
        setProgress(0);
        cleanup();
      };

      intervalRef.current = setInterval(() => {
        if (audio.duration && !seekingRef.current) {
          const clamped = Math.min(audio.currentTime, audio.duration);
          setProgress((clamped / audio.duration) * 100);
        }
      }, 200);

      await audio.play();
      setStatus("playing");
    } catch {
      // Fallback to browser SpeechSynthesis
      if ("speechSynthesis" in window) {
        const utterance = new SpeechSynthesisUtterance(text.slice(0, 3000));
        utterance.rate = 1;
        utterance.onend = () => {
          setStatus("idle");
          setProgress(0);
        };
        speechSynthesis.speak(utterance);
        setStatus("playing");
      } else {
        setStatus("error");
        setErrorMsg("Audio not available. Configure ElevenLabs API key for TTS.");
      }
    }
  }, [text, status, cleanup]);

  return (
    <div className="bg-muted rounded-lg p-4 space-y-3">
      <div className="flex items-center gap-3">
        <Button
          size="icon"
          variant="outline"
          onClick={handlePlay}
          disabled={status === "loading"}
          className="h-10 w-10 shrink-0"
        >
          {status === "loading" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : status === "playing" ? (
            <Pause className="h-4 w-4" />
          ) : (
            <Play className="h-4 w-4" />
          )}
        </Button>
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <Volume2 className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              {status === "loading" ? "Generating audio..." : status === "playing" ? "Playing" : "Audio narration"}
            </span>
          </div>
          <Slider
            value={[progress]}
            max={100}
            step={1}
            className="cursor-pointer"
            disabled={status !== "playing" && status !== "paused"}
            onValueChange={(vals) => {
              seekingRef.current = true;
              setProgress(vals[0]);
            }}
            onValueCommit={(vals) => {
              if (audioRef.current && audioRef.current.duration) {
                audioRef.current.currentTime = Math.min(
                  (vals[0] / 100) * audioRef.current.duration,
                  audioRef.current.duration
                );
              }
              seekingRef.current = false;
            }}
          />
        </div>
      </div>
      {status === "error" && (
        <div className="flex items-center gap-2 text-xs text-destructive">
          <AlertCircle className="h-3.5 w-3.5" />
          {errorMsg}
        </div>
      )}
    </div>
  );
}
