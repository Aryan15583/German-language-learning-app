import type { ReactNode } from "react";
import { Card, cx, Ring } from "./ui";

/** Score summary at the end of a quiz or test. */
export function Results({ passed, correct, total, title, message, children }: { passed: boolean; correct: number; total: number; title: string; message: ReactNode; children?: ReactNode }) {
  const pct = total ? correct / total : 0;
  return (
    <div className="mx-auto max-w-md text-center anim-fade-up">
      <p className="mt-4 text-6xl">{passed ? "🎉" : "💪"}</p>
      <h1 className="mt-2 font-script text-4xl font-bold text-plum">{title}</h1>
      <Card className="mt-5 flex flex-col items-center">
        <Ring value={pct} size={130} color={passed ? "#3f9b6e" : "#c84a5a"}>
          <span className={cx("text-3xl font-extrabold", passed ? "text-good" : "text-bad")}>{Math.round(pct * 100)}%</span>
        </Ring>
        <p className="mt-2 text-muted">
          {correct} of {total} correct
        </p>
      </Card>
      <p className="my-5 text-muted">{message}</p>
      <div className="flex flex-col gap-3">{children}</div>
    </div>
  );
}
