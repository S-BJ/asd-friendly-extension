import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import { readFile } from "node:fs/promises";
import { DEFAULT_SITE_OVERRIDE, DEFAULT_SYNC_SETTINGS } from "../src/shared/settings.js";
import { detectSensitivePageKind } from "../src/shared/sensitive-page.js";

const contentScript = await readFile(new URL("../src/content/index.js", import.meta.url), "utf8");

test("content script default settings mirror shared settings", () => {
  assert.deepEqual(extractContentObject("DEFAULT_SETTINGS"), DEFAULT_SYNC_SETTINGS);
  assert.deepEqual(extractContentObject("DEFAULT_SITE_OVERRIDE"), DEFAULT_SITE_OVERRIDE);
});

test("content script sensitive-page behavior mirrors shared sensitive-page module", () => {
  const contentSensitive = createContentSensitiveDetector();
  const cases = [
    {
      url: "https://example.com/checkout",
      title: "Billing details",
      visibleText: "Card number and payment review"
    },
    {
      url: "https://github.com/settings/profile",
      title: "Your profile",
      visibleText: "Edit your bio, company, location and website links."
    },
    {
      url: "https://example.com/news/photo",
      title: "Photo story",
      visibleText: "A camera review with sample images"
    },
    {
      title: "Photo upload",
      visibleText: "Choose file to upload image"
    },
    {
      title: "Member access",
      visibleText: "\uC544\uC774\uB514 \uBE44\uBC00\uBC88\uD638 \uB85C\uADF8\uC778"
    }
  ];

  for (const context of cases) {
    assert.equal(contentSensitive.detect(context), detectSensitivePageKind(context));
  }
});

test("ad collapse keeps generic peripheral wrappers visible", () => {
  const adCollapse = createContentAdCollapseInternals();
  assert.doesNotMatch(adCollapse.AD_CANDIDATE_SELECTOR, /aside\[class\*="ad" i\]/);

  const genericWrapper = adCollapse.createElement({ className: "read-next" });
  const adChild = adCollapse.createElement({
    tagName: "INS",
    className: "adsbygoogle",
    parentElement: genericWrapper
  });
  assert.equal(adCollapse.resolveAdContainer(adChild), adChild);

  const adWrapper = adCollapse.createElement({ className: "ad-slot" });
  const nestedAd = adCollapse.createElement({
    tagName: "IFRAME",
    parentElement: adWrapper
  });
  assert.equal(adCollapse.resolveAdContainer(nestedAd), adWrapper);
});

function extractContentObject(name) {
  const marker = `const ${name} = `;
  const start = contentScript.indexOf(marker);
  assert.notEqual(start, -1, `${name} declaration should exist in content script`);

  const openBrace = contentScript.indexOf("{", start + marker.length);
  const closeBrace = findMatchingBrace(contentScript, openBrace);
  return Function(`"use strict"; return (${contentScript.slice(openBrace, closeBrace + 1)});`)();
}

function createContentSensitiveDetector() {
  const start = contentScript.indexOf("const SENSITIVE_PAGE_KINDS");
  const end = contentScript.indexOf("const DEFAULT_SETTINGS", start);
  assert.notEqual(start, -1, "SENSITIVE_PAGE_KINDS should exist in content script");
  assert.notEqual(end, -1, "DEFAULT_SETTINGS should follow sensitive-page declarations");

  const context = {};
  vm.runInNewContext(
    `${contentScript.slice(start, end)}
    function __detectSensitivePageKind({ url = "", title = "", visibleText = "", hasInteractiveSensitiveControl = false } = {}) {
      const pageHaystack = \`\${url} \${title}\`.slice(0, 1000);
      const visibleHaystack = String(visibleText || "").slice(0, 4000);
      const canUseVisibleText = Boolean(hasInteractiveSensitiveControl);
      for (const [kind, pagePattern, visiblePattern] of SENSITIVE_PATTERNS) {
        if (pagePattern.test(pageHaystack)) return kind;
        if (canUseVisibleText && visiblePattern.test(visibleHaystack)) return kind;
      }
      return SENSITIVE_PAGE_KINDS.none;
    }
    globalThis.__contentSensitive = {
      detect: __detectSensitivePageKind
    };`,
    context
  );
  return context.__contentSensitive;
}

function createContentAdCollapseInternals() {
  const selectorStart = contentScript.indexOf("const AD_CANDIDATE_SELECTOR");
  const selectorEnd = contentScript.indexOf("const BACKGROUND_IMAGE_CANDIDATE_SELECTOR", selectorStart);
  const functionsStart = contentScript.indexOf("function resolveAdContainer");
  const functionsEnd = contentScript.indexOf("function syncReadingRuler", functionsStart);
  assert.notEqual(selectorStart, -1, "AD_CANDIDATE_SELECTOR should exist in content script");
  assert.notEqual(selectorEnd, -1, "BACKGROUND_IMAGE_CANDIDATE_SELECTOR should follow ad constants");
  assert.notEqual(functionsStart, -1, "resolveAdContainer should exist in content script");
  assert.notEqual(functionsEnd, -1, "syncReadingRuler should follow ad collapse declarations");

  const context = {
    document: {},
    window: { innerWidth: 1200, innerHeight: 900 }
  };
  vm.runInNewContext(
    `
    class FakeElement {
      constructor({ tagName = "DIV", id = "", className = "", attrs = {}, parentElement = null, rect = {} } = {}) {
        this.tagName = tagName.toUpperCase();
        this.id = id;
        this.className = className;
        this.attrs = { ...attrs };
        this.parentElement = parentElement;
        this.children = [];
        this.rect = { width: 300, height: 120, ...rect };
        if (parentElement) parentElement.children.push(this);
      }

      getAttribute(name) {
        if (name === "id") return this.id || null;
        if (name === "class") return this.className || null;
        return Object.prototype.hasOwnProperty.call(this.attrs, name) ? this.attrs[name] : null;
      }

      hasAttribute(name) {
        if (name === "id") return Boolean(this.id);
        if (name === "class") return Boolean(this.className);
        return Object.prototype.hasOwnProperty.call(this.attrs, name);
      }

      closest(selector) {
        let current = this;
        while (current) {
          if (current.matches(selector)) return current;
          current = current.parentElement;
        }
        return null;
      }

      matches(selector) {
        return String(selector).split(",").some((part) => this.matchesOne(part.trim()));
      }

      matchesOne(selector) {
        if (!selector) return false;
        const tag = this.tagName.toLowerCase();
        const classes = String(this.className || "").split(/\\s+/).filter(Boolean);
        if (selector === tag) return true;
        if (selector.startsWith(".") && classes.includes(selector.slice(1))) return true;

        const tagClass = selector.match(/^([a-z]+)\\.([\\w-]+)$/i);
        if (tagClass) return tag === tagClass[1].toLowerCase() && classes.includes(tagClass[2]);

        const attrExists = selector.match(/^\\[([^\\]=]+)\\]$/);
        if (attrExists) return this.hasAttribute(attrExists[1]);

        const attrContains = selector.match(/^\\[([^\\]*=]+)\\*=["']?([^"\\']+)["']? i\\]$/i);
        if (attrContains) {
          return String(this.getAttribute(attrContains[1]) || "").toLowerCase().includes(attrContains[2].toLowerCase());
        }

        const tagAttrContains = selector.match(/^([a-z]+)\\[([^\\]*=]+)\\*=["']?([^"\\']+)["']? i\\]$/i);
        if (tagAttrContains) {
          return tag === tagAttrContains[1].toLowerCase() &&
            String(this.getAttribute(tagAttrContains[2]) || "").toLowerCase().includes(tagAttrContains[3].toLowerCase());
        }

        const roleEquals = selector.match(/^\\[role=['"]([^'"]+)['"]\\]$/);
        if (roleEquals) return this.getAttribute("role") === roleEquals[1];

        return false;
      }

      querySelector(selector) {
        const queue = [...this.children];
        while (queue.length) {
          const current = queue.shift();
          if (current.matches(selector)) return current;
          queue.push(...current.children);
        }
        return null;
      }

      getBoundingClientRect() {
        return this.rect;
      }
    }

    globalThis.Element = FakeElement;
    document.body = new FakeElement({ tagName: "BODY" });
    document.documentElement = new FakeElement({ tagName: "HTML" });
    ${contentScript.slice(selectorStart, selectorEnd)}
    ${contentScript.slice(functionsStart, functionsEnd)}
    globalThis.__contentAdCollapse = {
      AD_CANDIDATE_SELECTOR,
      resolveAdContainer,
      isLikelyAdElement,
      createElement: (options) => new FakeElement(options)
    };
    `,
    context
  );
  return context.__contentAdCollapse;
}

function findMatchingBrace(value, openBrace) {
  assert.notEqual(openBrace, -1, "Object literal should have an opening brace");
  let depth = 0;
  let quote = "";
  let escaped = false;

  for (let index = openBrace; index < value.length; index += 1) {
    const char = value[index];
    if (quote) {
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === quote) {
        quote = "";
      }
      continue;
    }

    if (char === "\"" || char === "'") {
      quote = char;
      continue;
    }

    if (char === "{") depth += 1;
    if (char === "}") {
      depth -= 1;
      if (depth === 0) return index;
    }
  }

  throw new Error("Object literal closing brace was not found.");
}
