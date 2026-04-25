import test from "node:test";
import assert from "node:assert/strict";
import {
  normalizeEnvBoolean,
  resolveAllowedExtensionOrigins,
  resolveAllowedOrigin
} from "../server/cors.mjs";

test("default backend CORS policy restricts to the fixed extension ID", () => {
  const policy = resolveAllowedExtensionOrigins("");
  assert.equal(policy.allowAnyExtensionOrigin, false);
  assert.equal(
    resolveAllowedOrigin("chrome-extension://nibpcfbgiokcjajcglmappiehobcljjj", policy, 8787),
    "chrome-extension://nibpcfbgiokcjajcglmappiehobcljjj"
  );
  assert.equal(
    resolveAllowedOrigin("chrome-extension://abcdefghijklmnopabcdefghijklmnop", policy, 8787),
    false
  );
});

test("opt-in wildcard accepts any unpacked extension origin", () => {
  const policy = resolveAllowedExtensionOrigins("", { allowAnyExtensionOriginByDefault: true });
  assert.equal(policy.allowAnyExtensionOrigin, true);
  assert.equal(
    resolveAllowedOrigin("chrome-extension://abcdefghijklmnopabcdefghijklmnop", policy, 8787),
    "chrome-extension://abcdefghijklmnopabcdefghijklmnop"
  );
});

test("configured extension origins restrict other extensions", () => {
  const policy = resolveAllowedExtensionOrigins("chrome-extension://aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");
  assert.equal(policy.allowAnyExtensionOrigin, false);
  assert.equal(resolveAllowedOrigin("chrome-extension://aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", policy, 8787), "chrome-extension://aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");
  assert.equal(resolveAllowedOrigin("chrome-extension://bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb", policy, 8787), false);
});

test("local backend origins are allowed for health and browser checks", () => {
  const policy = resolveAllowedExtensionOrigins("chrome-extension://aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");
  assert.equal(resolveAllowedOrigin("http://127.0.0.1:8787", policy, 8787), "http://127.0.0.1:8787");
  assert.equal(resolveAllowedOrigin("http://localhost:8787", policy, 8787), "http://localhost:8787");
});

test("boolean env parser keeps explicit false values", () => {
  assert.equal(normalizeEnvBoolean("0", true), false);
  assert.equal(normalizeEnvBoolean("false", true), false);
  assert.equal(normalizeEnvBoolean("", true), true);
});
