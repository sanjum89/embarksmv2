import { useEffect } from "react";
import { toast } from "sonner";
import { subscribeEngagementEvents } from "@/lib/embarkEngagementEvents";
import {
  pickRetentionToast,
  pickReopenToast,
} from "@/lib/embarkSupportiveMessages";

/**
 * Mounts globally and surfaces supportive nudges as toasts when the user
 * is outside the Embark AI chat. The Embark chat itself injects the same
 * events into the conversation, but a single dispatch can produce both
 * surfaces — that's intentional. Sonner dedupes identical toasts within
 * a short window via its internal id system if needed.
 */
export function SupportiveToastBridge() {
  useEffect(() => {
    const unsubscribe = subscribeEngagementEvents((event) => {
      if (event.type === "retention_gap_detected") {
        const { title, description } = pickRetentionToast(event.weakTopics);
        toast(title, { description, duration: 7000 });
        return;
      }

      if (event.type === "module_reopened") {
        const { title, description } = pickReopenToast(event.moduleTitle);
        toast(title, { description, duration: 6000 });
        return;
      }

      if (event.type === "refresher_passed") {
        toast(`✨ Nice — ${event.topic} locked in`, {
          description: "That's the kind of growth that sticks.",
          duration: 6000,
        });
        return;
      }

      if (event.type === "struggling_streak") {
        toast("I've got you", {
          description:
            "Showing up matters more than any score. The next steps will stay focused and bite-sized.",
          duration: 7000,
        });
      }
    });
    return unsubscribe;
  }, []);

  return null;
}
