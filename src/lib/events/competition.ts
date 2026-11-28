import { parseStartingScores, startingScoreIssues, type StartingScorePlan } from "./starting-score.ts";

export const divisionKinds = {
  singles: { label:"Singles", description:"One player per entry", capacity:16, units:"players", preset:"Open singles" },
  doubles: { label:"Doubles", description:"Two players per entry", capacity:16, units:"pairs", preset:"Open doubles" },
  "mens-doubles": { label:"Men’s Doubles", description:"Men’s pairs", capacity:16, units:"pairs", preset:"Men’s Doubles" },
  "womens-doubles": { label:"Women’s Doubles", description:"Women’s pairs", capacity:16, units:"pairs", preset:"Women’s Doubles" },
  mixed: { label:"Mixed Doubles", description:"Mixed-gender pairs", capacity:16, units:"pairs", preset:"Open mixed doubles" },
  team: { label:"Team event", description:"A roster per entry", capacity:8, units:"teams", preset:"Open teams" },
} as const;

export const drawFormats = {
  "double-elimination":"Double elimination",
  "round-robin":"Round robin",
  "single-elimination":"Single elimination",
} as const;

export const rankingTracks = {
  "mens-singles":"Men’s Singles",
  "womens-singles":"Women’s Singles",
  "mens-doubles":"Men’s Doubles",
  "womens-doubles":"Women’s Doubles",
  "mixed-doubles":"Mixed Doubles",
  team:"Team",
} as const;

export type DivisionKind = keyof typeof divisionKinds;
export const doublesKinds=["mens-doubles","womens-doubles","mixed","doubles"] as const;
export type DoublesKind=(typeof doublesKinds)[number];
export const isDoublesKind=(value:unknown):value is DoublesKind=>doublesKinds.some(kind=>kind===value);
export const doublesCategoryLabel=(kind:DoublesKind)=>kind==="doubles"?"Open Doubles":divisionKinds[kind].label;

export type DrawFormat = keyof typeof drawFormats;
export type RankingTrack = keyof typeof rankingTracks;
export type EntryRule = { mode:"open" } |
  { mode:"ranking"; track:RankingTrack | null; minimum:number | null; cutoffDate:string };

export type Division = {
  id:string;
  kind:DivisionKind;
  name:string;
  format:DrawFormat;
  capacity:number | null;
  entry:EntryRule;
  startingScore?:StartingScorePlan;
};

export const MAX_DIVISIONS=64;
export const MAX_DIVISION_NAME=100;
export const MAX_DIVISION_CAPACITY=4096;

export const tracksFor:Record<DivisionKind, readonly RankingTrack[]> = {
  singles:["mens-singles","womens-singles"],
  doubles:["mens-doubles","womens-doubles"],
  "mens-doubles":["mens-doubles"],
  "womens-doubles":["womens-doubles"],
  mixed:["mixed-doubles"],
  team:["team"],
};

export function newDivision(kind:DivisionKind,id:string,existing:readonly Division[]):Division {
  const name=nextDivisionName(divisionKinds[kind].preset,existing);
  return {id,kind,name,format:kind==="team"?"round-robin":"double-elimination",capacity:divisionKinds[kind].capacity,entry:{mode:"open"}};
}

export function nextDivisionName(base:string,existing:readonly Division[]) {
  const taken=new Set(existing.map(d=>d.name.trim().toLowerCase()));
  const stem=base.trim().slice(0,MAX_DIVISION_NAME) || "Division";
  if (!taken.has(stem.toLowerCase())) return stem;
  for (let n=2;;n++) {
    const suffix=" "+n;
    const name=stem.slice(0,MAX_DIVISION_NAME-suffix.length).trimEnd()+suffix;
    if (!taken.has(name.toLowerCase())) return name;
  }
}

// Do not silently recategorise stored drafts. This runs only after an organiser
// explicitly changes the category. Keep a cutoff only if its leaderboard still matches.
export function changeDoublesCategory(division:Division,kind:DoublesKind,existing:readonly Division[]):Division {
  if (!isDoublesKind(division.kind) || division.kind===kind) return division;
  const original=divisionKinds[division.kind].preset;
  const defaultName=division.name===original ||
    (division.name.startsWith(original+" ") && /^\d+$/.test(division.name.slice(original.length+1)));
  const name=defaultName?nextDivisionName(divisionKinds[kind].preset,existing.filter(d=>d.id!==division.id)):division.name;
  const allowed=tracksFor[kind];
  const entry=division.entry;
  return {...division,kind,name,startingScore:undefined,entry:entry.mode==="ranking" && (!entry.track || !allowed.includes(entry.track)) ?
    {...entry,track:allowed.length===1?allowed[0]:null,minimum:null} : entry};
}

const object=(x:unknown):x is Record<string,unknown>=>!!x && typeof x==="object" && !Array.isArray(x);
const own=<T extends object>(value:unknown,keys:T):value is Extract<keyof T,string>=>typeof value==="string" && Object.hasOwn(keys,value);
const hasOnly=(value:Record<string,unknown>,keys:readonly string[])=>Object.keys(value).every(k=>keys.includes(k));
const capacityValid=(n:unknown):n is number=>typeof n==="number" && Number.isInteger(n) && n>=2 && n<=MAX_DIVISION_CAPACITY;
const draftNumber=(n:unknown):n is number=>typeof n==="number" && Number.isSafeInteger(n) && n>=0;
const minimumValid=(n:unknown):n is number=>draftNumber(n) && n>=1;
export function isCalendarDate(value:string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date=new Date(value+"T00:00:00Z");
  return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0,10)===value;
}

function parseEntry(value:unknown,kind:DivisionKind):EntryRule | null {
  if (!object(value)) return null;
  if (value.mode==="open" && hasOnly(value,["mode"])) return {mode:"open"};
  if (value.mode!=="ranking" || !hasOnly(value,["mode","track","minimum","cutoffDate"])) return null;
  const {track,minimum,cutoffDate}=value;
  if (track!==null && (!own(track,rankingTracks) || !tracksFor[kind].includes(track))) return null;
  if (minimum!==null && !draftNumber(minimum)) return null;
  if (typeof cutoffDate!=="string" || (cutoffDate && !isCalendarDate(cutoffDate))) return null;
  return {mode:"ranking",track,minimum,cutoffDate};
}

export function parseDivisions(input:unknown,validId:(value:unknown)=>value is string):Division[] | null {
  // Drafts and public snapshots written before Competition have no divisions field.
  if (input===undefined) return [];
  if (!Array.isArray(input) || input.length>MAX_DIVISIONS) return null;
  const ids=new Set<string>(), divisions:Division[]=[];
  for (const value of input) {
    if (!object(value) || !hasOnly(value,["id","kind","name","format","capacity","entry","startingScore"])) return null;
    const {id,kind,name,format,capacity}=value;
    if (!validId(id) || ids.has(id) || !own(kind,divisionKinds) || !own(format,drawFormats)) return null;
    if (typeof name!=="string" || name.length>MAX_DIVISION_NAME || (capacity!==null && !draftNumber(capacity))) return null;
    const entry=parseEntry(value.entry,kind);
    if (!entry) return null;
    const startingScore=value.startingScore===undefined?undefined:parseStartingScores(value.startingScore);
    if (value.startingScore!==undefined && (!startingScore || kind!=="doubles")) return null;
    ids.add(id);
    divisions.push({id,kind,name:name.trim(),format,capacity,entry,...(startingScore?{startingScore}:{})});
  }
  return divisions;
}

export function divisionIssues(divisions:readonly Division[],eventDate:string) {
  const issues:string[]=[];
  const names=new Set<string>();
  divisions.forEach((d,index)=>{
    const label=d.name.trim() || "Division "+(index+1);
    if (!d.name.trim()) issues.push(label+" needs a name.");
    else if (names.has(d.name.trim().toLowerCase())) issues.push(label+" needs a distinct name.");
    names.add(d.name.trim().toLowerCase());
    if (!capacityValid(d.capacity)) issues.push(label+" needs a capacity of 2 to "+MAX_DIVISION_CAPACITY+" "+divisionKinds[d.kind].units+".");
    if (d.startingScore) issues.push(...startingScoreIssues(d.startingScore).map(issue=>label+" — "+issue));
    if (d.entry.mode==="ranking") {
      if (!d.entry.track || !tracksFor[d.kind].includes(d.entry.track)) issues.push(label+" needs a WPU leaderboard.");
      if (!minimumValid(d.entry.minimum)) issues.push(label+" needs a minimum number of WPU points.");
      if (!isCalendarDate(d.entry.cutoffDate)) issues.push(label+" needs a ranking cutoff date.");
      else if (eventDate && d.entry.cutoffDate>eventDate) issues.push(label+" needs a ranking cutoff on or before the event date.");
    }
  });
  return issues;
}

export function describeEntry(division:Division,formatDate:(date:string)=>string) {
  const {entry,kind}=division;
  if (entry.mode==="open") return "No WPU ranking required.";
  if (!entry.track || !minimumValid(entry.minimum) || !isCalendarDate(entry.cutoffDate)) return "WPU ranking requirements are not complete.";
  const who=kind==="singles"?"Each player needs":kind==="team"?"Each team needs":"Both partners independently need";
  const track=entry.track==="team"?"team ranking":rankingTracks[entry.track];
  return who+" "+entry.minimum+" WPU "+track+" points at the "+formatDate(entry.cutoffDate)+" cutoff.";
}

export function publicDivisions(divisions:readonly Division[]) {
  return divisions.map(({id,kind,name,format,capacity,entry,startingScore}):Division=>({
    id,kind,name,format,capacity,
    ...(startingScore?{startingScore}:{}),
    entry:entry.mode==="open"?{mode:"open"}:{mode:"ranking",track:entry.track,minimum:entry.minimum,cutoffDate:entry.cutoffDate},
  }));
}
