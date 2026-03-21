import { motion } from "framer-motion";
import { Inbox, Calendar, Star, MessageSquare } from "lucide-react";
import { useUser } from "@/contexts/UserContext";

export default function MyInbox() {
  const { user } = useUser();

  const notifications = [
    {
      id: "n1",
      type: "one_on_one" as const,
      icon: Calendar,
      title: "1:1 Meeting Scheduled",
      message: "Your manager has scheduled a 1:1 for Friday at 2pm to discuss your onboarding progress.",
      time: "2 hours ago",
      read: false,
    },
    {
      id: "n2",
      type: "kudos" as const,
      icon: Star,
      title: "Kudos Received! 🌟",
      message: "Great job completing the Introduction to Rathbones ahead of schedule. Keep up the momentum!",
      from: "Marcus Wellington",
      time: "Yesterday",
      read: false,
    },
    {
      id: "n3",
      type: "reflection_request" as const,
      icon: MessageSquare,
      title: "Reflection Requested",
      message: "Your manager would like to hear how your first week is going. Share your thoughts on what's working and any challenges you're facing.",
      time: "2 days ago",
      read: true,
    },
  ];

  const typeStyles = {
    one_on_one: "bg-info/10 text-info border-info/20",
    kudos: "bg-accent/10 text-accent border-accent/20",
    reflection_request: "bg-primary/10 text-primary border-primary/20",
  };

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="mb-6"
      >
        <h1 className="font-display text-2xl font-bold text-foreground">My Inbox</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Notifications, tasks, and messages from your team
        </p>
      </motion.div>

      <div className="space-y-3 max-w-2xl">
        {notifications.map((item, i) => {
          const Icon = item.icon;
          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06, duration: 0.3 }}
              className={`rounded-xl bg-card border border-border/60 p-4 shadow-card transition-all hover:shadow-card-hover ${!item.read ? "border-l-2 border-l-primary" : ""}`}
            >
              <div className="flex items-start gap-3">
                <div className={`shrink-0 h-9 w-9 rounded-lg flex items-center justify-center ${typeStyles[item.type]}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h4 className="text-sm font-semibold text-foreground">{item.title}</h4>
                    <span className="text-[11px] text-muted-foreground shrink-0">{item.time}</span>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.message}</p>
                  {"from" in item && item.from && (
                    <p className="text-xs text-muted-foreground mt-1.5">From: <strong className="text-foreground">{item.from}</strong></p>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
