export type PassportProfile = {
  name: string;
  givenName: string | null;
  familyName: string | null;
  residenceCountry: string | null;
  locality: string | null;
  gender: "male" | "female" | null;
};

export type Passport = PassportProfile & {
  playerCode: string;
  visibility: "private" | "public";
  membershipStatus: "active" | "inactive";
  memberSince: string | null;
  emailVerified: boolean;
  affiliationRequestsEnabled?: true;
  affiliations: {
    organisationId: string;
    name: string;
    type: string;
    status: string;
    validFrom: string | null;
    validUntil: string | null;
  }[];
};

export type ProfileChanges = Partial<{
  name: string;
  givenName: string;
  familyName: string | null;
  residenceCountry: string;
  locality: string;
  gender: NonNullable<PassportProfile["gender"]>;
}>;
type Patch = { kind: "privacy" } | { kind: "profile"; fields: ProfileChanges } | { kind: "invalid"; error: string };
const limits = {
  name: [160, "Enter a display name of up to 160 characters."],
  givenName: [80, "Enter a given name of up to 80 characters."],
  familyName: [79, "Enter a family name of up to 79 characters, or leave it blank."],
  locality: [120, "Enter a city, town or locality of up to 120 characters."],
} as const;

export function parsePassportPatch(body: unknown, isCountry: (code: string) => boolean): Patch {
  const invalid = (error: string): Patch => ({ kind: "invalid", error });
  if (!body || typeof body !== "object" || Array.isArray(body)) return invalid("Invalid profile update.");
  const input = body as Record<string, unknown>;
  const keys = Object.keys(input);
  if (keys.includes("visibility")) {
    return keys.length === 1 && input.visibility === "private"
      ? { kind: "privacy" }
      : invalid("Only private visibility is currently supported.");
  }
  if (!keys.length) return invalid("Choose at least one field to update.");

  const fields: ProfileChanges = {};
  for (const key of keys) {
    const value = input[key];
    if (key === "residenceCountry") {
      if (typeof value !== "string" || !isCountry(value)) return invalid("Select a supported country or territory.");
      fields.residenceCountry = value;
    } else if (key === "gender") {
      if (value !== "male" && value !== "female") return invalid("Select a valid gender.");
      fields.gender = value;
    } else if (key === "name" || key === "givenName" || key === "familyName" || key === "locality") {
      const [max, message] = limits[key];
      if (typeof value !== "string") return invalid(message);
      const trimmed = value.trim();
      if ((!trimmed && key !== "familyName") || trimmed.length > max || /[\p{Cc}\p{Zl}\p{Zp}]/u.test(trimmed))
        return invalid(message);
      if (key === "familyName") fields.familyName = trimmed || null;
      else fields[key] = trimmed;
    } else {
      return invalid("Unsupported profile fields.");
    }
  }
  if (fields.residenceCountry !== undefined && fields.locality === undefined)
    return invalid("Enter your locality when changing country of residence.");
  return { kind: "profile", fields };
}
