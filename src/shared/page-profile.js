export const PAGE_PROFILES = Object.freeze({
  reader: "reader",
  portal: "portal",
  community: "community",
  form: "form",
  generic: "generic"
});

export const COMMUNITY_SUBTYPES = Object.freeze({
  none: "none",
  boardList: "board-list",
  feed: "feed",
  thread: "thread",
  commentSection: "comment-section"
});

export const PAGE_PROFILE_PRIORITY = Object.freeze([
  PAGE_PROFILES.form,
  PAGE_PROFILES.community,
  PAGE_PROFILES.reader,
  PAGE_PROFILES.portal,
  PAGE_PROFILES.generic
]);

export function normalizePageProfile(value) {
  return Object.values(PAGE_PROFILES).includes(value) ? value : PAGE_PROFILES.generic;
}

export function normalizeCommunitySubtype(value) {
  return Object.values(COMMUNITY_SUBTYPES).includes(value) ? value : COMMUNITY_SUBTYPES.none;
}

