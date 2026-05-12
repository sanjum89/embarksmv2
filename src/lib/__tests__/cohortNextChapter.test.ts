import { describe, it, expect } from "vitest";
import { findNextCohortChapter } from "@/lib/cohortNextChapter";
import type { LearnerJourney, JourneyChapter, JourneyModule } from "@/hooks/useLearnerJourney";

const ch = (over: Partial<JourneyChapter> & { code: string; title: string; displayOrder: number }): JourneyChapter => ({
  contentType: "reading",
  minutes: 25,
  status: "not_started",
  ...over,
});

const mod = (
  code: string,
  title: string,
  displayOrder: number,
  chapters: JourneyChapter[],
): JourneyModule => ({
  code,
  title,
  trackCode: "trk",
  isCoreRequired: true,
  isStretch: false,
  prerequisiteCodes: [],
  chapters,
  completedChapters: chapters.filter((c) => c.status === "completed").length,
  totalChapters: chapters.length,
  pct: 0,
  status: "in_progress",
  displayOrder,
});

const buildJourney = (modules: JourneyModule[]): LearnerJourney => ({
  cohort: {
    id: "c1",
    code: "c1",
    title: "Cohort",
    roleCohortCode: "rc1",
    completedModules: 0,
    totalModules: modules.length,
    completedChapters: 0,
    totalChapters: modules.reduce((n, m) => n + m.chapters.length, 0),
    overallPct: 0,
  },
  tracks: [
    {
      code: "trk",
      name: "Track",
      displayOrder: 1,
      modules,
      completedChapters: 0,
      totalChapters: modules.reduce((n, m) => n + m.chapters.length, 0),
      completedModules: 0,
      totalModules: modules.length,
      pct: 0,
    },
  ],
});

describe("findNextCohortChapter — last chapter of a module", () => {
  it("returns the next module's first chapter even when it is currently locked", () => {
    // Learner has just finished bk1.c3 (last chapter of module bk1).
    // The next module's first chapter (bk2.c1) is still locked because the
    // sequential prerequisite hasn't been recomputed yet — the completion
    // screen must still surface it so the learner can advance.
    const journey = buildJourney([
      mod("bk1", "Intro", 10, [
        ch({ code: "bk1.c1", title: "Ch 1", displayOrder: 10, status: "completed" }),
        ch({ code: "bk1.c2", title: "Ch 2", displayOrder: 20, status: "completed" }),
        ch({ code: "bk1.c3", title: "Ch 3 (last)", displayOrder: 30, status: "completed" }),
      ]),
      mod("bk2", "KYC", 20, [
        ch({ code: "bk2.c1", title: "KYC Ch 1", displayOrder: 10, status: "locked" }),
        ch({ code: "bk2.c2", title: "KYC Ch 2", displayOrder: 20, status: "locked" }),
      ]),
    ]);

    const next = findNextCohortChapter(journey, "bk1.c3");
    expect(next).not.toBeNull();
    expect(next?.chapterCode).toBe("bk2.c1");
    expect(next?.moduleCode).toBe("bk2");
  });

  it("returns null only when on the very last chapter of the journey", () => {
    const journey = buildJourney([
      mod("only", "Only", 10, [
        ch({ code: "only.c1", title: "Ch 1", displayOrder: 10, status: "completed" }),
        ch({ code: "only.c2", title: "Ch 2 (last)", displayOrder: 20, status: "completed" }),
      ]),
    ]);

    expect(findNextCohortChapter(journey, "only.c2")).toBeNull();
  });

  it("advances within the same module when more chapters remain", () => {
    const journey = buildJourney([
      mod("bk1", "Intro", 10, [
        ch({ code: "bk1.c1", title: "Ch 1", displayOrder: 10, status: "completed" }),
        ch({ code: "bk1.c2", title: "Ch 2", displayOrder: 20, status: "locked" }),
      ]),
    ]);

    const next = findNextCohortChapter(journey, "bk1.c1");
    expect(next?.chapterCode).toBe("bk1.c2");
  });
});
