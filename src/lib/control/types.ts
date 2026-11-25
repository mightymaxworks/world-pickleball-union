export type AffiliationState = "awaiting_player" | "awaiting_review" | "declined" | "approved" | "rejected" | "revoked";
export type AffiliationDecision = "approve" | "reject" | "revoke";
export type AffiliationCase = {
  id: string;
  organisation: string;
  playerCodeEnding: string;
  playerName: string | null;
  source: "operator" | "player";
  state: AffiliationState;
  updatedAt: string;
  actions: AffiliationDecision[];
  history: {sequence: number; kind: string; actor: string | null; state: AffiliationState; reason: string; at: string}[];
};
export type AffiliationInvitation = { id: string; organisation: string; createdAt: string };

export type AffiliationRequestOption = { id: string; name: string };
export type OwnAffiliationRequest = { id: string; organisation: string; state: AffiliationState };
export type PlayerAffiliationWorkspace = {
  invitations: AffiliationInvitation[];
  options: AffiliationRequestOption[];
  requests: OwnAffiliationRequest[];
};

export const affiliationStateLabels: Record<AffiliationState, string> = {
  awaiting_player: "Awaiting player consent",
  awaiting_review: "Ready for independent review",
  declined: "Declined by player",
  approved: "Approved",
  rejected: "Rejected",
  revoked: "Revoked",
};
