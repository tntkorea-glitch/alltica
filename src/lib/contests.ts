export type ContestStatus = "모집중" | "마감임박" | "마감" | "예정";

export interface ContestSchedule {
  label: string;
  value: string;
}

export interface Contest {
  id: string;
  title: string;
  titleEn?: string;
  subtitle: string;
  category: string;
  tags: string[];
  dateDisplay: string;
  applicationDeadline: string;
  location: string;
  organizer: string;
  prize: string;
  status: ContestStatus;
  applyUrl: string;
  image?: string;
  fee?: string;
  eligible?: string;
  contact?: string;
  schedule?: ContestSchedule[];
}

export const CONTESTS: Contest[] = [];

export function getActiveContests(): Contest[] {
  return CONTESTS.filter((c) => c.status === "모집중" || c.status === "마감임박");
}
