import type { LearnerJourney, JourneyChapter, JourneyModule, JourneyTrack } from "@/hooks/useLearnerJourney";

export interface CohortChapterLocation {
  track: JourneyTrack;
  module: JourneyModule;
  chapter: JourneyChapter;
}

export interface NextCohortChapter {
  chapterCode: string;
  chapterTitle: string;
  moduleCode: string;
  moduleTitle: string;
}

const isAdvanceable = (c: JourneyChapter) => c.status !== "locked";

/** Build a flat ordered list of (track, module, chapter) honoring displayOrder. */
function flattenJourney(journey: LearnerJourney): CohortChapterLocation[] {
  const out: CohortChapterLocation[] = [];
  const tracks = [...journey.tracks].sort((a, b) => a.displayOrder - b.displayOrder);
  for (const track of tracks) {
    const modules = [...track.modules].sort((a, b) => a.displayOrder - b.displayOrder);
    for (const module of modules) {
      const chapters = [...module.chapters].sort((a, b) => a.displayOrder - b.displayOrder);
      for (const chapter of chapters) {
        out.push({ track, module, chapter });
      }
    }
  }
  return out;
}

export function findCohortChapterLocation(
  journey: LearnerJourney | null | undefined,
  chapterCode: string | null | undefined,
): CohortChapterLocation | null {
  if (!journey || !chapterCode) return null;
  const flat = flattenJourney(journey);
  return flat.find((l) => l.chapter.code === chapterCode) ?? null;
}

/**
 * Find the next chapter to advance to after completing `chapterCode`.
 * Walks: same module → next module in track → next track. Skips locked chapters.
 * Returns null only when the learner is on the very last unlocked chapter.
 */
export function findNextCohortChapter(
  journey: LearnerJourney | null | undefined,
  chapterCode: string | null | undefined,
): NextCohortChapter | null {
  if (!journey || !chapterCode) return null;
  const flat = flattenJourney(journey);
  const idx = flat.findIndex((l) => l.chapter.code === chapterCode);
  if (idx === -1) return null;
  for (let i = idx + 1; i < flat.length; i++) {
    const loc = flat[i];
    if (!isAdvanceable(loc.chapter)) continue;
    return {
      chapterCode: loc.chapter.code,
      chapterTitle: loc.chapter.title,
      moduleCode: loc.module.code,
      moduleTitle: loc.module.title,
    };
  }
  return null;
}

/** How many consecutive completed chapters end at (and include) `chapterCode`, scanning backwards across the journey. */
export function computeJourneyStreak(
  journey: LearnerJourney | null | undefined,
  chapterCode: string | null | undefined,
  treatCurrentAsCompleted = true,
): number {
  if (!journey || !chapterCode) return 0;
  const flat = flattenJourney(journey);
  const idx = flat.findIndex((l) => l.chapter.code === chapterCode);
  if (idx === -1) return 0;
  let streak = 0;
  for (let i = idx; i >= 0; i--) {
    const status = flat[i].chapter.status;
    const isCompleted = i === idx ? (treatCurrentAsCompleted || status === "completed") : status === "completed";
    if (isCompleted) streak++;
    else break;
  }
  return streak;
}
