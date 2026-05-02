import { useState, useRef, useCallback, useEffect } from "react";
import { Play, Pause, Volume2, Loader2, AlertCircle, RotateCcw, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import type { PodcastScript } from "@/data/podcastTranscripts";

const TTS_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/elevenlabs-tts`;
const VOICE_ID = "JBFqnCBsd6RMkjVDRZzb"; // George

interface Props {
  script: PodcastScript;
  staticAudioUrl?: string;
}

function scriptToText(script: PodcastScript): string {
  return script.map((line) => `${line.speaker}: ${line.text}`).join("\n\n");
}

const formatTime = (s: number) => {
  if (!isFinite(s) || s < 0) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
};

export function EmbarkPodcastPlayer({ script, staticAudioUrl }: Props) {
  const isStatic = !!staticAudioUrl;
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "playing" | "paused" | "error">(isStatic ? "loading" : "idle");
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState("--:--");
  const [currentTime, setCurrentTime] = useState("0:00");
  const [speed, setSpeed] = useState(1);
  const [showTranscript, setShowTranscript] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const seekingRef = useRef(false);

  const fullText = scriptToText(script);

  /** Attach native event listeners to an audio element */
  const attachEvents = useCallback((audio: HTMLAudioElement, isOnDemand = false) => {
    audio.addEventListener("loadedmetadata", () => {
      if (isFinite(audio.duration)) {
        setDuration(formatTime(audio.duration));
      }
    });

    audio.addEventListener("timeupdate", () => {
      if (seekingRef.current) return;
      if (!isFinite(audio.duration) || audio.duration === 0) return;
      const clamped = Math.min(audio.currentTime, audio.duration);
      setProgress((clamped / audio.duration) * 100);
      setCurrentTime(formatTime(clamped));
    });

    audio.addEventListener("ended", () => {
      setStatus(isOnDemand ? "idle" : "ready");
      setProgress(0);
      setCurrentTime("0:00");
    });

    audio.addEventListener("seeked", () => {
      // After browser finishes seeking, sync UI
      if (!isFinite(audio.duration) || audio.duration === 0) return;
      const clamped = Math.min(audio.currentTime, audio.duration);
      setProgress((clamped / audio.duration) * 100);
      setCurrentTime(formatTime(clamped));
    });
  }, []);

  // Pre-load static audio on mount
  useEffect(() => {
    if (!staticAudioUrl) return;

    const audio = new Audio(staticAudioUrl);
    audio.preload = "auto";
    audioRef.current = audio;

    attachEvents(audio);

    audio.addEventListener("canplaythrough", () => {
      setStatus((prev) => (prev === "loading" ? "ready" : prev));
    }, { once: true });

    audio.addEventListener("error", () => {
      setStatus("error");
      setErrorMsg("Failed to load pre-generated audio.");
    }, { once: true });

    // Also handle loadedmetadata for quick ready state
    audio.addEventListener("loadedmetadata", () => {
      setStatus((prev) => (prev === "loading" ? "ready" : prev));
    }, { once: true });

    return () => {
      audio.pause();
      audioRef.current = null;
    };
  }, [staticAudioUrl, attachEvents]);

  const handlePlay = useCallback(async () => {
    if (status === "playing") {
      audioRef.current?.pause();
      setStatus("paused");
      return;
    }

    if ((status === "paused" || status === "ready") && audioRef.current) {
      audioRef.current.playbackRate = speed;
      await audioRef.current.play();
      setStatus("playing");
      return;
    }

    if (isStatic && status === "loading") return;

    if (isStatic) {
      setErrorMsg("Pre-generated audio failed to load. Try refreshing.");
      setStatus("error");
      return;
    }

    // Generate on-demand (non-static modules only)
    setStatus("loading");
    setErrorMsg("");
    if (audioRef.current) {
      audioRef.current.pause();
      if (audioRef.current.src.startsWith("blob:")) {
        URL.revokeObjectURL(audioRef.current.src);
      }
      audioRef.current = null;
    }

    try {
      const resp = await fetch(TTS_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ text: fullText.slice(0, 4500), voiceId: VOICE_ID }),
      });

      if (!resp.ok) throw new Error("TTS unavailable");

      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audio.playbackRate = speed;
      audioRef.current = audio;

      attachEvents(audio, true);

      await audio.play();
      setStatus("playing");
    } catch {
      if ("speechSynthesis" in window) {
        const utterance = new SpeechSynthesisUtterance(fullText.slice(0, 3000));
        utterance.rate = speed;
        utterance.onend = () => {
          setStatus("idle");
          setProgress(0);
        };
        speechSynthesis.speak(utterance);
        setStatus("playing");
      } else {
        setStatus("error");
        setErrorMsg("Audio not available.");
      }
    }
  }, [fullText, status, speed, isStatic, attachEvents]);

  const handleSeekVisual = useCallback((value: number[]) => {
    seekingRef.current = true;
    setProgress(value[0]);
    if (audioRef.current && isFinite(audioRef.current.duration)) {
      setCurrentTime(formatTime((value[0] / 100) * audioRef.current.duration));
    }
  }, []);

  const handleSeekCommit = useCallback((value: number[]) => {
    if (audioRef.current && isFinite(audioRef.current.duration)) {
      const time = Math.min((value[0] / 100) * audioRef.current.duration, audioRef.current.duration);
      audioRef.current.currentTime = time;
    }
    seekingRef.current = false;
  }, []);

  const handleRestart = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      setProgress(0);
      setCurrentTime("0:00");
    }
  }, []);

  const cycleSpeed = useCallback(() => {
    const speeds = [0.75, 1, 1.25, 1.5, 2];
    const idx = speeds.indexOf(speed);
    const next = speeds[(idx + 1) % speeds.length];
    setSpeed(next);
    if (audioRef.current) audioRef.current.playbackRate = next;
  }, [speed]);

  const isReady = status === "ready" || status === "playing" || status === "paused";

  return (
    <div className="space-y-3">
      <div className="bg-card rounded-xl border border-border p-4 space-y-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Volume2 className="h-3.5 w-3.5" />
          <span className="font-medium">Audio Playback</span>
          {isStatic && (
            <span className="text-[0.65rem] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-medium">
              Pre-generated
            </span>
          )}
          <span className="ml-auto">{currentTime} / {duration}</span>
        </div>

        <Slider
          value={[progress]}
          max={100}
          step={0.5}
          className="cursor-pointer"
          onValueChange={handleSeekVisual}
          onValueCommit={handleSeekCommit}
          disabled={!isReady}
        />

        <div className="flex items-center gap-2">
          <Button size="icon" variant="outline" onClick={handleRestart} className="h-8 w-8" disabled={status === "idle"}>
            <RotateCcw className="h-3.5 w-3.5" />
          </Button>
          <Button size="icon" onClick={handlePlay} disabled={status === "loading"} className="h-10 w-10">
            {status === "loading" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : status === "playing" ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4" />
            )}
          </Button>
          <Button size="sm" variant="ghost" onClick={cycleSpeed} className="text-xs px-2 h-8">
            {speed}x
          </Button>
        </div>

        {status === "error" && (
          <div className="flex items-center gap-2 text-xs text-destructive">
            <AlertCircle className="h-3.5 w-3.5" />
            {errorMsg}
          </div>
        )}
      </div>

      <button
        onClick={() => setShowTranscript(!showTranscript)}
        className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors w-full"
      >
        {showTranscript ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        {showTranscript ? "Hide Transcript" : "Show Transcript"}
      </button>

      {showTranscript && (
        <div className="bg-card rounded-lg border border-border p-4 space-y-3 text-sm">
          {script.map((line, i) => (
            <div key={i}>
              <span className="font-semibold text-foreground">{line.speaker}</span>
              <span className="text-muted-foreground ml-1 text-xs">({line.role})</span>
              <p className="text-muted-foreground mt-0.5">{line.text}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
