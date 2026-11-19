// PROTOTYPE (throwaway, branch prototype/inbox-ui): floating ?variant= switcher.
import { useEffect } from "react";
import { useSearchParams } from "react-router";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function PrototypeSwitcher({
  variants,
}: {
  variants: { key: string; name: string }[];
}) {
  const [params, setParams] = useSearchParams();
  const current = params.get("variant") ?? variants[0].key;
  const index = Math.max(
    0,
    variants.findIndex((v) => v.key === current)
  );

  function go(delta: number) {
    const next = variants[(index + delta + variants.length) % variants.length];
    const p = new URLSearchParams(params);
    p.set("variant", next.key);
    setParams(p, { replace: true, preventScrollReset: true });
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const t = e.target as HTMLElement | null;
      if (
        t &&
        (t.tagName === "INPUT" ||
          t.tagName === "TEXTAREA" ||
          t.isContentEditable)
      )
        return;
      if (e.key === "ArrowLeft") go(-1);
      if (e.key === "ArrowRight") go(1);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  if (import.meta.env.PROD) return null;

  const v = variants[index];
  return (
    <div className="fixed bottom-4 left-1/2 z-[100] flex -translate-x-1/2 items-center gap-2 rounded-full bg-fuchsia-600 px-2 py-1.5 text-sm font-medium text-white shadow-lg ring-2 ring-white">
      <button onClick={() => go(-1)} className="rounded-full p-1 hover:bg-white/20" aria-label="Previous variant">
        <ChevronLeft className="size-4" />
      </button>
      <span className="min-w-48 text-center">
        Inbox prototype · {v.key} ({v.name})
      </span>
      <button onClick={() => go(1)} className="rounded-full p-1 hover:bg-white/20" aria-label="Next variant">
        <ChevronRight className="size-4" />
      </button>
    </div>
  );
}
