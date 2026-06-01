import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '../..');
const manifest = JSON.parse(
  fs.readFileSync(path.join(ROOT, 'cases/src/_data/manifest.json'), 'utf8')
);

describe('manifest.json', () => {
  it('has expected scale', () => {
    assert.ok(manifest.cases.length >= 200);
    assert.ok(manifest.stats.total >= manifest.cases.length);
  });

  it('live cases have required fields', () => {
    const live = manifest.cases.filter((c) => c.status === 'live');
    assert.ok(live.length >= 31);
    for (const c of live) {
      assert.ok(c.slug, 'slug');
      assert.ok(c.title, 'title');
      assert.ok(c.track, 'track');
      assert.ok(Array.isArray(c.chapters) && c.chapters.includes('takeaway'), c.slug);
    }
  });

  it('slug format is kebab-case', () => {
    for (const c of manifest.cases) {
      assert.match(c.slug, /^[a-z0-9]+(-[a-z0-9]+)*$/, c.slug);
    }
  });
});
