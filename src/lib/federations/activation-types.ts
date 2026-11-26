export type ActivationAction = "open" | "paused";
export type PublicationState = "open" | "paused" | "unpublished";
export type ActivationCandidate = {
  id: string;
  name: string;
  countryCode: string | null;
  slug: string | null;
  state: PublicationState;
  revision: number;
  verified: boolean;
  hasOperator: boolean;
  hasReviewer: boolean;
  lastAction: null | { actor: string; at: string; reason: string };
};
