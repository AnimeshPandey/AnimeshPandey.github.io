/**
 * Turns one loaded case (see content.mjs) into channel-shaped content.
 *
 * These are excerpts/teasers built from the short hint strings already
 * authored in casey.json — not a reproduction of the full interactive case.
 * canonical_url / the outbound link is what makes that a legitimate
 * cross-post instead of duplicate content.
 */

const CREDIT_LINE =
  'Story format inspired by Growth.Design case studies (growth.design/case-studies).';

function truncate(str, max = 275) {
  if (!str || str.length <= max) return str ?? '';
  const cut = str.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(' ');
  return `${cut.slice(0, lastSpace > 0 ? lastSpace : max - 1)}…`;
}

function compact(lines) {
  return lines.filter((l) => l && l.trim().length > 0);
}

/**
 * X thread: hook → concept → demo → fe-depth → link.
 * Link only appears in the LAST tweet on purpose — see the social plan's
 * "Avoid" section on why the first tweet shouldn't carry it.
 */
export function buildXThread(c) {
  const patternLine = c.concept
    ? (c.principle ? `The pattern: ${c.principle}. ${c.concept}` : c.concept)
    : (c.principle ? `The pattern here is called ${c.principle}.` : null);

  const tweets = compact([
    truncate(c.hook),
    patternLine ? truncate(patternLine) : null,
    c.demo ? truncate(`Try it yourself: ${c.demo}`) : null,
    c.feDepth ? truncate(c.feDepth) : null,
  ]);

  tweets.push(truncate(`Full case + the live "broken vs fixed" demo: ${c.url}`, 275));

  return tweets;
}

/**
 * LinkedIn: one native text post. The link is returned separately —
 * post it as the first comment, not in the post body (LinkedIn suppresses
 * reach on posts with outbound links in the body).
 */
export function buildLinkedInPost(c) {
  const paragraphs = compact([
    c.hook,
    c.principle ? `The pattern here: ${c.principle}.` : null,
    c.concept,
    c.feDepth,
    `One of 229 planned frontend case studies at ${c.siteName ?? 'The Frontend Casebook'}. Full interactive write-up, with a live demo, linked in the first comment.`,
  ]);

  return {
    commentary: paragraphs.join('\n\n'),
    linkComment: c.url,
  };
}

/**
 * Dev.to: a short article-shaped excerpt with canonical_url back to the
 * live case. `published` is a CLI decision, not a content decision —
 * left out here on purpose; the caller sets it.
 */
export function buildDevtoArticle(c) {
  // Only emit a heading when there's real body text to put under it —
  // c.concept / c.feDepth come back empty for the boilerplate hints
  // KNOWN_BOILERPLATE_HINTS filters out (see lib/content.mjs).
  const patternSection = c.concept
    ? [c.principle ? `## The pattern: ${c.principle}` : '## The pattern', '', c.concept, '']
    : c.principle
      ? [`*The pattern here is called **${c.principle}**.*`, '']
      : [];

  const feDepthSection = c.feDepth ? ['## Where this shows up in production', '', c.feDepth, ''] : [];

  const body = [
    c.hook,
    '',
    ...patternSection,
    '## Try it',
    '',
    c.demo,
    '',
    ...feDepthSection,
    '---',
    '',
    `*This is an excerpt — the full interactive case, with the live "broken vs fixed" demo, is at [${c.siteName ?? 'The Frontend Casebook'}](${c.url}).*`,
    '',
    `*${CREDIT_LINE}*`,
  ];

  return {
    title: c.title,
    body_markdown: body.join('\n'),
    tags: c.devtoTags,
    canonical_url: c.url,
  };
}

/**
 * Instagram caption — junior-tone, mascot-forward, link at the end since
 * Instagram captions aren't clickable (the bio link carries the real URL).
 */
export function buildInstagramCaption(c) {
  const lines = [
    c.hook,
    c.principle ? `The pattern: ${c.principle}.` : null,
    '',
    'Full case + live demo — link in bio.',
    '',
    '#thefrontendcasebook #caseythecat #webdev #frontenddev',
  ].filter((line) => line !== null);
  return lines.join('\n');
}
