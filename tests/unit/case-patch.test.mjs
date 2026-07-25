import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { patchHeadline, patchToneBody, buildParagraphsHtml } from '../../cases/scripts/content/lib/case-patch.mjs';

const FIXTURE = `---
front: matter
---

<section class="case-chapter" data-chapter="hook">
  <h2>TODO(test-slug): hook headline</h2>
  <div class="tone-junior">
    <p>TODO(test-slug): hook/junior copy.</p>
  </div>
  <div class="tone-mid">
    <p>TODO(test-slug): hook/mid copy.</p>
  </div>
  <div class="tone-staff">
    <p>TODO(test-slug): hook/staff copy.</p>
  </div>
</section>

<section class="case-chapter" data-chapter="concept">
  <h2>TODO(test-slug): concept headline</h2>
  <div class="tone-junior">
    <p>TODO(test-slug): concept/junior copy.</p>
  </div>
</section>
`;

describe('patchHeadline', () => {
  it('replaces the h2 inside the named chapter section only', () => {
    const patched = patchHeadline(FIXTURE, 'hook', 'A real headline');
    assert.ok(patched.includes('<h2>A real headline</h2>'));
    assert.ok(patched.includes('<h2>TODO(test-slug): concept headline</h2>'), 'concept headline left untouched');
  });

  it('returns null for a chapter that does not exist', () => {
    assert.equal(patchHeadline(FIXTURE, 'nonexistent', 'x'), null);
  });

  it('leaves tone-block content in the same chapter untouched', () => {
    const patched = patchHeadline(FIXTURE, 'hook', 'New headline');
    assert.ok(patched.includes('TODO(test-slug): hook/junior copy.'));
  });
});

describe('patchToneBody', () => {
  it('replaces only the targeted chapter/tone combination', () => {
    const patched = patchToneBody(FIXTURE, 'hook', 'junior', '<p>Real junior copy.</p>');
    assert.ok(patched.includes('<p>Real junior copy.</p>'));
    assert.ok(patched.includes('TODO(test-slug): hook/mid copy.'), 'hook/mid left untouched');
    assert.ok(patched.includes('TODO(test-slug): hook/staff copy.'), 'hook/staff left untouched');
    assert.ok(patched.includes('TODO(test-slug): concept/junior copy.'), 'concept/junior left untouched');
  });

  it('does not cross-contaminate between chapters with the same tone name', () => {
    const patched = patchToneBody(FIXTURE, 'concept', 'junior', '<p>Real concept copy.</p>');
    assert.ok(patched.includes('<p>Real concept copy.</p>'));
    assert.ok(patched.includes('TODO(test-slug): hook/junior copy.'), 'hook/junior left untouched despite same tone name');
  });

  it('returns null for a chapter that does not exist', () => {
    assert.equal(patchToneBody(FIXTURE, 'nonexistent', 'junior', '<p>x</p>'), null);
  });

  it('returns null for a tone that does not exist in an existing chapter', () => {
    assert.equal(patchToneBody(FIXTURE, 'concept', 'staff', '<p>x</p>'), null);
  });

  it('preserves inline HTML like <code> in the new body unescaped', () => {
    const patched = patchToneBody(FIXTURE, 'hook', 'junior', '<p>Uses <code>useEffect</code> correctly.</p>');
    assert.ok(patched.includes('<code>useEffect</code>'));
  });

  it('handles a tone block with nested divs without breaking on the first </div>', () => {
    const html = `<section class="case-chapter" data-chapter="hook">
      <div class="tone-junior"><div class="inner">nested</div>more text</div>
      <div class="tone-mid">mid content</div>
    </section>`;
    const patched = patchToneBody(html, 'hook', 'junior', 'replaced');
    assert.ok(patched.includes('<div class="tone-junior">\n    replaced\n  </div>'));
    assert.ok(patched.includes('mid content'), 'sibling tone block untouched');
  });
});

describe('buildParagraphsHtml', () => {
  it('wraps each string in its own <p> tag', () => {
    const html = buildParagraphsHtml(['First.', 'Second.']);
    assert.equal((html.match(/<p>/g) || []).length, 2);
    assert.ok(html.includes('First.'));
    assert.ok(html.includes('Second.'));
  });

  it('returns an empty string for an empty array', () => {
    assert.equal(buildParagraphsHtml([]), '');
  });
});
