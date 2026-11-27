import { divisionIssues, isCalendarDate, parseDivisions, publicDivisions, type Division } from "./competition.ts";

export const kinds = {
  tournament: { label: "Tournament", example: "Club doubles", detail: "Competition and match play" },
  clinic: { label: "Clinic", example: "Beginner clinic", detail: "Coaching and skills" },
  social: { label: "Social", example: "Meet the players", detail: "Meetups and community" },
  information: { label: "Information", example: "Shirt pickup", detail: "Pickup, partner events and notices" },
} as const;

export type ActivityKind = keyof typeof kinds;
export type Activity = { id: string; kind: ActivityKind; title: string; time: string; location: string; description: string };
export type EventDraft = { title: string; date: string; timezone: string; venue: string; description: string; activities: Activity[]; divisions: Division[] };
export type Organisation = { id: string; name: string };
export type EventRecord = {
  id: string; organisation: Organisation; slug: string; revision: number; publishedRevision: number | null;
  draft: EventDraft; updatedAt: string;
};
export type PublicEvent = { organiser: string; programme: EventDraft };
export const MAX_ACTIVITIES = 16;

export function emptyDraft(): EventDraft {
  return { title: "", date: "", timezone: "UTC", venue: "", description: "", activities: [], divisions: [] };
}
const object = (x: unknown): x is Record<string, unknown> => !!x && typeof x === "object" && !Array.isArray(x);
const asText = (x: unknown, max: number) => typeof x === "string" && x.length <= max ? x.trim() : null;
const uuid = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/;
const isKind = (kind: unknown): kind is ActivityKind => typeof kind === "string" && Object.hasOwn(kinds,kind);
export const isEventId = (value: unknown): value is string => typeof value === "string" && uuid.test(value);
export const isEventSlug = (value: unknown): value is string => typeof value === "string" && value.length <= 82 && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
export const isOrganisationId = (value: unknown): value is string => typeof value === "string" && /^[a-zA-Z0-9:_-]{1,128}$/.test(value);

export function parseDraft(input: unknown): EventDraft | null {
  if (!object(input)) return null;
  const title=asText(input.title,100), date=asText(input.date,10), timezone=asText(input.timezone,100);
  const venue=asText(input.venue,160), description=asText(input.description,700);
  if ([title,date,venue,description].includes(null) || !timezone || !/^[a-zA-Z][a-zA-Z0-9_+/-]*$/.test(timezone)) return null;
  try { new Intl.DateTimeFormat("en", { timeZone: timezone }); } catch { return null; }
  if (date && !isCalendarDate(date)) return null;
  if (!Array.isArray(input.activities) || input.activities.length > MAX_ACTIVITIES) return null;
  const activities: Activity[] = [], ids = new Set<string>();
  for (const item of input.activities) {
    if (!object(item) || !isEventId(item.id) || ids.has(item.id) || !isKind(item.kind)) return null;
    const title=asText(item.title,100), time=asText(item.time,5), location=asText(item.location,120), description=asText(item.description,350);
    if (title===null || time===null || location===null || description===null || (time && !/^([01]\d|2[0-3]):[0-5]\d$/.test(time))) return null;
    ids.add(item.id);
    activities.push({ id:item.id, kind:item.kind, title, time, location, description });
  }
  const divisions=parseDivisions(input.divisions,isEventId);
  return divisions ? {title:title!,date:date!,timezone,venue:venue!,description:description!,activities,divisions} : null;
}

export function publishIssues(draft: EventDraft) {
  const issues: string[] = [];
  if (!draft.title.trim()) issues.push("Add an event name.");
  if (!draft.date) issues.push("Set the event date.");
  if (!draft.venue.trim()) issues.push("Add a venue.");
  if (!draft.divisions.length && !draft.activities.some(activity => activity.time && activity.title)) issues.push("Add a division or schedule at least one named activity.");
  if (draft.activities.some(activity => activity.time && !activity.title)) issues.push("Name each scheduled activity.");
  return [...issues,...divisionIssues(draft.divisions,draft.date)];
}

export function publicProgramme(draft: EventDraft): EventDraft {
  // Copy an explicit set of public fields, not the editor record and its metadata.
  return { title:draft.title, date:draft.date, timezone:draft.timezone, venue:draft.venue,
    description:draft.description, activities:draft.activities.filter(a=>a.title && a.time)
      .map(a=>({id:a.id,kind:a.kind,title:a.title,time:a.time,location:a.location,description:a.description}))
      .sort((a,b)=>a.time.localeCompare(b.time)), divisions:publicDivisions(draft.divisions) };
}

export function eventSlug(title: string, id: string) {
  const stem = title.normalize("NFKD").toLowerCase().replace(/[\u0300-\u036f]/g,"")
    .replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,45).replace(/-$/,"");
  return (stem || "event") + "-" + id;
}

export function displayDate(date: string) {
  return isCalendarDate(date) ? new Intl.DateTimeFormat("en-GB",{dateStyle:"full",timeZone:"UTC"}).format(new Date(date+"T00:00:00Z")) : "Date to be added";
}
