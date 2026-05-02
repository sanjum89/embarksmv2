import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useUser } from "@/contexts/UserContext";
import {
  inboxNotifications as initialNotifications,
  notificationTypeStyles,
  notificationTypeLabels,
  priorityStyles,
  type InboxNotification,
  type NotificationType,
} from "@/data/inboxNotifications";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  CheckCheck,
  Inbox,
  AlertTriangle,
  Mail,
  MailOpen,
  Filter,
} from "lucide-react";

type SortKey = "newest" | "oldest" | "priority";
type ReadFilter = "all" | "unread" | "read";

const ALL_TYPES: NotificationType[] = ["meeting", "kudos", "reflection", "task_due", "feedback", "system"];

const priorityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };

export default function MyInbox() {
  const { user } = useUser();
  const [notifications, setNotifications] = useState<InboxNotification[]>(initialNotifications);
  const [typeFilter, setTypeFilter] = useState<NotificationType | "all">("all");
  const [readFilter, setReadFilter] = useState<ReadFilter>("all");
  const [sortKey, setSortKey] = useState<SortKey>("newest");
  const [search, setSearch] = useState("");

  const unreadCount = notifications.filter((n) => !n.read).length;
  const actionCount = notifications.filter((n) => !n.read && n.priority === "high").length;

  const filtered = useMemo(() => {
    let items = [...notifications];

    if (typeFilter !== "all") items = items.filter((n) => n.type === typeFilter);
    if (readFilter === "unread") items = items.filter((n) => !n.read);
    if (readFilter === "read") items = items.filter((n) => n.read);

    if (search.trim()) {
      const q = search.toLowerCase();
      items = items.filter(
        (n) => n.title.toLowerCase().includes(q) || n.message.toLowerCase().includes(q)
      );
    }

    items.sort((a, b) => {
      if (sortKey === "newest") return new Date(b.date).getTime() - new Date(a.date).getTime();
      if (sortKey === "oldest") return new Date(a.date).getTime() - new Date(b.date).getTime();
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

    return items;
  }, [notifications, typeFilter, readFilter, sortKey, search]);

  const toggleRead = (id: string) =>
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: !n.read } : n))
    );

  const markAllRead = () =>
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));

  return (
    <div className="flex-1 overflow-y-auto p-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="mb-6 flex items-start justify-between"
      >
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-display text-2xl font-bold text-foreground">Action Centre</h1>
            {unreadCount > 0 && (
              <Badge className="rounded-full text-xs">{unreadCount} unread</Badge>
            )}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Notifications, tasks, and messages from your team
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={markAllRead} className="gap-1.5 shrink-0">
            <CheckCheck className="h-4 w-4" />
            Mark all read
          </Button>
        )}
      </motion.div>

      {/* Stats Row */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05, duration: 0.3 }}
        className="grid grid-cols-3 gap-3 mb-6 max-w-2xl"
      >
        <div className="rounded-xl border border-border/60 bg-card p-4 shadow-card">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Mail className="h-4 w-4" />
            <span className="text-xs font-medium">Unread</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{unreadCount}</p>
        </div>
        <div className="rounded-xl border border-border/60 bg-card p-4 shadow-card">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-xs font-medium">Action Required</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{actionCount}</p>
        </div>
        <div className="rounded-xl border border-border/60 bg-card p-4 shadow-card">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Inbox className="h-4 w-4" />
            <span className="text-xs font-medium">Total</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{notifications.length}</p>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.3 }}
        className="mb-5 max-w-2xl space-y-3"
      >
        {/* Type Tabs */}
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setTypeFilter("all")}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              typeFilter === "all"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            All
          </button>
          {ALL_TYPES.map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                typeFilter === t
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {notificationTypeLabels[t]}
            </button>
          ))}
        </div>

        {/* Search + Sort + Read filter */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[180px]">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search notifications..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-9 text-sm"
            />
          </div>
          <Select value={readFilter} onValueChange={(v) => setReadFilter(v as ReadFilter)}>
            <SelectTrigger className="w-[130px] h-9 text-sm">
              <Filter className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="unread">Unread</SelectItem>
              <SelectItem value="read">Read</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortKey} onValueChange={(v) => setSortKey(v as SortKey)}>
            <SelectTrigger className="w-[140px] h-9 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest first</SelectItem>
              <SelectItem value="oldest">Oldest first</SelectItem>
              <SelectItem value="priority">Priority</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </motion.div>

      {/* Notifications List */}
      <div className="space-y-2.5 max-w-2xl">
        {filtered.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-16 text-center"
          >
            <Inbox className="h-10 w-10 text-muted-foreground/40 mb-3" />
            <p className="text-sm font-medium text-muted-foreground">No notifications match your filters</p>
            <p className="text-xs text-muted-foreground/70 mt-1">Try adjusting your search or filter criteria</p>
          </motion.div>
        ) : (
          filtered.map((item, i) => {
            const Icon = item.icon;
            const pStyle = priorityStyles[item.priority];
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04, duration: 0.25 }}
                className={`group rounded-xl border border-border/60 p-4 shadow-card transition-all hover:shadow-card-hover ${
                  !item.read ? "bg-accent/5 border-l-[3px] border-l-primary" : "bg-card"
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Icon */}
                  <div
                    className={`shrink-0 h-9 w-9 rounded-lg flex items-center justify-center ${notificationTypeStyles[item.type]}`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`shrink-0 h-2 w-2 rounded-full ${pStyle.dot}`} title={`${pStyle.label} priority`} />
                        <h4 className={`text-sm font-semibold truncate ${!item.read ? "text-foreground" : "text-muted-foreground"}`}>
                          {item.title}
                        </h4>
                      </div>
                      <span className="text-[0.7rem] text-muted-foreground shrink-0">{item.time}</span>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
                      {item.message}
                    </p>
                    <div className="flex items-center justify-between mt-2.5">
                      <div className="flex items-center gap-2">
                        {item.from && (
                          <span className="text-xs text-muted-foreground">
                            From: <strong className="text-foreground">{item.from}</strong>
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleRead(item.id)}
                          className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 opacity-0 group-hover:opacity-100"
                          title={item.read ? "Mark unread" : "Mark read"}
                        >
                          {item.read ? (
                            <Mail className="h-3.5 w-3.5" />
                          ) : (
                            <MailOpen className="h-3.5 w-3.5" />
                          )}
                          <span>{item.read ? "Unread" : "Read"}</span>
                        </button>
                        {item.actionLabel && (
                          <Button size="sm" variant="outline" className="h-7 text-xs px-3">
                            {item.actionLabel}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
