export const REVIEW_POLICY_VERSION="wpu-supporters-v1";
export type PledgeEvidence={name:string;category:string;website:string;email:string;duplicateCount:number;emailVerified:boolean;domainVerified:boolean;abusePassed:boolean;};
export type Decision={decision:"approve"|"human_review"|"pending_verification";reasons:string[];policyVersion:string};
export function assessPledge(e:PledgeEvidence):Decision{
 const reasons:string[]=[];
 const hostname=new URL(e.website).hostname.toLowerCase().replace(/^www\./,"");
 const domain=e.email.split("@")[1]?.toLowerCase()||"";
 const restricted=e.category==="National & Regional Organisations"||e.category==="Institutional & Strategic";
 const authorityClaim=/\b(federation|national|international|world|government|ministry|olympic|official governing)\b/i.test(e.name);
 if(restricted||authorityClaim)reasons.push("institutional_or_governing_claim");
 if(e.duplicateCount>0)reasons.push("possible_duplicate");
 if(domain!==hostname&&!domain.endsWith("."+hostname))reasons.push("email_domain_mismatch");
 if(!e.abusePassed)reasons.push("abuse_check_incomplete");
 if(reasons.length)return {decision:"human_review",reasons,policyVersion:REVIEW_POLICY_VERSION};
 if(!e.emailVerified||!e.domainVerified)return {decision:"pending_verification",reasons:["independent_verification_required"],policyVersion:REVIEW_POLICY_VERSION};
 return {decision:"approve",reasons:["verified_low_risk_organisation"],policyVersion:REVIEW_POLICY_VERSION};
}
