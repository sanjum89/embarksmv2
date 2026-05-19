import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  AlertTriangle, Inbox, Mail, MailOpen, CheckCheck, ArrowRight, Sparkles,
} from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import PageBody from "@/components/layout/PageBody";
import {
  inboxNotifications as initialNotifications,
  notificationTypeStyles,
  notificationTypeLabels,
  type InboxNotification,
  type NotificationType,
  type Priority,
} from "@/data/inboxNotifications";

const severityRank: Record<Priority, number> = { high: 0, medium: 1, low: 2 };

const sevCard = (s: Priority) =>
  s === "high" ? "border-l-rose-500" : s === "medium" ? "border-l-amber-500" : "border-l-muted";

const sevBadge = (s: Priority) =>
  s === "high"
    ? "bg-rose-500/10 text-rose-700 border-rose-500/30"
    : s === "medium"
    ? "bg-amber-500/10 text-amber-700 border-amber-500/30"
    : "bg-muted text-muted-foreground";

type FilterKey = "all" | "high" | "unread";

export default function MyInbox() {
  const [notifications, setNotifications] = useState<InboxNotification[]>(initialNotifications);
  const [filter, setFilter] = useState<FilterKey>("all");

  const toggleRead = (id: string) =>
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: !n.read } : n)));
  const markAllRead = () =>
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));

  const unreadCount = notifications.filter((n) => !n.read).length;
  const kpiHigh = notifications.filter((n) => !n.read && n.priority === "high").length;
  const kpiActions = notifications.filter((n) => !n.read && n.actionLabel).length;

  const visible = useMemo(() => {
    let list = [...notifications];
    if (filter === "high") list = list.filter((n) => n.priority === "high");
    if (filter === "unread") list = list.filter((n) => !n.read);
    return list.sort((a, b) => {
      if (a.read !== b.read) return a.read ? 1 : -1;
      const r = severityRank[a.priority] - severityRank[b.priority];
      if (r !== 0) return r;
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });
  }, [notifications, filter]);

  const pressing = visible.filter((n) => !n.read && n.priority === "high").slice(0, 2);
  const pressingIds = new Set(pressing.map((p) => p.id));
  const remaining = visible.filter((n) => !pressingIds.has(n.id));

  const grouped = useMemo(() => {
    const m = new Map<NotificationType, InboxNotification[]>();
    for (const n of remaining) {
      if (!m.has(n.type)) m.set(n.type, []);
      m.get(n.type)!.push(n);
    }
    return Array.from(m.entries());
  }, [remaining]);

  return (
    <div className="flex-1 overflow-y-auto">
      <PageHeader
        title="Action Centre"
        subtitle="Your notifications, tasks and messages — sorted by urgency."
      />
      <PageBody>
        {/* KPI strip */}
        <div className="mb-6 grid gap-3 grid-cols-2 md:grid-cols-4">
          <KpiTile
            label="Pressing now"
            value={kpiHigh}
            icon={AlertTriangle}
            hero
            hint={kpiHigh === 0 ? "All clear" : "High priority, unread"}
          />
          <KpiTile label="Unread" value={unreadCount} icon={Mail} hint="In your inbox" />
          <KpiTile label="Action required" value={kpiActions} icon={Sparkles} hint="Tasks awaiting you" />
          <KpiTile label="Total" value={notifications.length} icon={Inbox} hint="All notifications" />
        </div>

        <Tabs defaultValue="inbox" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="inbox" className="gap-2">
              <Inbox className="h-3.5 w-3.5" /> Inbox
            </TabsTrigger>
          </TabsList>

          <TabsContent value="inbox" className="space-y-6">
            {/* Filter pills */}
            <div className="flex flex-wrap items-center gap-2">
              {(["all", "high", "unread"] as FilterKey[]).map((k) => (
                <button
                  key={k}
                  onClick={() => setFilter(k)}
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                    filter === k
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background text-muted-foreground border-border hover:text-foreground"
                  }`}
                >
                  {k === "all" ? "All" : k === "high" ? "High priority" : "Unread"}
                </button>
              ))}
              <span className="ml-auto text-xs text-muted-foreground">
                {visible.length} item{visible.length === 1 ? "" : "s"} · sorted by urgency
              </span>
            </div>

            {/* Most pressing */}
            {pressing.length > 0 && (
              <section>
                <div className="mb-2 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-rose-600" />
                  <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground">Most pressing</h2>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  {pressing.map((n) => {
                    const Icon = n.icon;
                    return (
                      <Card
                        key={n.id}
                        className="relative overflow-hidden border-l-4 border-l-rose-500 p-4 shadow-md hover:shadow-lg transition-shadow"
                      >
                        <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-rose-500/5 blur-2xl" />
                        <div className="relative">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="outline" className={`text-[10px] ${sevBadge(n.priority)}`}>HIGH</Badge>
                            <Badge variant="outline" className="text-[10px]">{notificationTypeLabels[n.type]}</Badge>
                            <span className="ml-auto text-xs text-muted-foreground">{n.time}</span>
                          </div>
                          <div className="mt-2 flex items-start gap-3">
                            <div className={`shrink-0 h-9 w-9 rounded-lg flex items-center justify-center ${notificationTypeStyles[n.type]}`}>
                              <Icon className="h-4 w-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-base font-semibold text-foreground">{n.title}</p>
                              {n.from && (
                                <p className="text-xs text-muted-foreground">From: <strong className="text-foreground">{n.from}</strong></p>
                              )}
                              <p className="mt-1 text-sm text-muted-foreground">{n.message}</p>
                            </div>
                          </div>
                          <div className="mt-3 flex flex-wrap items-center gap-2">
                            {n.actionLabel && (
                              <Button size="sm">
                                {n.actionLabel} <ArrowRight className="ml-1 h-3.5 w-3.5" />
                              </Button>
                            )}
                            <Button size="sm" variant="ghost" onClick={() => toggleRead(n.id)}>
                              {n.read ? <Mail className="mr-1 h-3.5 w-3.5" /> : <MailOpen className="mr-1 h-3.5 w-3.5" />}
                              Mark {n.read ? "unread" : "read"}
                            </Button>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Grouped sections */}
            {grouped.map(([type, items]) => (
              <section key={type}>
                <div className="mb-2 flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-foreground">{notificationTypeLabels[type]}</h3>
                  <Badge variant="secondary" className="text-[10px]">{items.length}</Badge>
                </div>
                <div className="space-y-2">
                  {items.map((n) => {
                    const Icon = n.icon;
                    return (
                      <Card
                        key={n.id}
                        className={`border-l-4 ${sevCard(n.priority)} p-3 hover:shadow-sm transition-shadow ${
                          !n.read ? "bg-accent/5" : ""
                        }`}
                      >
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div className="flex min-w-0 flex-1 items-start gap-3">
                            <div className={`shrink-0 h-9 w-9 rounded-lg flex items-center justify-center ${notificationTypeStyles[n.type]}`}>
                              <Icon className="h-4 w-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <Badge variant="outline" className={`text-[10px] uppercase ${sevBadge(n.priority)}`}>
                                  {n.priority}
                                </Badge>
                                <p className={`text-sm font-semibold ${!n.read ? "text-foreground" : "text-muted-foreground"}`}>
                                  {n.title}
                                </p>
                                <span className="text-xs text-muted-foreground">· {n.time}</span>
                              </div>
                              <p className="mt-1 text-xs text-muted-foreground">{n.message}</p>
                              {n.from && (
                                <p className="mt-1 text-[11px] text-muted-foreground">
                                  From: <strong className="text-foreground">{n.from}</strong>
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex shrink-0 items-center gap-1">
                            {n.actionLabel && (
                              <Button size="sm" variant="outline" className="h-7 px-2 text-xs">
                                {n.actionLabel}
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 px-2 text-xs"
                              onClick={() => toggleRead(n.id)}
                            >
                              {n.read ? <Mail className="mr-1 h-3 w-3" /> : <MailOpen className="mr-1 h-3 w-3" />}
                              {n.read ? "Unread" : "Read"}
                            </Button>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </section>
            ))}

            {visible.length === 0 && (
              <Card className="p-12 text-center">
                <Inbox className="mx-auto h-10 w-10 text-muted-foreground/50" />
                <p className="mt-3 text-sm font-medium text-foreground">Inbox zero</p>
                <p className="text-xs text-muted-foreground">Nothing needs your attention right now. ✨</p>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </PageBody>
    </div>
  );
}

function KpiTile({
  label, value, icon: Icon, hint, hero,
}: { label: string; value: number; icon: React.ElementType; hint?: string; hero?: boolean }) {
  if (hero) {
    return (
      <Card className="relative overflow-hidden bg-primary text-primary-foreground p-4 shadow-lg">
        <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-accent/30 blur-2xl" />
        <div className="relative flex items-start justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-wider text-primary-foreground/70">{label}</p>
            <p className="mt-1 text-3xl font-bold">{value}</p>
            {hint && <p className="mt-1 text-[11px] text-primary-foreground/70">{hint}</p>}
          </div>
          <div className="rounded-lg bg-accent/20 p-2">
            <Icon className="h-4 w-4 text-accent-foreground" />
          </div>
        </div>
      </Card>
    );
  }
  return (
    <Card className="p-4 border-l-4 border-l-accent/60 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</p>
          <p className="mt-1 text-3xl font-bold text-foreground">{value}</p>
          {hint && <p className="mt-1 text-[11px] text-muted-foreground">{hint}</p>}
        </div>
        <div className="rounded-lg bg-muted p-2">
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>
    </Card>
  );
}
