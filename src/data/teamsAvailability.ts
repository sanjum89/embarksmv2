/**
 * Deterministic mock Microsoft Teams calendar availability per learner.
 * Same inputs → same slots, so demos stay stable.
 */
export type SlotStatus = "free" | "busy" | "tentative";
export interface Slot {
  time: string; // "09:00"
  status: SlotStatus;
  meeting?: string;
}
export interface DaySlots {
  date: Date;
  label: string;   // "Mon"
  dateLabel: string; // "12 May"
  slots: Slot[];
}

const HOURS = ["09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30"];

const BUSY_TITLES = [
  "Portfolio review",
  "Client call — Mr & Mrs Hartwell",
  "Deal team sync",
  "Compliance training",
  "Investment committee",
  "1:1 with mentor",
  "Research read-out",
  "Pitch prep",
];

function hash(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function nextWeekdays(count: number): Date[] {
  const out: Date[] = [];
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  // start tomorrow
  d.setDate(d.getDate() + 1);
  while (out.length < count) {
    const day = d.getDay();
    if (day !== 0 && day !== 6) out.push(new Date(d));
    d.setDate(d.getDate() + 1);
  }
  return out;
}

export function getAvailability(employeeId: string, days = 5): DaySlots[] {
  const dayList = nextWeekdays(days);
  return dayList.map((date, dayIdx) => {
    const slots: Slot[] = HOURS.map((time, slotIdx) => {
      const seed = hash(`${employeeId}-${dayIdx}-${slotIdx}`);
      const r = seed % 100;
      let status: SlotStatus;
      if (r < 55) status = "free";
      else if (r < 85) status = "busy";
      else status = "tentative";
      return {
        time,
        status,
        meeting: status === "busy" ? BUSY_TITLES[seed % BUSY_TITLES.length] : undefined,
      };
    });
    return {
      date,
      label: date.toLocaleDateString("en-GB", { weekday: "short" }),
      dateLabel: date.toLocaleDateString("en-GB", { day: "2-digit", month: "short" }),
      slots,
    };
  });
}
