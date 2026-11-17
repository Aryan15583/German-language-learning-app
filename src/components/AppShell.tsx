import { BarChart3, Bell, BookOpen, Dumbbell, Gamepad2, Heart, Home, Map, Moon, Search, Settings, Sun, Trophy, User } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useMemo, useState, type ReactNode } from "react";
import { allTopics, levelOfTopic } from "../core/content/levels";
import { partnerName, useProgress } from "../web/progress";
import { useTheme } from "../web/theme";
import { BrandTitle, SecretHeart } from "./BrandTitle";
import { cx, HeartPlane } from "./ui";

const SIDEBAR = [
  { href: "/", label: "Dashboard", icon: Home },
  { href: "/learn", label: "Learn Together", icon: BookOpen },
  { href: "/journey", label: "Berlin Map", icon: Map },
  { href: "/train", label: "Practice", icon: Dumbbell },
  { href: "/quizzes", label: "Couple Quizzes", icon: Gamepad2 },
  { href: "/progress", label: "Progress", icon: BarChart3 },
  { href: "/achievements", label: "Achievements", icon: Trophy },
  { href: "/us", label: "Our Journey", icon: Heart },
  { href: "/profile", label: "Settings", icon: Settings },
];

const TABS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/learn", label: "Learn", icon: BookOpen },
  { href: "/us", label: "Couple", icon: Heart },
  { href: "/progress", label: "Progress", icon: BarChart3 },
  { href: "/profile", label: "Profile", icon: User },
];

const SEEN_KEY = "zh-seen-chat";

/** How many messages from my partner arrived since I last opened the couple page. */
export function useUnread() {
  const { state } = useProgress();
  let seen = 0;
  try {
    seen = Number(window.localStorage.getItem(SEEN_KEY) ?? 0);
  } catch {
    // storage blocked: count everything as unread
  }
  return state.chat.filter((m) => m.from === 1 && m.kind !== "system" && m.at > seen).length;
}

export function markChatSeen() {
  try {
    window.localStorage.setItem(SEEN_KEY, String(Date.now()));
  } catch {
    // storage blocked: the badge just stays
  }
}

const isActive = (path: string, href: string) => (href === "/" ? path === "/" : path === href || path.startsWith(href + "/"));

/**
 * The app frame. Phones: content + big bottom tabs. Computers: sidebar + top bar.
 * `focus` hides the phone tabs on screens where you should concentrate (lessons, quizzes).
 */
export function AppShell({ children, focus }: { children: ReactNode; focus?: boolean }) {
  const router = useRouter();
  const path = router.pathname;

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[260px_1fr]">
      {/* Desktop sidebar */}
      <aside className="glass sticky top-0 hidden h-dvh flex-col border-r border-line/60 px-5 py-6 lg:flex">
        <Link href="/" className="mb-8 block text-plum" aria-label="Zwei Herzen until Berlin — home">
          <HeartPlane className="mb-1 h-8 w-24" />
          <div className="font-script text-[34px] font-bold leading-[1.05]">
            Zwei Herzen <SecretHeart />
            <br />
            until Berlin
          </div>
        </Link>
        <nav className="flex flex-col gap-1.5" aria-label="Main">
          {SIDEBAR.map(({ href, label, icon: Icon }) => {
            const on = isActive(path, href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={on ? "page" : undefined}
                className={cx(
                  "flex items-center gap-3 rounded-2xl px-4 py-3 text-[15px] font-medium transition duration-200",
                  on ? "btn-primary text-white" : "text-ink/85 hover:translate-x-0.5 hover:bg-blush hover:text-ink",
                )}
              >
                <Icon size={21} strokeWidth={on ? 2.4 : 1.8} />
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto">
          {/* eslint-disable-next-line @next/next/no-img-element -- static export */}
          <img src="/art/skyline.jpg" alt="" className="w-full rounded-2xl opacity-90 mix-blend-multiply dark:opacity-70 dark:mix-blend-normal" />
        </div>
      </aside>

      <div className="min-w-0">
        <TopBar />
        <main className={cx("mx-auto w-full max-w-6xl px-4 pt-4 sm:px-6 lg:px-8 lg:pt-2", focus ? "pb-10" : "pb-28 lg:pb-12")}>{children}</main>
      </div>

      {/* Phone tabs */}
      {focus ? null : (
        <nav
          aria-label="Main"
          className="glass fixed inset-x-0 bottom-0 z-30 border-t border-line/60 pb-[env(safe-area-inset-bottom)] lg:hidden"
        >
          <div className="mx-auto grid max-w-lg grid-cols-5">
            {TABS.map(({ href, label, icon: Icon }) => {
              const on = isActive(path, href);
              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={on ? "page" : undefined}
                  className={cx("relative flex flex-col items-center gap-0.5 py-2.5 text-[12px] font-semibold transition", on ? "text-plum" : "text-muted")}
                >
                  {on ? <span aria-hidden className="absolute top-1 h-8 w-14 rounded-full bg-blush" /> : null}
                  <Icon size={on ? 25 : 23} strokeWidth={on ? 2.4 : 1.8} className="relative" />
                  <span className="relative">{label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
}

function TopBar() {
  const { state } = useProgress();
  const unread = useUnread();
  const me = partnerName(state, state.learner);
  return (
    <header className="glass sticky top-0 z-20 border-b border-line/50 lg:border-none lg:bg-transparent lg:backdrop-blur-none">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 sm:px-6 lg:px-8 lg:py-5">
        <div className="lg:hidden">
          <BrandTitle />
        </div>
        <div className="hidden flex-1 lg:block">
          <SearchBox />
        </div>
        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
          <Link href="/us" aria-label={unread ? `${unread} new messages` : "Messages"} className="card-premium relative grid h-11 w-11 place-items-center rounded-full text-plum hover:bg-blush">
            <Bell size={20} />
            {unread ? <span className="absolute right-1.5 top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-rose px-1 text-[10px] font-bold text-white">{unread}</span> : null}
          </Link>
          <Link href="/profile" aria-label="Profile" className="btn-primary grid h-11 w-11 place-items-center rounded-full text-base font-bold text-white ring-2 ring-gold/40 ring-offset-2 ring-offset-cream">
            {me.slice(0, 1).toUpperCase()}
          </Link>
        </div>
      </div>
      <div className="px-4 pb-3 sm:px-6 lg:hidden">
        <SearchBox />
      </div>
    </header>
  );
}

/** Search lessons and phrases. */
export function SearchBox() {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const results = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (t.length < 2) return [];
    const out: { id: string; title: string; sub: string }[] = [];
    for (const unit of allTopics()) {
      const level = levelOfTopic(unit.id)?.id ?? "";
      if (unit.title.toLowerCase().includes(t)) out.push({ id: unit.id, title: unit.title, sub: `${level} · lesson` });
      for (const w of unit.words) {
        if (w.de.toLowerCase().includes(t) || w.en.toLowerCase().includes(t)) out.push({ id: unit.id, title: w.de, sub: `${w.en} · ${unit.title}` });
      }
      if (out.length > 30) break;
    }
    return out.slice(0, 7);
  }, [q]);

  return (
    <div className="relative max-w-md">
      <label className="flex items-center gap-2 rounded-full border border-line bg-surface/85 px-4 py-2.5 shadow-card focus-within:border-rose">
        <Search size={18} className="text-muted" />
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder="Search lessons, phrases…"
          aria-label="Search lessons and phrases"
          className="w-full bg-transparent text-[15px] outline-none placeholder:text-muted/80"
        />
      </label>
      {open && results.length ? (
        <ul className="absolute inset-x-0 top-full z-40 mt-2 overflow-hidden rounded-2xl border border-line bg-surface shadow-soft" role="listbox">
          {results.map((r, k) => (
            <li key={r.id + r.title + k}>
              <Link href={`/unit?id=${r.id}`} className="block px-4 py-2.5 hover:bg-blush" onClick={() => setOpen(false)}>
                <div className="font-semibold text-ink">{r.title}</div>
                <div className="text-sm text-muted">{r.sub}</div>
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

/** Sun / moon: switch between light and dark (Profile has "follow my phone" too). */
export function ThemeToggle() {
  const { dark, toggle } = useTheme();
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      className="card-premium grid h-11 w-11 place-items-center rounded-full text-plum transition hover:rotate-12"
    >
      {dark ? <Sun size={20} /> : <Moon size={20} />}
    </button>
  );
}
