#!/usr/bin/env node
/**
 * assert-casey-html-bust.mjs — verify the BUILD_ID stamp ran and Casey img
 * URLs carry the versioned ?v= query string in the deployed hub page.
 *
 * Must run AFTER the "Stamp deploy build id" CI step so the placeholder
 * has already been replaced.
 */
import { readFileSync, existsSync } from 'fs';
import path from 'path';
import { deployRoot } from './deploy-root.mjs';

const DEPLOY = deployRoot();
const HUB_HTML = path.join(DEPLOY, 'cases/index.html');

if (!existsSync(HUB_HTML)) {
  console.error(`assert-casey-html-bust: hub HTML not found at ${HUB_HTML}`);
  process.exit(1);
}

const html = readFileSync(HUB_HTML, 'utf8');
const errors = [];

// 1. Build ID must be stamped — no unreplaced placeholder anywhere in HTML
if (html.includes('__AP_BUILD_ID__')) {
  errors.push('__AP_BUILD_ID__ placeholder still present — stamp step did not run before this check');
}

// 2. <html> tag must carry a real data-ap-build-id (7-char hex)
const buildIdMatch = html.match(/data-ap-build-id="([^"]+)"/);
if (!buildIdMatch) {
  errors.push('data-ap-build-id attribute missing from <html> tag');
} else if (!/^[a-f0-9]{7}$/.test(buildIdMatch[1])) {
  errors.push(`data-ap-build-id="${buildIdMatch[1]}" is not a 7-char hex BUILD_ID`);
}

// 3. Casey hub avatar src must carry ?v=<buildid>
const caseyVersioned = /casey\/junior\/present\.png\?v=[a-f0-9]{7}/.test(html);
if (!caseyVersioned) {
  errors.push('casey/junior/present.png?v=<buildid> not found in hub HTML — cache-bust missing');
}

// 4. No Casey img src should still have a bare .png without ?v= (guard regression)
const caseyBareImgs = html.match(/casey\/\w+\/[a-z]+\.png(?!\?v=)/g);
if (caseyBareImgs && caseyBareImgs.length > 0) {
  errors.push(`${caseyBareImgs.length} casey img(s) without ?v= query: ${[...new Set(caseyBareImgs)].join(', ')}`);
}

if (errors.length) {
  console.error('Casey HTML cache-bust check FAILED:');
  errors.forEach((e) => console.error('  ✗', e));
  process.exit(1);
}
console.log(`OK: hub HTML is stamped with build-id "${buildIdMatch[1]}" and Casey img URLs are versioned`);
