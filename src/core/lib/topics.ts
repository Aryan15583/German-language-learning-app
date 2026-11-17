import { findLevel, findTopic, levelOfTopic, levelWords, type Level, type Word } from "../content/levels";

export const REMOTE_QUESTIONS = 6;

/** "mix-B1" means every unit in B1; anything else is a unit id. */
export function resolveTopic(topic: string): { title: string; pool: Word[]; level: Level } | null {
  if (topic.startsWith("mix-")) {
    const level = findLevel(topic.slice(4));
    return level ? { title: `${level.id} mix`, pool: levelWords(level), level } : null;
  }
  const unit = findTopic(topic);
  const level = levelOfTopic(topic);
  return unit && level ? { title: `${level.id} · ${unit.title}`, pool: unit.words, level } : null;
}
