import { isCalendarDate, type Division } from "../events/competition.ts";
import { usesStartingHandicap } from "../events/starting-score.ts";
import { isEventId, isEventSlug } from "../events/model.ts";

export const pilotKinds=["singles","doubles","mens-doubles","womens-doubles","mixed"] as const;
export type PilotKind=(typeof pilotKinds)[number];
export const isPilotKind=(value:unknown):value is PilotKind=>pilotKinds.some(k=>k===value);
export const canRegisterDivision=(d:Division)=>isPilotKind(d.kind)&&d.entry.mode==="open"&&!usesStartingHandicap(d.startingScore);
export const isInvite=(value:unknown):value is string=>typeof value==="string"&&/^[a-f0-9]{48}$/.test(value);
export type Currency="SGD"|"USD";
export const isCurrency=(value:unknown):value is Currency=>value==="SGD"||value==="USD";
export const registrationStatus={
 invited:"Partner invited",waitlisted:"Waitlisted",offered:"Place available",ready:"Ready to pay",paying:"Checkout in progress",
 confirmed:"Confirmed",withdrawn:"Withdrawn",expired:"Hold expired",
} as const;
export type EntryStatus=keyof typeof registrationStatus;
export type EntryFee={amount:number;currency:Currency};
export type Registration={divisionId:string;name:string;kind:PilotKind;capacity:number;closesAt:number;
  terms:string;contact:string;accepting:boolean;ended:boolean;fee:EntryFee;counts?:Partial<Record<EntryStatus,number>>};
export type EntryView={id:string;status:EntryStatus;divisionId:string;name:string;eventSlug:string;eventTitle:string;kind:PilotKind;
  holdUntil:number|null;seatHeld:boolean;role:"lead"|"partner";invite?:string;fee:EntryFee;canPay:boolean;terms:string;contact:string};
export type EntryPlayer={id:string;name:string;hasBirthDate:boolean;gender:"male"|"female"|null};
export type RegistrationInput={closesAt:number;amount:number;currency:Currency;terms:string;contact:string};
export const formatFee=({amount,currency}:EntryFee)=>amount===0?"Free":new Intl.NumberFormat("en-SG",{style:"currency",currency,currencyDisplay:"code"}).format(amount/100);
export const feeUnit=(kind:PilotKind)=>kind==="singles"?"per player":"per pair";
export function toMinorUnits(value:string) {
  if (!/^\d{1,5}(\.\d{1,2})?$/.test(value.trim())) return null;
  const [whole,fraction=""]=value.trim().split(".");
  return Number(whole)*100+Number(fraction.padEnd(2,"0"));
}
export function parseRegistrationInput(input:Record<string,unknown>,now=Date.now()) {
  const {closesAt,amount,currency,terms,contact}=input;
  if (typeof closesAt!=="number"||!Number.isSafeInteger(closesAt)||closesAt<=Math.floor(now/1000)||closesAt>253402300799||
      typeof amount!=="number"||!Number.isSafeInteger(amount)||amount<0||amount!==0&&amount<50||amount>9_999_999||!isCurrency(currency)||
      typeof terms!=="string"||terms.length>1200||
      typeof contact!=="string"||contact.length>254||!/^[-+.\w]+@[-.\w]+\.\w{2,}$/u.test(contact.trim())||
      (amount>0&&!terms.trim())) return null;
  return {closesAt,amount,currency,terms:terms.trim(),contact:contact.trim()} satisfies RegistrationInput;
}
export function validBirthDate(value:unknown,now=Date.now()):value is string {
  return typeof value==="string"&&isCalendarDate(value)&&value<new Date(now).toISOString().slice(0,10);
}
export function canJoinKind(kind:PilotKind,player:EntryPlayer,partnerGender?:EntryPlayer["gender"]) {
  if (!player.hasBirthDate) return false;
  if (kind==="mens-doubles") return player.gender==="male";
  if (kind==="womens-doubles") return player.gender==="female";
  if (kind==="mixed") return !!player.gender&&(partnerGender===undefined||!!partnerGender&&player.gender!==partnerGender);
  return true;
}
export function entryReturnPath(slug:unknown,division:unknown,invite:unknown) {
  if (!isEventSlug(slug)||!isEventId(division)||(invite!==undefined&&!isInvite(invite))) return null;
  return "/events/"+slug+"/enter/"+division+(invite?"?invite="+invite:"");
}
