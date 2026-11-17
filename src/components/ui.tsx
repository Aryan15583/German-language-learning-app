import { ChevronLeft, Volume2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/router";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { meaning, otherMeaning, type Lang } from "../core/content/levels";
import { speakGerman } from "../web/speech";

export const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cx("card-premium rounded-[26px] p-5", className)}>{children}</div>;
}

type Variant = "primary" | "soft" | "ghost" | "good" | "partner";
const variants: Record<Variant, string> = {
  primary: "btn-primary text-white hover:brightness-110",
  soft: "bg-blush text-plum ring-1 ring-inset ring-rose-soft/60 hover:bg-rose-soft/70",
  ghost: "bg-transparent text-plum hover:bg-blush",
  good: "btn-good text-white hover:brightness-105",
  partner: "bg-partner text-white hover:brightness-105 shadow-soft",
};

export function Button({
  variant = "primary",
  size = "md",
  full,
  href,
  className,
  children,
  ...rest
}: { variant?: Variant; size?: "sm" | "md" | "lg"; full?: boolean; href?: string } & ButtonHTMLAttributes<HTMLButtonElement>) {
  const cls = cx(
    "inline-flex items-center justify-center gap-2 rounded-full font-semibold tracking-[-0.005em] transition duration-200 active:scale-[0.98] disabled:opacity-45 disabled:pointer-events-none",
    size === "sm" && "px-4 py-2 text-sm",
    size === "md" && "px-6 py-3 text-[15px]",
    size === "lg" && "px-7 py-4 text-lg",
    full && "w-full",
    variants[variant],
    className,
  );
  if (href) {
    return (
      <Link href={href} className={cls}>
        {children}
      </Link>
    );
  }
  return (
    <button type="button" className={cls} {...rest}>
      {children}
    </button>
  );
}

/** The handwritten titles from the design. */
export function Script({ className, children, as: Tag = "h1" }: { className?: string; children: ReactNode; as?: "h1" | "h2" | "h3" | "p" | "span" }) {
  return <Tag className={cx("font-script font-bold text-plum", className)}>{children}</Tag>;
}

export function ProgressBar({ value, className, color = "bg-plum" }: { value: number; className?: string; color?: string }) {
  const pct = Math.max(0, Math.min(100, value * 100));
  return (
    <div className={cx("h-2.5 w-full overflow-hidden rounded-full bg-rose-soft/60", className)} role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}>
      <div className={cx("h-full rounded-full transition-all duration-700", color === "bg-plum" ? "bg-gradient-to-r from-rose to-plum" : color)} style={{ width: `${pct}%` }} />
    </div>
  );
}

/** Circular progress, like the 68% / 72% rings in the design. */
export function Ring({ value, size = 104, stroke = 10, color = "var(--color-plum)", children }: { value: number; size?: number; stroke?: number; color?: string; children?: ReactNode }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(1, value));
  return (
    <div className="relative inline-grid place-items-center" style={{ width: size, height: size }} role="img" aria-label={`${Math.round(pct * 100)} percent`}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="var(--color-rose-soft)" strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
          style={{ transition: "stroke-dashoffset 0.8s ease" }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">{children}</div>
    </div>
  );
}

export function Chip({ selected, onClick, children, className }: { selected?: boolean; onClick?: () => void; children: ReactNode; className?: string }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={cx(
        "rounded-full border px-3.5 py-1.5 text-sm transition",
        selected ? "border-transparent btn-primary text-white" : "border-line bg-surface/70 text-ink hover:border-rose",
        className,
      )}
    >
      {children}
    </button>
  );
}

export const fieldClass =
  "w-full rounded-2xl border border-line bg-surface/90 px-4 py-3 text-base text-ink shadow-[inset_0_1px_2px_rgb(var(--shadow-rgb)/0.06)] placeholder:text-muted/70 outline-none transition focus:border-rose focus:ring-4 focus:ring-rose-soft/50";

/** Round plum play button that reads German aloud. */
export function Speak({ text, className, big }: { text: string; className?: string; big?: boolean }) {
  return (
    <button
      type="button"
      aria-label={`Listen: ${text}`}
      onClick={(e) => {
        e.stopPropagation();
        speakGerman(text);
      }}
      className={cx(
        "btn-primary inline-grid shrink-0 place-items-center rounded-full text-white transition hover:brightness-110 active:scale-95",
        big ? "h-14 w-14" : "h-9 w-9",
        className,
      )}
    >
      <Volume2 size={big ? 26 : 17} />
    </button>
  );
}

/** A word's meaning in the learner's language, with the other language underneath. */
export function Meaning({ w, lang, className }: { w: { en: string; mr: string }; lang: Lang; className?: string }) {
  const other = otherMeaning(w, lang);
  return (
    <div className={className}>
      <div className="text-ink">{meaning(w, lang)}</div>
      {other ? <div className="text-sm text-muted">{other}</div> : null}
    </div>
  );
}

/** Mobile screen header: back arrow, centred title, optional right action. */
export function PageHeader({ title, back = true, right, script }: { title: ReactNode; back?: boolean | string; right?: ReactNode; script?: boolean }) {
  const router = useRouter();
  return (
    <div className="mb-4 flex items-center gap-2">
      {back ? (
        <button
          type="button"
          aria-label="Back"
          onClick={() => (typeof back === "string" ? router.push(back) : window.history.length > 1 ? router.back() : router.push("/"))}
          className="grid h-10 w-10 place-items-center rounded-full text-plum hover:bg-blush"
        >
          <ChevronLeft size={26} />
        </button>
      ) : null}
      <div className={cx("flex-1 text-center", script ? "font-script text-3xl font-bold text-plum" : "text-lg font-bold text-ink", back ? "pr-10" : "")}>{title}</div>
      {right}
    </div>
  );
}

export function Spinner({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="grid place-items-center py-16" role="status" aria-live="polite">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-rose-soft border-t-plum" />
      <span className="sr-only">{label}</span>
    </div>
  );
}

/** The friendly heart mascot from the design. */
export function Mascot({ size = 88, className }: { size?: number; className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- static export, tiny local image
    <img src="/art/heart.jpg" alt="" width={size} height={size} className={cx("rounded-3xl mix-blend-multiply dark:mix-blend-normal", className)} />
  );
}

/** Heart-and-plane doodle used next to titles. */
export function HeartPlane({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 50" className={className} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden>
      <path d="M22 40C8 30 4 20 10 13c5-6 12-2 12 3 0-5 7-9 12-3 6 7 2 17-12 27z" />
      <path d="M38 33c14-6 26-10 40-12" strokeDasharray="4 5" />
      <path d="M86 15l22-7-6 6 6 6-22-5z" fill="currentColor" stroke="none" />
    </svg>
  );
}
