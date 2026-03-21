import { motion } from "framer-motion";
import { useUser } from "@/contexts/UserContext";
import { inboxNotifications, notificationTypeStyles } from "@/data/inboxNotifications";

export default function MyInbox() {
  const { user } = useUser();

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
        {inboxNotifications.map((item, i) => {
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
                <div className={`shrink-0 h-9 w-9 rounded-lg flex items-center justify-center ${notificationTypeStyles[item.type]}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h4 className="text-sm font-semibold text-foreground">{item.title}</h4>
                    <span className="text-[11px] text-muted-foreground shrink-0">{item.time}</span>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.message}</p>
                  {item.from && (
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
