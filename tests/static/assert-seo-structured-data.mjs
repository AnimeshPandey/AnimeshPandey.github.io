#!/usr/bin/env node
/**
 * assert-seo-structured-data.mjs — verify JSON-LD structured data on key pages.
 *
 * Checks:
 *   - Hub has WebSite + ItemList schema
 *   - A sample case page has LearningResource + BreadcrumbList schema
 *   - BreadcrumbList does not contain ?track= query URLs (broken breadcrumb regression)
 *   - Account page carries robots noindex
 */
import { readFileSync, existsSync } from 'fs';
import path from 'path';
import { deployRoot } from './deploy-root.mjs';

const DEPLOY = deployRoot();
const errors = [];

function readHtml(rel) {
  const file = path.join(DEPLOY, rel);
  if (!existsSync(file)) { errors.push(`Missing: ${rel}`); return ''; }
  return readFileSync(file, 'utf8');
}

function extractJsonLd(html) {
  const schemas = [];
  const re = /<script[^>]+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    try { schemas.push(JSON.parse(m[1])); } catch (_) {}
  }
  return schemas;
}

function hasType(schemas, type) {
  return schemas.some((s) => {
    if (s['@type'] === type) return true;
    if (s['@graph']) return s['@graph'].some((n) => n['@type'] === type);
    return false;
  });
}

// ── Hub ───────────────────────────────────────────────────────────────────────
const hubHtml = readHtml('cases/index.html');
if (hubHtml) {
  const schemas = extractJsonLd(hubHtml);
  if (!hasType(schemas, 'WebSite')) errors.push('hub: missing WebSite JSON-LD');
  if (!hasType(schemas, 'ItemList')) errors.push('hub: missing ItemList JSON-LD (case discovery carousel)');
}

// ── Sample case ───────────────────────────────────────────────────────────────
const SAMPLE_SLUG = 'abort-controller-ghost-updates';
const caseHtml = readHtml(`cases/${SAMPLE_SLUG}/index.html`);
if (caseHtml) {
  const schemas = extractJsonLd(caseHtml);
  if (!hasType(schemas, 'LearningResource')) errors.push(`${SAMPLE_SLUG}: missing LearningResource JSON-LD`);
  if (!hasType(schemas, 'BreadcrumbList')) errors.push(`${SAMPLE_SLUG}: missing BreadcrumbList JSON-LD`);

  // BreadcrumbList must not contain ?track= (broken URL regression)
  const breadcrumb = schemas.flatMap((s) =>
    s['@type'] === 'BreadcrumbList' ? [s] : (s['@graph'] || []).filter((n) => n['@type'] === 'BreadcrumbList')
  );
  for (const bc of breadcrumb) {
    const items = bc.itemListElement || [];
    for (const item of items) {
      const id = item['@id'] || (item.item && item.item['@id']) || '';
      if (id.includes('?track=')) {
        errors.push(`${SAMPLE_SLUG}: BreadcrumbList item has ?track= query URL — regression (was ${id})`);
      }
    }
  }

  // LearningResource must have isAccessibleForFree and learningResourceType
  const lr = schemas.flatMap((s) =>
    s['@type'] === 'LearningResource' ? [s] : (s['@graph'] || []).filter((n) => n['@type'] === 'LearningResource')
  );
  for (const r of lr) {
    if (!r.isAccessibleForFree) errors.push(`${SAMPLE_SLUG}: LearningResource missing isAccessibleForFree`);
    if (!r.learningResourceType) errors.push(`${SAMPLE_SLUG}: LearningResource missing learningResourceType`);
  }
}

// ── Account page noindex ──────────────────────────────────────────────────────
const accountHtml = readHtml('cases/account/index.html');
if (accountHtml && !/noindex/.test(accountHtml)) {
  errors.push('account page: missing <meta name="robots" content="noindex"> — should not be crawled');
}

if (errors.length) {
  console.error('SEO structured data check FAILED:');
  errors.forEach((e) => console.error('  ✗', e));
  process.exit(1);
}
console.log('OK: JSON-LD schemas valid — WebSite, ItemList, LearningResource, BreadcrumbList, account noindex');
