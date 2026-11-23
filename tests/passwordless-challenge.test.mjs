import test from "node:test";
import assert from "node:assert/strict";
import {
  generateVerificationCode, normalizeEmail, digestVerificationCode,
  verifyVerificationCode, canAttemptCode, CODE_TTL_MS, MAX_CODE_ATTEMPTS
} from "../src/lib/auth/challenge.ts";

const pepper = "test-only-pepper-0123456789-abcdef-0123456789";
test("generates six numeric digits", () => {
  for (let i=0;i<100;i++) assert.match(generateVerificationCode(), /^\d{6}$/);
});
test("normalizes email and rejects invalid input", () => {
  assert.equal(normalizeEmail("  Player@Example.COM "), "player@example.com");
  assert.throws(() => normalizeEmail("not-an-email"));
});
test("code digest is bound to email and challenge and rejects incorrect codes", () => {
  const hash = digestVerificationCode("PLAYER@example.com", "challenge-1", "004321", pepper);
  assert.match(hash, /^[0-9a-f]{64}$/);
  assert.equal(verifyVerificationCode("player@example.com", "challenge-1", "004321", pepper, hash), true);
  assert.equal(verifyVerificationCode("player@example.com", "challenge-1", "004322", pepper, hash), false);
  assert.equal(verifyVerificationCode("other@example.com", "challenge-1", "004321", pepper, hash), false);
  assert.equal(verifyVerificationCode("player@example.com", "challenge-2", "004321", pepper, hash), false);
  assert.equal(verifyVerificationCode("player@example.com", "challenge-1", "bad", pepper, hash), false);
});
test("enforces expiry, consumption and attempt cap", () => {
  const now = Date.now();
  assert.equal(canAttemptCode({now, expiresAt:now+CODE_TTL_MS,consumed:false,attempts:0}), true);
  assert.equal(canAttemptCode({now, expiresAt:now,consumed:false,attempts:0}), false);
  assert.equal(canAttemptCode({now, expiresAt:now+CODE_TTL_MS,consumed:true,attempts:0}), false);
  assert.equal(canAttemptCode({now, expiresAt:now+CODE_TTL_MS,consumed:false,attempts:MAX_CODE_ATTEMPTS}), false);
});
