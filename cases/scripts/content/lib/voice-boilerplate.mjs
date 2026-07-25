/**
 * Finds which casey.json voice.sections slots are empty or generic
 * boilerplate — the spoken-aloud counterpart to lib/boilerplate.mjs's
 * hint-slot check. A structurally identical problem in a different JSON
 * field (voice.sections vs hints), found on 2026-07-25 while investigating
 * a complaint about per-case audio quality: 47% of voice slots across all
 * 31 live cases were either an empty string or one of a handful of
 * templated sentences ("This section covers takeaway for <slug>.",
 * "Connect the principle to your component API...") that were never
 * caught by KNOWN_BOILERPLATE_HINTS, because that guard only ever looked
 * at the hints field.
 *
 * Kept as its own list (not merged into KNOWN_BOILERPLATE_HINTS) because
 * the two fields serve different purposes — hints are short margin notes,
 * voice is spoken-aloud script — and a string generic enough to flag in
 * one context isn't necessarily the same string that would appear
 * boilerplate in the other.
 */

export const VOICE_CHAPTERS = ['hook', 'concept', 'demo', 'takeaway'];
export const VALID_TONES = ['junior', 'mid', 'staff'];

export const KNOWN_VOICE_BOILERPLATE_MARKERS = [
  'This section covers',
  'read it before the demo',
  'Connect the principle',
  'Map the pattern to observability',
];

function isBoilerplate(text) {
  const trimmed = (text ?? '').trim();
  if (!trimmed) return true;
  return KNOWN_VOICE_BOILERPLATE_MARKERS.some((marker) => trimmed.includes(marker));
}

/**
 * Returns [{chapter, tone}, ...] for every voice.sections slot that is
 * empty or matches a known-boilerplate marker. Scans all 4 chapters
 * (unlike the hints check, which only looks at concept/fe-depth) since
 * voice sections don't have the same "hook/demo are reliably specific
 * already" property the hints field does.
 */
export function findVoiceBoilerplateSlots(casey) {
  const slots = [];
  const sections = casey?.voice?.sections ?? [];
  for (const chapter of VOICE_CHAPTERS) {
    const section = sections.find((s) => s.chapter === chapter);
    for (const tone of VALID_TONES) {
      if (isBoilerplate(section?.[tone])) {
        slots.push({ chapter, tone });
      }
    }
  }
  return slots;
}
