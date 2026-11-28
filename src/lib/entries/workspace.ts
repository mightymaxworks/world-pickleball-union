import { parseRegistrationInput, type Registration, type RegistrationSetup } from "./model.ts";

type Page={date:string;timezone:string;publishedCurrent:boolean;payments:boolean};

export function setupBlocker(settings:RegistrationSetup,page:Page,now=Date.now()) {
  if(settings.closesAt===null||settings.closesAt<=Math.floor(now/1000))return "Set a future entry deadline.";
  if(!/^[-+.\w]+@[-.\w]+\.\w{2,}$/u.test(settings.contact.trim()))return "Add a valid public contact email.";
  if(settings.amount===null||settings.amount>0&&settings.amount<50)return "Set an entry fee of at least 0.50.";
  if(settings.amount>0&&!settings.terms.trim())return "Add cancellation terms for paid entries.";
  const input=parseRegistrationInput(settings,now);
  if(!input)return "Check the deadline, fee and contact details.";
  const closingDay=new Intl.DateTimeFormat("sv-SE",{timeZone:page.timezone,year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date(input.closesAt*1000));
  if(page.date&&closingDay>page.date)return "Entries must close on or before the event date.";
  return null;
}

export type RegistrationStage="new"|"incomplete"|"saved"|"blocked"|"ready"|"open"|"paused"|"closed"|"unavailable";
export function registrationStage({live,settings,unavailable,page,now}:{live?:Registration;settings?:RegistrationSetup;unavailable?:string;page:Page;now?:number}):
  {stage:RegistrationStage;label:string;detail?:string} {
  if(live)return live.accepting?{stage:"open",label:"Open"}:live.ended?{stage:"closed",label:"Closed"}:{stage:"paused",label:"Paused"};
  if(unavailable)return {stage:"unavailable",label:"Unavailable",detail:unavailable};
  if(!settings)return {stage:"new",label:"Not set up"};
  const blocker=setupBlocker(settings,page,now);
  if(blocker)return {stage:"incomplete",label:"Setup incomplete",detail:blocker};
  if(settings.amount&& !page.payments)return {stage:"blocked",label:"Card checkout not connected",detail:"Paid entries can’t open until card checkout is connected."};
  return page.publishedCurrent?{stage:"ready",label:"Ready to open"}:{stage:"saved",label:"Saved · not open"};
}
