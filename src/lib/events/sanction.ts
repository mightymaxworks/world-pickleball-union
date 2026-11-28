import type { Division } from "./competition.ts";
import type { EventDraft } from "./model.ts";
import { usesStartingHandicap } from "./starting-score.ts";

export const LOCAL_SANCTION_POLICY=1;
export const tierNames={T1:"Championship",T2:"Pro",T3:"Challenger",T4:"Development",T5:"Local"} as const;
export type Tier=keyof typeof tierNames;
export type HigherTier=Exclude<Tier,"T5">;
export const higherTiers=["T4","T3","T2","T1"] as const;
export const isHigherTier=(value:unknown):value is HigherTier=>higherTiers.some(tier=>value===tier);
export type TiersByDivision=Record<string,Tier>;
export type RequestStatus="pending"|"approved"|"changes_requested";
export type StaffDecision=Exclude<RequestStatus,"pending">;
export type Evidence={ field:string; officiating:string; verification:string };
export type SanctionRequest={
  id:string; divisionId:string; tier:HigherTier; status:RequestStatus; matchesDraft:boolean; note:string; createdAt:string;
};
export type SanctionWorkspace={
  live:TiersByDivision; preview:TiersByDivision; requests:SanctionRequest[]; available:boolean;
};

// Other divisions, programme sessions and promotional copy are not part of the
// decision. Keep this array and the SQLite match in sanction-service.ts aligned.
export function sanctionBasis(draft:EventDraft,division:Division) {
  const entry=division.entry;
  return JSON.stringify([draft.title,draft.date,draft.timezone,draft.venue,division.id,division.kind,division.name,division.format,
    division.capacity,entry.mode,...(entry.mode==="ranking"?[entry.track,entry.minimum,entry.cutoffDate]:[null,null,null]),
    ...(division.minimumAge===undefined?[]:[division.minimumAge])]);
}

export const canSanctionDivision=(division:Division)=>!usesStartingHandicap(division.startingScore);

export function localTiers(draft:EventDraft):TiersByDivision {
  return Object.fromEntries(draft.divisions.filter(division=>division.entry.mode==="open" && canSanctionDivision(division)).map(division=>[division.id,"T5"]));
}

export function readEvidence(input:unknown):Evidence|null {
  if (!input || typeof input!=="object" || Array.isArray(input) || Object.keys(input).some(k=>!["field","officiating","verification"].includes(k))) return null;
  const values=input as Record<string,unknown>;
  function read(k:keyof Evidence) {
    const value=values[k];
    if (typeof value!=="string" || value.length>1000 || /\p{Cc}/u.test(value.replaceAll("\n","").replaceAll("\r","").replaceAll("\t",""))) return null;
    return value.trim() || null;
  }
  const field=read("field"), officiating=read("officiating"), verification=read("verification");
  return field && officiating && verification ? {field,officiating,verification} : null;
}

export function tierLabel(tier:Tier) {return tier+" "+tierNames[tier];}
