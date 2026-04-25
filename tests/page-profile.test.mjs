import test from "node:test";
import assert from "node:assert/strict";
import { detectCommunityProfile } from "../src/content/classifier/detect-community.js";
import { detectReaderProfile } from "../src/content/classifier/detect-reader.js";
import { PAGE_PROFILES } from "../src/shared/page-profile.js";

test("reader profile detects article-like content containers beyond article tags", () => {
  const documentLike = createDocument({
    roots: [
      createElement("div", {
        className: "post-content",
        innerText: longText(12),
        children: [
          createElement("h1", { innerText: "Guide" }),
          createElement("p", { innerText: longText(3) }),
          createElement("p", { innerText: longText(3) }),
          createElement("p", { innerText: longText(3) })
        ]
      })
    ]
  });

  const result = detectReaderProfile(documentLike);
  assert.equal(result.profile, PAGE_PROFILES.reader);
});

test("reader profile avoids link-heavy index pages", () => {
  const documentLike = createDocument({
    roots: [
      createElement("main", {
        innerText: longText(18),
        children: [
          createElement("p", { innerText: longText(1) }),
          createElement("p", { innerText: longText(1) }),
          ...Array.from({ length: 40 }, (_, index) => createElement("a", { innerText: `Link ${index}` }))
        ]
      })
    ]
  });

  const result = detectReaderProfile(documentLike);
  assert.equal(result.profile, PAGE_PROFILES.generic);
});

test("community profile recognizes Korean discussion hints", () => {
  const documentLike = createDocument({
    bodyText: "\uAC8C\uC2DC\uD310 \uB313\uAE00 \uB2F5\uAE00 \uCD94\uCC9C",
    roots: [
      ...Array.from({ length: 6 }, (_, index) =>
        createElement("div", { className: "comment", innerText: `comment ${index}` })
      )
    ]
  });

  const result = detectCommunityProfile(documentLike);
  assert.equal(result.profile, PAGE_PROFILES.community);
});

function createDocument({ roots = [], bodyText = "" } = {}) {
  return {
    body: {
      innerText: bodyText || roots.map((root) => root.innerText).join(" ")
    },
    querySelectorAll(selector) {
      return roots.filter((root) => matchesAny(root, selector)).concat(
        roots.flatMap((root) => root.querySelectorAll(selector))
      );
    }
  };
}

function createElement(tagName, options = {}) {
  const element = {
    tagName: tagName.toUpperCase(),
    id: options.id || "",
    className: options.className || "",
    innerText: options.innerText || "",
    attributes: {
      ...(options.role ? { role: options.role } : {}),
      ...(options.href ? { href: options.href } : {})
    },
    children: options.children || [],
    getAttribute(name) {
      if (name === "id") return this.id;
      if (name === "class") return this.className;
      return this.attributes[name] || "";
    },
    querySelectorAll(selector) {
      return collectDescendants(this).filter((node) => matchesAny(node, selector));
    }
  };

  return element;
}

function collectDescendants(element) {
  return element.children.flatMap((child) => [child, ...collectDescendants(child)]);
}

function matchesAny(node, selector) {
  return selector.split(",").some((part) => matchesSingle(node, part.trim()));
}

function matchesSingle(node, selector) {
  if (selector === "article") return node.tagName === "ARTICLE";
  if (selector === "main") return node.tagName === "MAIN";
  if (selector === "p") return node.tagName === "P";
  if (selector === "h1" || selector === "h2" || selector === "h3") return node.tagName === selector.toUpperCase();
  if (selector === "a[href]") return node.tagName === "A";
  if (selector === "[role='main']") return node.getAttribute("role") === "main";
  if (selector === "[role='article']") return node.getAttribute("role") === "article";

  const attributeContainsMatch = selector.match(/^\[(class|id)\*='([^']+)' i\]$/) ||
    selector.match(/^\[(class|id)\*="([^"]+)" i\]$/);
  if (attributeContainsMatch) {
    const [, attributeName, expected] = attributeContainsMatch;
    const actual = attributeName === "class" ? node.className : node.id;
    return String(actual || "").toLowerCase().includes(expected.toLowerCase());
  }

  return false;
}

function longText(repeatCount) {
  return "This paragraph has enough article-like text to make the reader classifier evaluate a normal reading flow. ".repeat(repeatCount);
}
