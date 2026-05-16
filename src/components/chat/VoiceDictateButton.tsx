import { useEffect, useRef, useState } from "react";
import { Mic, MicOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  onTranscript: (text: string) => void;
  disabled?: boolean;
  className?: string;
}

export function VoiceDictateButton({ onTranscript, disabled, className }: Props) {
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(true);
  const recRef = useRef<any>(null);

  useEffect(() => {
    const SR =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    if (!SR) {
      setSupported(false);
      return;
    }
    const rec = new SR();
    rec.continuous = false;
    rec.interimResults = false;
    rec.lang = "en-US";
    rec.onresult = (e: any) => {
      const text = Array.from(e.results)
        .map((r: any) => r[0]?.transcript ?? "")
        .join(" ")
        .trim();
      if (text) onTranscript(text);
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    recRef.current = rec;
    return () => {
      try {
        rec.abort();
      } catch {}
    };
  }, [onTranscript]);

  const toggle = () => {
    if (!recRef.current) return;
    if (listening) {
      try {
        recRef.current.stop();
      } catch {}
      setListening(false);
    } else {
      try {
        recRef.current.start();
        setListening(true);
      } catch {
        setListening(false);
      }
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={disabled || !supported}
      title={
        !supported
          ? "Voice input not supported in this browser"
          : listening
            ? "Stop dictation"
            : "Dictate"
      }
      className={cn(
        "h-8 w-8 rounded-lg flex items-center justify-center transition-all",
        listening
          ? "bg-red-500/10 text-red-500 animate-pulse"
          : "text-muted-foreground hover:text-foreground hover:bg-muted/60",
        (disabled || !supported) && "opacity-40 cursor-not-allowed",
        className,
      )}
    >
      {listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
    </button>
  );
}
