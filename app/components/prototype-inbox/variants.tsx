// PROTOTYPE (throwaway, branch prototype/inbox-ui).
// Question: how should the Inbox look and behave in Cadence, and where does the bell live?
// Three variants of the app layout, switchable via ?variant=A|B|C:
//   A: Novu's prebuilt <Inbox/>, themed, bell in the sidebar header (keyless demo mode, real Novu)
//   B: Custom popover on (fake) headless data, bell in the sidebar header
//   C: "Inbox" sidebar nav item + full-height right drawer, grouped by day, filter by type
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { Inbox as NovuInbox } from "@novu/react";
import { Bell, Check, CheckCheck, X, Inbox as InboxIcon } from "lucide-react";
import { cn } from "~/lib/utils";
import {
  makeFakeNotifications,
  timeAgo,
  type FakeNotification,
  type FakeTrigger,
} from "./fake-notifications";

export const INBOX_VARIANTS = [
  { key: "A", name: "Novu prebuilt, sidebar bell" },
  { key: "B", name: "Custom popover, sidebar bell" },
  { key: "C", name: "Nav item + right drawer" },
];

// Shared in-memory state for B and C. Read state is the thing on screen, so keep it live.
function useFakeInbox() {
  const [items, setItems] = useState<FakeNotification[]>(makeFakeNotifications);
  const unread = items.filter((n) => !n.read).length;
  return {
    items,
    unread,
    markRead: (id: string, read = true) =>
      setItems((xs) => xs.map((n) => (n.id === id ? { ...n, read } : n))),
    markAllRead: () => setItems((xs) => xs.map((n) => ({ ...n, read: true }))),
  };
}

function Initials({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2);
  return (
    <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
      {initials}
    </div>
  );
}

function UnreadBadge({ count, className }: { count: number; className?: string }) {
  if (count === 0) return null;
  return (
    <span
      className={cn(
        "flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold leading-none text-white",
        className
      )}
    >
      {count > 9 ? "9+" : count}
    </span>
  );
}

// ---------------------------------------------------------------- Variant A
export function VariantAHeaderBell() {
  const navigate = useNavigate();
  // No applicationIdentifier/subscriberId: Novu "keyless" demo mode, so this renders the
  // real component without keys. Production passes the loader's
  // { applicationIdentifier, subscriberId, subscriberHash } plus the EU backendUrl/socketUrl.
  return (
    <NovuInbox
      routerPush={(path: string) => navigate(path)}
      appearance={{
        variables: {
          colorPrimary: "#171717",
          colorPrimaryForeground: "#fafafa",
          colorBackground: "#ffffff",
          colorForeground: "#0a0a0a",
          colorNeutral: "#e5e5e5",
          colorCounter: "#dc2626",
          colorCounterForeground: "#ffffff",
          borderRadius: "0.625rem",
          fontSize: "14px",
        },
      }}
    />
  );
}

// ---------------------------------------------------------------- Variant B
export function VariantBHeaderBell() {
  const inbox = useFakeInbox();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"all" | "unread">("all");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const shown = tab === "all" ? inbox.items : inbox.items.filter((n) => !n.read);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative rounded-md p-1.5 text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        aria-label={`Notifications, ${inbox.unread} unread`}
      >
        <Bell className="size-4" />
        <UnreadBadge count={inbox.unread} className="absolute -right-1 -top-1" />
      </button>

      {open && (
        <div className="absolute left-full top-0 z-50 ml-3 w-96 overflow-hidden rounded-lg border bg-popover text-popover-foreground shadow-xl">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <div className="font-semibold">Notifications</div>
            <button
              onClick={inbox.markAllRead}
              disabled={inbox.unread === 0}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground disabled:opacity-40"
            >
              <CheckCheck className="size-3.5" /> Mark all read
            </button>
          </div>
          <div className="flex gap-1 border-b px-3 py-2 text-sm">
            {(["all", "unread"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={cn(
                  "rounded-md px-2.5 py-1 capitalize",
                  tab === t ? "bg-muted font-medium" : "text-muted-foreground hover:bg-muted/60"
                )}
              >
                {t}
                {t === "unread" && inbox.unread > 0 && ` (${inbox.unread})`}
              </button>
            ))}
          </div>
          <ul className="max-h-[28rem] divide-y overflow-y-auto">
            {shown.length === 0 && (
              <li className="px-4 py-10 text-center text-sm text-muted-foreground">
                You're all caught up.
              </li>
            )}
            {shown.map((n) => (
              <li key={n.id}>
                <button
                  onClick={() => {
                    inbox.markRead(n.id);
                    setOpen(false);
                    navigate(n.url);
                  }}
                  className={cn(
                    "flex w-full gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/60",
                    !n.read && "bg-primary/[0.03]"
                  )}
                >
                  <Initials name={n.actorName} />
                  <div className="min-w-0 flex-1">
                    <div className={cn("text-sm", !n.read && "font-medium")}>{n.body}</div>
                    <div className="mt-0.5 text-xs text-muted-foreground">{timeAgo(n.createdAt)}</div>
                  </div>
                  {!n.read && <span className="mt-1.5 size-2 shrink-0 rounded-full bg-blue-600" />}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------- Variant C
const TRIGGER_LABEL: Record<FakeTrigger, string> = {
  "question-replied": "Replies",
  "question-asked": "Questions",
  "student-enrolled": "Enrollments",
  "course-rated": "Ratings",
};

export function VariantCNavItemAndDrawer() {
  const inbox = useFakeInbox();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<FakeTrigger | "all">("all");

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const filtered = inbox.items.filter((n) => filter === "all" || n.trigger === filter);
  const dayMs = 24 * 60 * 60_000;
  const groups = [
    { label: "Today", items: filtered.filter((n) => Date.now() - n.createdAt.getTime() < dayMs) },
    { label: "Earlier", items: filtered.filter((n) => Date.now() - n.createdAt.getTime() >= dayMs) },
  ].filter((g) => g.items.length > 0);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={cn(
          "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
          open
            ? "bg-sidebar-accent text-sidebar-accent-foreground"
            : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        )}
      >
        <InboxIcon className="size-4" />
        Inbox
        <UnreadBadge count={inbox.unread} className="ml-auto" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/20" onClick={() => setOpen(false)} />
          <aside className="relative flex h-full w-[26rem] flex-col border-l bg-background shadow-2xl">
            <div className="flex h-14 items-center justify-between border-b px-5">
              <div className="text-base font-semibold">Inbox</div>
              <div className="flex items-center gap-3">
                <button
                  onClick={inbox.markAllRead}
                  disabled={inbox.unread === 0}
                  className="text-xs text-muted-foreground hover:text-foreground disabled:opacity-40"
                >
                  Mark all read
                </button>
                <button onClick={() => setOpen(false)} className="rounded-md p-1 hover:bg-muted" aria-label="Close">
                  <X className="size-4" />
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5 border-b px-5 py-3">
              {(["all", ...Object.keys(TRIGGER_LABEL)] as (FakeTrigger | "all")[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={cn(
                    "rounded-full border px-2.5 py-0.5 text-xs",
                    filter === f ? "border-foreground bg-foreground text-background" : "text-muted-foreground hover:border-foreground/40"
                  )}
                >
                  {f === "all" ? "All" : TRIGGER_LABEL[f]}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto">
              {groups.length === 0 && (
                <div className="px-5 py-16 text-center text-sm text-muted-foreground">Nothing here yet.</div>
              )}
              {groups.map((g) => (
                <section key={g.label}>
                  <div className="sticky top-0 bg-background/95 px-5 pb-1 pt-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {g.label}
                  </div>
                  {g.items.map((n) => (
                    <div
                      key={n.id}
                      className="group flex items-start gap-3 border-l-2 px-5 py-3 transition-colors hover:bg-muted/50"
                      style={{ borderLeftColor: n.read ? "transparent" : "rgb(37 99 235)" }}
                    >
                      <button
                        className="flex min-w-0 flex-1 gap-3 text-left"
                        onClick={() => {
                          inbox.markRead(n.id);
                          setOpen(false);
                          navigate(n.url);
                        }}
                      >
                        <Initials name={n.actorName} />
                        <div className="min-w-0">
                          <div className={cn("text-sm", n.read ? "text-muted-foreground" : "font-medium")}>{n.body}</div>
                          <div className="mt-0.5 text-xs text-muted-foreground">
                            {TRIGGER_LABEL[n.trigger]} · {timeAgo(n.createdAt)}
                          </div>
                        </div>
                      </button>
                      <button
                        onClick={() => inbox.markRead(n.id, !n.read)}
                        title={n.read ? "Mark unread" : "Mark read"}
                        className="rounded-md p-1 text-muted-foreground opacity-0 transition-opacity hover:bg-muted group-hover:opacity-100"
                      >
                        <Check className="size-4" />
                      </button>
                    </div>
                  ))}
                </section>
              ))}
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
