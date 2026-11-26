export const intakeOrganisationTypes = {
  national_federation: "National federation or association",
  regional_association: "Regional association",
  district_association: "District or local association",
  club: "Club",
  other: "Other pickleball organisation",
} as const;

export type IntakeOrganisationType = keyof typeof intakeOrganisationTypes;
export function isIntakeOrganisationType(value: unknown): value is IntakeOrganisationType {
  return typeof value === "string" && Object.hasOwn(intakeOrganisationTypes, value);
}

export const intakeDecisions = {
  follow_up: "Contact for more information",
  approve_existing: "Approve pilot participation and link an existing organisation",
  approve_new: "Approve pilot participation and create an organisation record",
  close: "Close without approval",
} as const;
export type IntakeDecision = keyof typeof intakeDecisions;
export function isIntakeDecision(value: unknown): value is IntakeDecision {
  return typeof value === "string" && Object.hasOwn(intakeDecisions, value);
}
export type IntakeCase = {
  reference: string; name: string; country: string; type: IntakeOrganisationType | null;
  contact: string; email: string; role: string; website: string; message: string;
  createdAt: string; closed: boolean; version: number; review: null | { decision: IntakeDecision; name: string; reason: string; createdAt: string; organisationId: string | null };
};
