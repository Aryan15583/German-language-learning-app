import { ChevronRight } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

/** A tappable row: icon, title, one line, arrow. */
export function Activity({ href, icon, title, sub, badge }: { href: string; icon: ReactNode; title: string; sub: string; badge?: string }) {
  return (
    <Link href={href} className="card-premium group flex items-center gap-3 overflow-hidden rounded-3xl p-4 transition hover:border-rose active:scale-[0.99]">
      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-blush text-2xl text-plum">{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2 font-bold text-ink">
          {title}
          {badge ? <span className="rounded-full bg-rose px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">{badge}</span> : null}
        </span>
        <span className="block text-sm text-muted">{sub}</span>
      </span>
      <ChevronRight className="shrink-0 text-muted transition group-hover:translate-x-0.5" size={20} />
    </Link>
  );
}
