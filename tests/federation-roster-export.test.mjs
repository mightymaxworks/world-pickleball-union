import assert from "node:assert/strict";
import test from "node:test";
import { federationRosterCsv } from "../src/lib/federations/roster-export.ts";

test("CSV provides only the three roster fields and keeps names readable in Excel", () => {
  const csv = federationRosterCsv([
    {
      displayName: 'རྡོ་རྗེ་, "Dorji"',
      playerId: "WPU-TEST-1",
      rosterStatus: "listed",
      email: "private@example.test",
      birthDate: "1900-01-01",
    },
    { displayName: "Tshering", playerId: "WPU-TEST-2", rosterStatus: "on_hold" },
  ]);
  assert.equal(csv, '\uFEFFPlayer name,WPU Player ID,Roster status\r\n"རྡོ་རྗེ་, ""Dorji""","WPU-TEST-1","Listed"\r\n"Tshering","WPU-TEST-2","On hold"\r\n');
});

test("CSV renders spreadsheet formula-like values as visible text", () => {
  for (const displayName of ["=Roster", "  +Roster", "-Roster", "@Roster", "＋Roster", "\tRoster", "\u200B=Roster"]) {
    const row = { displayName, playerId: "WPU-TEST-1", rosterStatus: "listed" };
    assert.equal(federationRosterCsv([row]).split("\r\n")[1], '"Text: ' + displayName + '","WPU-TEST-1","Listed"');
  }
});
