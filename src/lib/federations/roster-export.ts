import type { RosterStatus } from "./service";

export type RosterExportPlayer = {
  displayName: string;
  playerId: string;
  rosterStatus: RosterStatus;
};

function csvCell(value: string): string {
  const leading = value.normalize("NFKC").replace(/^[\s\p{Cf}\p{Cc}]+/u, "");
  // Prefix formula-like values with visible text, so spreadsheets do not execute them.
  // JSON remains available for consumers that need the exact original value.
  const safe = /^[=+@-]/.test(leading) || /^[\p{Cf}\p{Cc}]/u.test(value) ? "Text: " + value : value;
  return '"' + safe.replaceAll('"', '""') + '"';
}

export function federationRosterCsv(players: readonly RosterExportPlayer[]): string {
  const rows = players.map(player =>
    [player.displayName, player.playerId, player.rosterStatus === "on_hold" ? "On hold" : "Listed"].map(csvCell).join(","),
  );
  // UTF-8 BOM lets Excel recognise non-Latin names when opening the file directly.
  return "\uFEFF" + [ "Player name,WPU Player ID,Roster status", ...rows ].join("\r\n") + "\r\n";
}
