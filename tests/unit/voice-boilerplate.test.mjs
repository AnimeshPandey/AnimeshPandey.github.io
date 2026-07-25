import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { findVoiceBoilerplateSlots } from '../../cases/scripts/content/lib/voice-boilerplate.mjs';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '../..');
const CASES = path.join(ROOT, 'cases/src/cases');

describe('findVoiceBoilerplateSlots', () => {
  it('flags an empty string as boilerplate', () => {
    const casey = { voice: { sections: [{ chapter: 'hook', junior: 'Real text', mid: '', staff: 'Real text' }] } };
    const slots = findVoiceBoilerplateSlots(casey);
    assert.ok(slots.some((s) => s.chapter === 'hook' && s.tone === 'mid'));
    assert.ok(!slots.some((s) => s.chapter === 'hook' && s.tone === 'junior'));
  });

  it('flags a known generic marker string', () => {
    const goodSection = (chapter) => ({ chapter, junior: `${chapter} junior real text`, mid: `${chapter} mid real text`, staff: `${chapter} staff real text` });
    const casey = {
      voice: {
        sections: [
          goodSection('hook'),
          goodSection('concept'),
          goodSection('demo'),
          { chapter: 'takeaway', junior: 'This section covers takeaway for some-slug.', mid: 'Real specific line about the fix.', staff: 'Real specific line about the tradeoff.' },
        ],
      },
    };
    const slots = findVoiceBoilerplateSlots(casey);
    assert.deepEqual(slots, [{ chapter: 'takeaway', tone: 'junior' }]);
  });

  it('does not flag genuinely specific, non-empty text', () => {
    const casey = {
      voice: {
        sections: [
          { chapter: 'hook', junior: 'A specific line about this exact bug.', mid: 'Another specific line.', staff: 'A third specific line.' },
        ],
      },
    };
    assert.equal(findVoiceBoilerplateSlots(casey).filter((s) => s.chapter === 'hook').length, 0);
  });

  it('treats a missing casey.voice as fully boilerplate', () => {
    const slots = findVoiceBoilerplateSlots({});
    assert.equal(slots.length, 12); // 4 chapters x 3 tones, all missing
  });
});

describe('real repo assets (regression baseline)', () => {
  it('no live case has boilerplate/empty voice-script slots after the 2026-07-25 fix', () => {
    const manifest = JSON.parse(readFileSync(path.join(ROOT, 'cases/src/_data/manifest.json'), 'utf8'));
    const liveSlugs = manifest.cases.filter((c) => c.status === 'live').map((c) => c.slug);
    let flaggedCount = 0;
    for (const slug of liveSlugs) {
      const casey = JSON.parse(readFileSync(path.join(CASES, slug, 'casey.json'), 'utf8'));
      flaggedCount += findVoiceBoilerplateSlots(casey).length;
    }
    assert.equal(flaggedCount, 0);
  });
});
