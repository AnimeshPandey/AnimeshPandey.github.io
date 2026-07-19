/**
 * Finds which casey.json hint slots need a fresh draft — reuses
 * KNOWN_BOILERPLATE_HINTS from the social scripts (not a copy) so the
 * draft-generator's idea of "boilerplate" can never drift from the guard
 * that actually gates what gets cross-posted.
 */

import { KNOWN_BOILERPLATE_HINTS, VALID_TONES } from '../../social/lib/content.mjs';

export const DRAFT_CHAPTERS = ['concept', 'fe-depth'];

/**
 * Returns [{chapter, tone}, ...] for every (chapter, tone) slot in a case's
 * casey.json hints that is either missing or matches a known-boilerplate
 * string. Only looks at DRAFT_CHAPTERS — hook/demo are reliably
 * case-specific already and out of scope.
 */
export function findBoilerplateSlots(casey) {
  const slots = [];
  for (const chapter of DRAFT_CHAPTERS) {
    const entry = (casey?.hints ?? []).find((h) => h.chapter === chapter);
    for (const tone of VALID_TONES) {
      const text = (entry?.[tone] ?? '').trim();
      if (!text || KNOWN_BOILERPLATE_HINTS.has(text)) {
        slots.push({ chapter, tone });
      }
    }
  }
  return slots;
}
