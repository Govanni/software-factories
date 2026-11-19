// PROTOTYPE (throwaway, branch prototype/inbox-ui): sample Notifications for the Inbox UI variants.
// In-memory only. Copy is placeholder; the real copy is decided in
// "Write the copy and deep link for each v1 Notification".

export type FakeTrigger =
  | "question-replied"
  | "question-asked"
  | "student-enrolled"
  | "course-rated";

export interface FakeNotification {
  id: string;
  trigger: FakeTrigger;
  actorName: string;
  body: string;
  url: string;
  createdAt: Date;
  read: boolean;
}

const minutesAgo = (m: number) => new Date(Date.now() - m * 60_000);

export function makeFakeNotifications(): FakeNotification[] {
  return [
    {
      id: "n1",
      trigger: "question-replied",
      actorName: "Sarah Chen",
      body: "Sarah Chen replied to your question “Why does useEffect run twice in dev?”",
      url: "/courses",
      createdAt: minutesAgo(4),
      read: false,
    },
    {
      id: "n2",
      trigger: "question-asked",
      actorName: "Marcus Webb",
      body: "Marcus Webb asked a question on “Hooks in depth” in React Fundamentals",
      url: "/instructor/questions",
      createdAt: minutesAgo(38),
      read: false,
    },
    {
      id: "n3",
      trigger: "student-enrolled",
      actorName: "Priya Patel",
      body: "Priya Patel enrolled in React Fundamentals",
      url: "/instructor",
      createdAt: minutesAgo(60 * 3),
      read: false,
    },
    {
      id: "n4",
      trigger: "course-rated",
      actorName: "Tom Okafor",
      body: "Tom Okafor rated React Fundamentals ★★★★☆",
      url: "/instructor/analytics",
      createdAt: minutesAgo(60 * 26),
      read: true,
    },
    {
      id: "n5",
      trigger: "student-enrolled",
      actorName: "Lena Fischer",
      body: "Lena Fischer enrolled in React Fundamentals (coupon)",
      url: "/instructor",
      createdAt: minutesAgo(60 * 50),
      read: true,
    },
  ];
}

export function timeAgo(d: Date): string {
  const m = Math.round((Date.now() - d.getTime()) / 60_000);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
}
