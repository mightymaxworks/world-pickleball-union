import assert from "node:assert/strict";
import test from "node:test";
import { parsePassportPatch } from "../src/lib/passport/profile.ts";
import { isResidenceCountry, regionLabel, residenceCountries } from "../src/lib/passport/regions.ts";

const parse = body => parsePassportPatch(body, isResidenceCountry);

test("normalizes structured profile fields without deriving or changing the display name", () => {
  assert.deepEqual(parse({ givenName: "  卓玛 ", familyName: " ", residenceCountry: "BT", locality: " Thimphu ", gender: "female" }), {
    kind: "profile", fields: { givenName: "卓玛", familyName: null, residenceCountry: "BT", locality: "Thimphu", gender: "female" },
  });
  assert.deepEqual(parse({ name: " My display name " }), { kind: "profile", fields: { name: "My display name" } });
  assert.deepEqual(parse({ locality: "Singapore" }), { kind: "profile", fields: { locality: "Singapore" } });
});

test("country changes require a locality and only shared registration countries are writable", () => {
  for (const body of [{ residenceCountry: "SG" }, { residenceCountry: "ZZ", locality: "Somewhere" }, { residenceCountry: "sg", locality: "Singapore" }, { residenceCountry: "SG", locality: "" }]) {
    assert.equal(parse(body).kind, "invalid");
  }
  assert.equal(regionLabel("BT"), "Bhutan");
  assert.equal(regionLabel("ZZ"), "");
  assert.equal(new Set(residenceCountries.map(x => x.code)).size, residenceCountries.length);
});

test("rejects invalid or noneditable fields without a partial update", () => {
  for (const body of [
    null, {}, [], { name: " " }, { name: "a".repeat(161) }, { givenName: "a".repeat(81) }, { familyName: "a".repeat(80) },
    { locality: "a".repeat(121) }, { name: "Name\nLine" }, { gender: null }, { gender: "" },
    { name: "New", playerCode: "different" }, { accountId: "different" }, { email: "mail@example.org" },
    { membershipStatus: "active" }, { visibility: "public" }, { visibility: "private", name: "New" },
  ]) assert.equal(parse(body).kind, "invalid", JSON.stringify(body));
  assert.deepEqual(parse({ visibility: "private" }), { kind: "privacy" });
});
