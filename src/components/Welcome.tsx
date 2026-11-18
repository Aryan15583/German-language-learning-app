import { ArrowRight } from "lucide-react";
import { useState } from "react";
import { Button, cx, HeartPlane, Mascot } from "./ui";

/** Screen 1 of the design: Berlin at dusk, "Get Started" and "Sign In". */
export function WelcomeSplash({ onStart, onSignIn }: { onStart: () => void; onSignIn?: () => void }) {
  return (
    <div className="relative grid min-h-dvh place-items-center overflow-hidden bg-plum-dark px-6 text-center">
      {/* eslint-disable-next-line @next/next/no-img-element -- static export */}
      <img src="/art/splash.jpg" alt="" className="absolute inset-0 h-full w-full object-cover object-bottom opacity-90" />
      <div className="absolute inset-0 bg-gradient-to-b from-[#f8cfdc]/95 via-[#f3c3d2]/40 to-plum-dark/80" />
      <div className="relative z-10 flex w-full max-w-sm flex-col items-center anim-fade-up">
        <HeartPlane className="mb-2 h-12 w-36 text-plum" />
        <h1 className="font-script text-6xl font-bold leading-[0.95] text-plum-dark">
          Zwei Herzen
          <br />
          until Berlin
        </h1>
        <p className="mt-4 font-script text-2xl text-plum">Learn German. Together. ♡</p>
        <div className="mt-[34vh] flex w-full flex-col items-center gap-3">
          <Button size="lg" full variant="soft" className="!bg-blush/95" onClick={onStart}>
            Get Started <ArrowRight size={20} />
          </Button>
          {onSignIn ? (
            <button type="button" onClick={onSignIn} className="py-2 font-semibold text-white drop-shadow">
              Sign In
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

const SLIDES = [
  {
    art: <CoupleArt />,
    title: "Learn German together!",
    text: "Step by step, hand in hand — from Mumbai through München, Köln and Dresden, all the way to Berlin. 🇩🇪",
  },
  {
    art: <PhotoArt src="/art/tower.jpg" />,
    title: "One big button",
    text: "Tap ▶ Start every day. We pick your next words, quiz or big test — five minutes is enough.",
  },
  {
    art: (
      <div className="grid h-full place-items-center">
        <Mascot size={180} className="anim-beat" />
      </div>
    ),
    title: "Grow closer",
    text: "Chat, play, react ❤️ and keep a memory book — end-to-end encrypted, just for you two.",
  },
];

function CoupleArt() {
  // eslint-disable-next-line @next/next/no-img-element -- static export
  return <img src="/art/couple.jpg" alt="A couple looking at Berlin together" className="h-full w-full object-cover" />;
}
function PhotoArt({ src }: { src: string }) {
  // eslint-disable-next-line @next/next/no-img-element -- static export
  return <img src={src} alt="" className="h-full w-full object-cover" />;
}

/** Screen 2 of the design: three short intro slides with Next / Skip. */
export function Onboarding({ onDone }: { onDone: () => void }) {
  const [i, setI] = useState(0);
  const s = SLIDES[i];
  const last = i === SLIDES.length - 1;
  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col items-center px-6 pb-8 pt-10 text-center">
      <HeartPlane className="h-10 w-28 text-rose" />
      <h1 key={s.title} className="mt-4 font-script text-5xl font-bold leading-tight text-plum anim-fade-up">
        {s.title}
      </h1>
      <p className="mt-3 text-lg text-muted">{s.text}</p>
      <div className="my-8 aspect-square w-full max-w-xs overflow-hidden rounded-[40%_40%_24px_24px] bg-blush shadow-soft">{s.art}</div>
      <div className="mb-6 flex gap-2" aria-label={`Slide ${i + 1} of ${SLIDES.length}`}>
        {SLIDES.map((_, k) => (
          <span key={k} className={cx("h-2 rounded-full transition-all", k === i ? "w-6 bg-plum" : "w-2 bg-rose-soft")} />
        ))}
      </div>
      <Button size="lg" full onClick={() => (last ? onDone() : setI(i + 1))}>
        {last ? "Let’s begin" : "Next"} <ArrowRight size={20} />
      </Button>
      {last ? null : (
        <button type="button" onClick={onDone} className="mt-4 font-semibold text-plum underline underline-offset-4">
          Skip
        </button>
      )}
    </div>
  );
}
