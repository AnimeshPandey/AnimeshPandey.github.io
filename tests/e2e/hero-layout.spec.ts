import { test, expect } from '@playwright/test';

// Regression coverage for issue #9. #hero was previously found boxed with
// blank side margins on large screens — it's a <section>, so it silently
// inherited the generic `section { max-width: var(--max); margin: 0 auto }`
// rule (assets/site.css) unless explicitly reset — and separately
// over-stretched vertically on tall viewports before a `min-height:
// clamp(560px, 100svh, 880px)` cap was added at the ≥820px breakpoint. A
// screenshot at the wrong viewport can look fine by coincidence, so this
// asserts both invariants directly against computed layout instead.
const WIDTHS = [375, 768, 1024, 1440, 1920, 2560];

test.describe('Hero full-bleed layout regression (issue #9)', () => {
  for (const width of WIDTHS) {
    test(`#hero spans the full viewport width at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/');
      const hero = page.locator('#hero');
      await expect(hero).toBeVisible();
      const box = await hero.boundingBox();
      expect(box).not.toBeNull();
      // No unwanted max-width/centered-box constraint: #hero's own rendered
      // width must track the full viewport, not the content column's --max
      // (1100px at ≥1024px per assets/site.css) — a 2px tolerance covers
      // sub-pixel layout rounding, not a reintroduced max-width.
      expect(box!.width).toBeGreaterThanOrEqual(width - 2);
      expect(box!.x).toBeLessThanOrEqual(2);
    });
  }

  test('#hero height stays capped on a very tall desktop viewport', async ({ page }) => {
    // Tall enough that an uncapped `min-height: 100svh` would blow the hero
    // out past 2000px; the real fix caps it at 880px via
    // `min-height: clamp(560px, 100svh, 880px)` (assets/site.css, ≥820px).
    await page.setViewportSize({ width: 1920, height: 2400 });
    await page.goto('/');
    const box = await page.locator('#hero').boundingBox();
    expect(box).not.toBeNull();
    expect(box!.height).toBeLessThanOrEqual(900);
  });

  test('#hero height stays above its floor on a short desktop viewport', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 700 });
    await page.goto('/');
    const box = await page.locator('#hero').boundingBox();
    expect(box).not.toBeNull();
    // clamp floor is 560px; still bounded above so it can't have silently
    // regained an unbounded min-height either.
    expect(box!.height).toBeGreaterThanOrEqual(550);
    expect(box!.height).toBeLessThanOrEqual(900);
  });
});
