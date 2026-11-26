export const federationSlug = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export function isFederationSlug(value: unknown): value is string {
  return typeof value === "string" && value.length <= 63 && federationSlug.test(value);
}
