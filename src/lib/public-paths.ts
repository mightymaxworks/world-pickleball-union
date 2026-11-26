export const joinWpu = "/get-involved";
export const playerRegistration = "/join";
export const playerSignIn = "/join?mode=login";
export const organisationJoin = "/members";
export const organisationIntake = "/members#register";

export const publicNavigation = [
  {
    label: "Competitions",
    links: [
      ["Competition overview", "/competitions"],
      ["Competition pathways", "/competitions#ecosystem"],
      ["Host a competition", "/competitions#competition-interest"],
      ["Standards & integrity", "/standards"],
    ],
  },
  {
    label: "Federations & Clubs",
    links: [
      ["Federations, associations & clubs", organisationJoin],
      ["Introduce your organisation", organisationIntake],
      ["National membership & representation", "/members#national-membership"],
      ["Membership framework", "/members#membership-framework"],
      ["Bhutan Player Passport pilot", "/federations/bhutan"],
    ],
  },
  {
    label: "Development",
    links: [
      ["Development overview", "/development"],
      ["Development pathways", "/development#pathway"],
      ["Global Marina Initiative", "/initiatives/global-marina"],
    ],
  },
  {
    label: "About WPU",
    links: [
      ["About World Pickleball Union", "/about"],
      ["Governance", "/governance"],
      ["Standards & integrity", "/standards"],
      ["Global Support Network", "/supporters"],
      ["Brand & certification marks", "/brand"],
    ],
  },
] as const;
