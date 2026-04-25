import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("manifest avoids all-url schemes and keeps only required high-level permissions", async () => {
  const manifest = JSON.parse(await readFile(new URL("../src/manifest.json", import.meta.url), "utf8"));

  assert.deepEqual(manifest.permissions, ["storage", "tabs", "scripting", "declarativeNetRequest"]);
  assert.deepEqual(manifest.host_permissions, ["http://*/*", "https://*/*"]);
  assert.deepEqual(manifest.content_scripts[0].matches, ["http://*/*", "https://*/*"]);
  assert.equal(manifest.declarative_net_request.rule_resources[0].enabled, false);
  assert.equal(manifest.declarative_net_request.rule_resources[0].path, "rules/ad-block.json");
});

test("popup exposes all background AI actions", async () => {
  const [html, script] = await Promise.all([
    readFile(new URL("../src/popup/index.html", import.meta.url), "utf8"),
    readFile(new URL("../src/popup/index.js", import.meta.url), "utf8")
  ]);

  assert.match(html, /id="explain-selection"/);
  assert.match(html, /id="explain-page"/);
  assert.match(html, /id="explain-form"/);
  assert.match(script, /MESSAGE_TYPES\.explainForm/);
  assert.match(script, /runAiAction\("form"\)/);
});

test("popup exposes conservative preset and page density controls", async () => {
  const html = await readFile(new URL("../src/popup/index.html", import.meta.url), "utf8");

  assert.match(html, /value="minimal-safe"/);
  assert.match(html, /id="pageDensity"/);
  assert.match(html, /value="compact"/);
  assert.match(html, /value="spacious"/);
});

test("image softening is exposed with matching runtime contract", async () => {
  const [html, settings, contentScript, contentStyles] = await Promise.all([
    readFile(new URL("../src/popup/index.html", import.meta.url), "utf8"),
    readFile(new URL("../src/shared/settings.js", import.meta.url), "utf8"),
    readFile(new URL("../src/content/index.js", import.meta.url), "utf8"),
    readFile(new URL("../src/content/styles.css", import.meta.url), "utf8")
  ]);

  assert.match(html, /data-setting="imageSofteningEnabled"/);
  assert.match(html, /data-site-override="disableImageSoftening"/);
  assert.match(settings, /imageSofteningEnabled/);
  assert.match(contentScript, /PING/);
  assert.match(contentScript, /data-asd-image-softening/);
  assert.match(contentStyles, /data-asd-image-softening/);
  assert.match(contentStyles, /html\[data-asd-foundation\]\[data-asd-image-softening\][\s\S]*img/);
  assert.match(contentScript, /data-asd-background-image-softened/);
  assert.match(contentStyles, /data-asd-background-image-softened/);
  assert.match(contentStyles, /--asd-background-softening-image/);
  assert.match(contentStyles, /iframe\[src\*="youtube\.com\/embed"\]/);
  assert.match(contentStyles, /video:hover/);
  assert.match(contentStyles, /img:hover/);
  for (const oldKey of ["shield" + "Popups", "allow" + "Popups", "face" + "SofteningEnabled"]) {
    assert.doesNotMatch(html, new RegExp(oldKey));
  }
  for (const oldKey of ["shield" + "Popups", "allow" + "Popups", "page" + "Zoom"]) {
    assert.doesNotMatch(settings, new RegExp(oldKey));
  }
  for (const oldMarker of [
    "data-asd-shield-" + "popups",
    "data-asd-face-" + "softening",
    "page" + "Zoom"
  ]) {
    assert.doesNotMatch(contentScript, new RegExp(oldMarker));
  }
});

test("content script uses recoverable collapsed distractions", async () => {
  const [contentScript, contentStyles] = await Promise.all([
    readFile(new URL("../src/content/index.js", import.meta.url), "utf8"),
    readFile(new URL("../src/content/styles.css", import.meta.url), "utf8")
  ]);

  assert.match(contentScript, /data-asd-ad-collapsed/);
  assert.match(contentScript, /data-asd-ad-restore-for/);
  assert.match(contentScript, /syncAdRestoreControls/);
  assert.match(contentScript, /restoreAdCandidate/);
  assert.match(contentScript, /AD_MARKER_PATTERN/);
  assert.match(contentScript, /ad-slot/);
  assert.match(contentScript, /kakao_ad_area/);
  assert.match(contentScript, /view_ad_wrap/);
  assert.match(contentScript, /power_link/);
  assert.doesNotMatch(contentScript, /data-asd-ad-hidden/);
  assert.match(contentStyles, /data-asd-ad-collapsed/);
});

test("ad blocking has a toggleable network ruleset and active-tab runtime injection", async () => {
  const [rules, background, buildScript] = await Promise.all([
    readFile(new URL("../src/rules/ad-block.json", import.meta.url), "utf8"),
    readFile(new URL("../src/background/index.js", import.meta.url), "utf8"),
    readFile(new URL("../scripts/build-extension.mjs", import.meta.url), "utf8")
  ]);
  const parsedRules = JSON.parse(rules);

  assert.match(background, /updateEnabledRulesets/);
  assert.match(background, /ensureActiveTabRuntime/);
  assert.match(background, /MESSAGE_TYPES\.ping/);
  assert.match(background, /AD_BLOCK_RULESET_ID/);
  assert.match(buildScript, /"rules"/);
  assert.ok(parsedRules.some((rule) => rule.condition?.requestDomains?.includes("doubleclick.net")));
  assert.ok(parsedRules.some((rule) => rule.condition?.requestDomains?.includes("serv.ds.kakao.com")));
  assert.ok(parsedRules.some((rule) => /googlesyndication/.test(rule.condition?.urlFilter || "")));
});

test("page AI schema includes action and uncertainty fields", async () => {
  const schemas = await readFile(new URL("../src/shared/ai-schemas.js", import.meta.url), "utf8");

  assert.match(schemas, /visible_main_actions/);
  assert.match(schemas, /unknowns/);
});

test("AI client and server share the same schema source", async () => {
  const [client, server] = await Promise.all([
    readFile(new URL("../src/background/ai-client.js", import.meta.url), "utf8"),
    readFile(new URL("../server/index.mjs", import.meta.url), "utf8")
  ]);

  assert.match(client, /from "\.\.\/shared\/ai-schemas\.js"/);
  assert.match(server, /from "\.\.\/src\/shared\/ai-schemas\.js"/);
});
