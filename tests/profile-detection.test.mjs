import test from "node:test";
import assert from "node:assert/strict";
import { detectFormProfile } from "../src/content/classifier/detect-form.js";
import { PAGE_PROFILES } from "../src/shared/page-profile.js";

test("form profile ignores routine community comment and search widgets", () => {
  const documentLike = createDocument([
    createElement("form", {
      id: "comment_write",
      className: "comment reply-form",
      innerText: "댓글 등록 첨부파일",
      children: [
        createElement("textarea", { name: "memo", placeholder: "댓글 입력" }),
        createElement("input", { type: "file", name: "upload" }),
        createElement("button", { innerText: "등록" })
      ]
    }),
    createElement("form", {
      id: "top_search",
      innerText: "검색",
      children: [
        createElement("input", { type: "text", name: "keyword", placeholder: "검색" }),
        createElement("button", { innerText: "검색" })
      ]
    }),
    createElement("form", {
      innerText: "제목+내용",
      children: [
        createElement("select", { name: "search_type" }),
        createElement("input", { type: "text", name: "search_keyword" }),
        createElement("button")
      ]
    }),
    createElement("form", {
      id: "member_login",
      className: "login-box",
      innerText: "로그인 비밀번호",
      children: [
        createElement("input", { type: "text", name: "user_id" }),
        createElement("input", { type: "password", name: "password" }),
        createElement("button", { innerText: "로그인" })
      ]
    })
  ]);

  const result = detectFormProfile(documentLike, { communityMatched: true });
  assert.equal(result.profile, PAGE_PROFILES.generic);
});

test("form profile still catches high-risk forms inside community pages", () => {
  const documentLike = createDocument([
    createElement("form", {
      id: "payment",
      innerText: "Payment billing card number",
      children: [
        createElement("input", { type: "text", name: "card_number" }),
        createElement("input", { type: "text", name: "billing_address" }),
        createElement("button", { innerText: "Pay now" })
      ]
    })
  ]);

  const result = detectFormProfile(documentLike, { communityMatched: true });
  assert.equal(result.profile, PAGE_PROFILES.form);
});

test("form profile ignores standalone anonymous comment password fields", () => {
  const documentLike = createDocument(
    [],
    [
      createElement("div", {
        id: "focus_cmt",
        className: "view_comment",
        innerText: "댓글 등록 닉네임 비밀번호",
        children: [
          createElement("input", {
            type: "password",
            name: "password",
            id: "password_423961",
            placeholder: "비밀번호"
          })
        ]
      })
    ]
  );

  const result = detectFormProfile(documentLike, { communityMatched: true });
  assert.equal(result.profile, PAGE_PROFILES.generic);
});

test("form profile does not treat ordinary newsletter email as high-risk", () => {
  const documentLike = createDocument([
    createElement("form", {
      id: "newsletter",
      innerText: "Subscribe to updates",
      children: [
        createElement("input", { type: "email", name: "email" }),
        createElement("button", { innerText: "Subscribe" })
      ]
    })
  ]);

  const result = detectFormProfile(documentLike);
  assert.equal(result.profile, PAGE_PROFILES.generic);
});

function createDocument(forms, roots = []) {
  const documentRoots = [...forms, ...roots];
  return {
    querySelectorAll(selector) {
      if (selector === "form") return forms;
      return documentRoots.flatMap((root) => root.querySelectorAll(selector));
    }
  };
}

function createElement(tagName, options = {}) {
  const element = {
    tagName: tagName.toUpperCase(),
    id: options.id || "",
    className: options.className || "",
    innerText: options.innerText || "",
    value: options.value || "",
    attributes: {
      ...(options.type ? { type: options.type } : {}),
      ...(options.name ? { name: options.name } : {}),
      ...(options.placeholder ? { placeholder: options.placeholder } : {}),
      ...(options.autocomplete ? { autocomplete: options.autocomplete } : {}),
      ...(options.ariaLabel ? { "aria-label": options.ariaLabel } : {}),
      ...(options.action ? { action: options.action } : {})
    },
    children: options.children || [],
    parentElement: null,
    getAttribute(name) {
      if (name === "id") return this.id;
      if (name === "class") return this.className;
      return this.attributes[name] || "";
    },
    querySelectorAll(selector) {
      return collectDescendants(this).filter((node) => matchesAny(node, selector));
    },
    querySelector(selector) {
      return this.querySelectorAll(selector)[0] || null;
    },
    closest(selector) {
      let node = this;
      while (node) {
        if (matchesAny(node, selector)) return node;
        node = node.parentElement;
      }
      return null;
    }
  };

  for (const child of element.children) {
    child.parentElement = element;
  }

  return element;
}

function collectDescendants(element) {
  return element.children.flatMap((child) => [child, ...collectDescendants(child)]);
}

function matchesAny(node, selector) {
  return selector.split(",").some((part) => matchesSingle(node, part.trim()));
}

function matchesSingle(node, selector) {
  if (selector === "form") return node.tagName === "FORM";
  if (selector === "input") return node.tagName === "INPUT";
  if (selector === "select") return node.tagName === "SELECT";
  if (selector === "textarea") return node.tagName === "TEXTAREA";
  if (selector === "button") return node.tagName === "BUTTON";
  if (selector === "input[type=\"password\"]" || selector === "input[type='password']") {
    return node.tagName === "INPUT" && node.getAttribute("type") === "password";
  }
  if (selector === "input[type=\"file\"]" || selector === "input[type='file']") {
    return node.tagName === "INPUT" && node.getAttribute("type") === "file";
  }
  if (selector === "input[type='submit']" || selector === "input[type=\"submit\"]") {
    return node.tagName === "INPUT" && node.getAttribute("type") === "submit";
  }
  if (selector === "input[type='button']" || selector === "input[type=\"button\"]") {
    return node.tagName === "INPUT" && node.getAttribute("type") === "button";
  }
  if (selector === ".view_comment" || selector === ".cmt_write_box") {
    return hasClass(node, selector.slice(1));
  }

  const attributeContainsMatch = selector.match(/^\[(class|id)\*="([^"]+)" i\]$/);
  if (attributeContainsMatch) {
    const [, attributeName, expected] = attributeContainsMatch;
    const actual = attributeName === "class" ? node.className : node.id;
    return String(actual || "").toLowerCase().includes(expected.toLowerCase());
  }

  const containsMatch = selector.match(/^input\[(name|autocomplete)\*="([^"]+)" i\]$/);
  if (containsMatch) {
    const [, attributeName, expected] = containsMatch;
    return node.tagName === "INPUT" && node.getAttribute(attributeName).toLowerCase().includes(expected.toLowerCase());
  }

  return false;
}

function hasClass(node, className) {
  return String(node.className || "")
    .split(/\s+/)
    .includes(className);
}
