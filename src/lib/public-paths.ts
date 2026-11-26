export const joinWpu = "/get-involved";
export const playerRegistration = "/join";
export const playerSignIn = "/join?mode=login";
export const organisationJoin = "/members";
export const organisationIntake = "/members#register";
export const publicNavigation = [
  ["Competitions", "/competitions"],
  ["Federations & Clubs", organisationJoin],
  ["Development", "/development"],
  ["About WPU", "/about"],
] as const;
