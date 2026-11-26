import type { RosterStatus } from "./service";

export const memberCategories = { player: "Player", coach: "Coach", official: "Official", other: "Other" } as const;
export type MemberCategory = keyof typeof memberCategories;
export type MemberFields = {
  membershipNumber: string | null;
  club: string | null;
  category: MemberCategory | null;
  joinedOn: string | null;
  renewalOn: string | null;
};
export type MemberSummary = Pick<MemberFields, "membershipNumber" | "club" | "category"> & {
  displayName: string;
  playerId: string;
  rosterStatus: RosterStatus;
};
export type MemberRecord = MemberFields & MemberSummary & {
  affiliation: "approved";
  revision: number;
  rosterRevision: number;
  history: { status: RosterStatus; actor: string; changedAt: string; reason: string | null }[];
};
export type MemberFilters = { q: string; club: string; category: MemberCategory | ""; status: RosterStatus | "" };

export const playerIdPattern = /^WPU-[A-F0-9]{32}$/;
export const memberCursorPattern = /^affiliation:[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/;
export const isMemberCategory = (value: unknown): value is MemberCategory =>
  typeof value === "string" && Object.hasOwn(memberCategories, value);
export const isRosterStatus = (value: unknown): value is RosterStatus => value === "listed" || value === "on_hold";

function normalizedText(value: unknown, max: number): string | null | undefined {
  if (typeof value !== "string" || /\p{Cc}/u.test(value) || value.length > max) return undefined;
  return value.trim() || null;
}
function calendarDate(value: unknown): string | null | undefined {
  if (value === "") return null;
  if (typeof value !== "string" || !/^(?!0000)\d{4}-\d{2}-\d{2}$/.test(value)) return undefined;
  const date = new Date(value + "T00:00:00Z");
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value ? value : undefined;
}

export function parseMemberFields(body: Record<string, unknown>): MemberFields | null {
  const membershipNumber = normalizedText(body.membershipNumber, 40);
  const club = normalizedText(body.club, 100);
  const category = body.category === "" ? null : isMemberCategory(body.category) ? body.category : undefined;
  const joinedOn = calendarDate(body.joinedOn);
  const renewalOn = calendarDate(body.renewalOn);
  if (membershipNumber === undefined || club === undefined || category === undefined ||
      joinedOn === undefined || renewalOn === undefined || (joinedOn && renewalOn && renewalOn < joinedOn)) return null;
  return { membershipNumber, club, category, joinedOn, renewalOn };
}
export function parseMemberFilters(params: URLSearchParams): MemberFilters | null {
  const q = normalizedText(params.get("q") ?? "", 100);
  const club = normalizedText(params.get("club") ?? "", 100);
  const category = params.get("category") ?? "";
  const status = params.get("status") ?? "";
  if (q === undefined || club === undefined || (category && !isMemberCategory(category)) || (status && !isRosterStatus(status))) return null;
  return { q: q ?? "", club: club ?? "", category: isMemberCategory(category) ? category : "", status: isRosterStatus(status) ? status : "" };
}
export const parseRosterReason = (value: unknown) => normalizedText(value, 240) || null;
export const isRevision = (value: unknown): value is number =>
  typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
