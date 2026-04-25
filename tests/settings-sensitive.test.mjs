import test from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_OPENAI_MODEL,
  normalizeOpenAIModel
} from "../src/shared/openai-models.js";
import {
  DEFAULT_SYNC_SETTINGS,
  applyComfortPreset,
  normalizeLocalSettings,
  normalizeSyncSettings
} from "../src/shared/settings.js";
import {
  detectSensitivePageKind,
  isSensitivePage,
  SENSITIVE_PAGE_KINDS
} from "../src/shared/sensitive-page.js";

test("local settings normalize stored AI settings and site override origins", () => {
  const normalized = normalizeLocalSettings({
    openAIApiKey: "  sk-test  ",
    openAIModel: "gpt-5.5",
    backendUrl: "http://127.0.0.1:8787///",
    siteOverrides: {
      "https://example.com": { allowAds: true },
      "not a url": { allowAds: true }
    }
  });

  assert.equal(normalized.openAIApiKey, "sk-test");
  assert.equal(normalized.openAIModel, "gpt-5.5");
  assert.equal(normalized.backendUrl, "http://127.0.0.1:8787");
  assert.deepEqual(Object.keys(normalized.siteOverrides), ["https://example.com"]);
  assert.equal(normalized.siteOverrides["https://example.com"].allowAds, true);
});

test("OpenAI model selection normalizes to supported model IDs", () => {
  assert.equal(DEFAULT_OPENAI_MODEL, "gpt-5.4-mini");
  assert.equal(normalizeOpenAIModel("gpt-5.4-nano"), "gpt-5.4-nano");
  assert.equal(normalizeOpenAIModel("unknown-model"), DEFAULT_OPENAI_MODEL);
  assert.equal(normalizeLocalSettings({ openAIModel: "unknown-model" }).openAIModel, DEFAULT_OPENAI_MODEL);
});

test("sync settings clamp numeric values and normalize booleans", () => {
  const normalized = normalizeSyncSettings({
    textScale: 999,
    lineHeight: 0.2,
    pageDensity: "spacious",
    imageSofteningEnabled: "true",
    imageSofteningStrength: "high",
    reduceMotion: "false",
    themePreset: "unknown"
  });

  assert.equal(normalized.textScale, 140);
  assert.equal(normalized.lineHeight, 1.4);
  assert.equal(normalized.pageDensity, "spacious");
  assert.equal(normalized.imageSofteningEnabled, true);
  assert.equal(normalized.imageSofteningStrength, "high");
  assert.equal(normalized.reduceMotion, false);
  assert.equal(normalized.themePreset, "original");
});

test("default sync settings are conservative except motion, autoplay, and state indicator", () => {
  assert.equal(DEFAULT_SYNC_SETTINGS.activeComfortPreset, "minimal-safe");
  assert.equal(DEFAULT_SYNC_SETTINGS.themePreset, "original");
  assert.equal(DEFAULT_SYNC_SETTINGS.reduceMotion, true);
  assert.equal(DEFAULT_SYNC_SETTINGS.muteAutoplay, true);
  assert.equal(DEFAULT_SYNC_SETTINGS.showActiveStateIndicator, true);
  assert.equal(DEFAULT_SYNC_SETTINGS.readableFontEnabled, false);
  assert.equal(DEFAULT_SYNC_SETTINGS.reduceContrastEnabled, false);
  assert.equal(DEFAULT_SYNC_SETTINGS.adRemovalEnabled, false);
  assert.equal(DEFAULT_SYNC_SETTINGS.imageSofteningEnabled, false);
  assert.equal(DEFAULT_SYNC_SETTINGS.communityAssistEnabled, false);
  assert.equal(DEFAULT_SYNC_SETTINGS.aiHelperEnabled, false);
  assert.equal(DEFAULT_SYNC_SETTINGS.pageDensity, "normal");
});

test("non-theme comfort presets preserve the original site colors", () => {
  assert.equal(applyComfortPreset(DEFAULT_SYNC_SETTINGS, "minimal-safe").themePreset, "original");
  assert.equal(applyComfortPreset(DEFAULT_SYNC_SETTINGS, "text-focused").themePreset, "original");
  assert.equal(applyComfortPreset(DEFAULT_SYNC_SETTINGS, "motion-minimal").themePreset, "original");
  assert.equal(applyComfortPreset(DEFAULT_SYNC_SETTINGS, "soft-light-calm").themePreset, "soft-light");
  assert.equal(applyComfortPreset(DEFAULT_SYNC_SETTINGS, "soft-dark-calm").themePreset, "soft-dark");
});

test("sensitive page detection catches common risky contexts", () => {
  assert.equal(
    detectSensitivePageKind({
      url: "https://example.com/checkout",
      title: "Billing details",
      visibleText: "Card number and payment review"
    }),
    SENSITIVE_PAGE_KINDS.payment
  );
  assert.equal(isSensitivePage({ title: "Account security password" }), true);
});

test("sensitive page detection does not treat ordinary image pages as uploads", () => {
  assert.equal(
    detectSensitivePageKind({
      url: "https://example.com/gallery",
      title: "이미지 갤러리",
      visibleText: "오늘의 사진과 이미지 목록"
    }),
    SENSITIVE_PAGE_KINDS.none
  );
  assert.equal(
    detectSensitivePageKind({
      url: "https://example.com/news/photo",
      title: "Photo story",
      visibleText: "A camera review with sample images"
    }),
    SENSITIVE_PAGE_KINDS.none
  );
});

test("sensitive page detection still catches upload actions", () => {
  assert.equal(
    detectSensitivePageKind({
      title: "Photo upload",
      visibleText: "Choose file to upload image"
    }),
    SENSITIVE_PAGE_KINDS.upload
  );
  assert.equal(
    detectSensitivePageKind({
      title: "사진 등록",
      visibleText: "이미지 업로드 후 제출"
    }),
    SENSITIVE_PAGE_KINDS.upload
  );
});

test("sensitive page detection ignores community chrome login and attachment labels", () => {
  assert.equal(
    detectSensitivePageKind({
      url: "https://gall.dcinside.com/board/view/?id=dcbest&no=423961",
      title: "와들와들 작년 한 해 국내 재벌 오너일가 보수 TOP 12 - 실시간 베스트 갤러리",
      visibleText: [
        "디시콘 로그인 야간모드",
        "마우스 커서를 올리면 이미지 순서를 ON/OFF 할 수 있습니다.",
        "원본 첨부파일 12본문 이미지 다운로드",
        "A2DE6024-CD64-41B7-97A8-244A86425FF5.jpg"
      ].join("\n")
    }),
    SENSITIVE_PAGE_KINDS.none
  );
});

test("sensitive page detection still catches login forms", () => {
  assert.equal(
    detectSensitivePageKind({
      title: "Member access",
      visibleText: "아이디 비밀번호 로그인"
    }),
    SENSITIVE_PAGE_KINDS.login
  );
});

test("sensitive page detection ignores informational health and footer legal text", () => {
  assert.equal(
    detectSensitivePageKind({
      url: "https://en.wikipedia.org/wiki/Autism",
      title: "Autism - Wikipedia",
      visibleText: "Autism is a neurodevelopmental condition. Diagnosis and medical research are discussed."
    }),
    SENSITIVE_PAGE_KINDS.none
  );
  assert.equal(
    detectSensitivePageKind({
      title: "Speedtest by Ookla",
      visibleText: "Privacy Policy Terms of Service Advertising"
    }),
    SENSITIVE_PAGE_KINDS.none
  );
});

test("sensitive page detection does not flag a bare /settings URL as sensitive", () => {
  assert.equal(
    detectSensitivePageKind({
      url: "https://github.com/settings/profile",
      title: "Your profile",
      visibleText: "Edit your bio, company, location and website links."
    }),
    SENSITIVE_PAGE_KINDS.none
  );
  assert.equal(
    detectSensitivePageKind({
      url: "https://example.com/account",
      title: "Your account",
      visibleText: "Recent orders and saved addresses."
    }),
    SENSITIVE_PAGE_KINDS.none
  );
});

test("sensitive page detection does not flag open-source license pages as identity", () => {
  assert.equal(
    detectSensitivePageKind({
      url: "https://github.com/torvalds/linux/blob/master/LICENSE",
      title: "LICENSE",
      visibleText: "GNU General Public License, version 2, redistributions must retain the copyright notice."
    }),
    SENSITIVE_PAGE_KINDS.none
  );
});

test("sensitive page detection ignores public-service link lists", () => {
  assert.equal(
    detectSensitivePageKind({
      url: "https://www.usa.gov/",
      title: "Making government services easier to find",
      visibleText: "Learn about passports, licenses, taxes, and government benefits."
    }),
    SENSITIVE_PAGE_KINDS.none
  );
  assert.equal(
    detectSensitivePageKind({
      url: "https://www.gov.kr/",
      title: "메인 | 정부24",
      visibleText: "민원 서비스, 여권, 운전면허, 본인확인이 필요한 서비스 안내"
    }),
    SENSITIVE_PAGE_KINDS.none
  );
});
