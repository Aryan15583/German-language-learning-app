import { stopOfTopic, stopTopic } from "../core/content/berlin";
import { findLevel, findTopic, levelOfTopic, LEVELS, type Level, type Topic } from "../core/content/levels";

/** A course unit or a Berlin journey stop, with the level its quiz draws extra options from. */
export function lessonById(id: string): { topic: Topic; level: Level; berlin: boolean } | null {
  const stop = stopOfTopic(id);
  if (stop) return { topic: stopTopic(stop), level: findLevel(stop.level) ?? LEVELS[0], berlin: true };
  const topic = findTopic(id);
  const level = levelOfTopic(id);
  return topic && level ? { topic, level, berlin: false } : null;
}
