export type AffiliationState = "awaiting_player" | "awaiting_review" | "declined" | "approved" | "rejected" | "revoked";
export type AffiliationDecision = "approve" | "reject" | "revoke";
export type AffiliationCase = {
  id: string;
  organisation: string;
  playerCodeEnding: string;
  state: AffiliationState;
  updatedAt: string;
  actions: AffiliationDecision[];
  history: {sequence: number; kind: string; actor: string | null; state: AffiliationState; reason: string; at: string}[];
};
export type AffiliationInvitation = { id: string; organisation: string; createdAt: string };

export const affiliationStateLabels: Record<AffiliationState, string> = {
  awaiting_player: "Awaiting player consent",
  awaiting_review: "Ready for independent review",
  declined: "Declined by player",
  approved: "Approved",
  rejected: "Rejected",
  revoked: "Revoked",
};
